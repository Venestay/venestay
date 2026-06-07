import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, differenceInDays, isWithinInterval, startOfDay } from 'date-fns';
import {
  db,
  storage
} from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { getExchangeRates } from '@/services/exchange-service';
import { calculateTrustScore } from '@/services/user-service';
import * as bookingService from '@/services/booking-service';
import { useBookingDraft } from '@/features/bookings/hooks/useBookingDraft';
import { parseLocalDate, calculatePaymentBreakdown } from '@/lib/utils';
import { CommissionTier } from '@/lib/commission';
import {
  Booking,
  Listing,
  BookingStatus,
  PaymentMethod,
  ExchangeRates,
  UCPTransactionPayload
} from '@/types';

export const useCheckout = (urlBookingId: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileData, loading: authLoading, emailVerified } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestsEditorOpen, setIsGuestsEditorOpen] = useState(false);
  const [hasConsentedPolicy, setHasConsentedPolicy] = useState(false);
  const [guestMessage, setGuestMessage] = useState('');

  const isDraft = booking?.isDraft || !booking?.id;
  const isPaymentPhase = !isDraft && booking?.status === 'PENDING_PAYMENT';
  const isRequestPhase = listing?.bookingMode === 'request' && !isPaymentPhase;

  useEffect(() => {
    if (listing && !guestMessage) {
      setGuestMessage(`Hola ${listing.hostName || 'Anfitrión'}, me encantaría solicitar una reserva en tu propiedad para mis próximas fechas.`);
    }
  }, [listing, guestMessage]);

  const { saveDraft, clearDraft } = useBookingDraft();

  const [reservedDates, setReservedDates] = useState<{ start: Date; end: Date }[]>([]);
  const [softReservedDates, setSoftReservedDates] = useState<{ start: Date; end: Date }[]>([]);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  const stayTriggerRef = useRef<HTMLButtonElement>(null);
  const guestsTriggerRef = useRef<HTMLButtonElement>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [hostPaymentMethods, setHostPaymentMethods] = useState<PaymentMethod[]>([]);
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  const availablePaymentMethods = useMemo(() => {
    const listMethods = listing?.paymentMethods || [];
    const hMethods = hostPaymentMethods || [];

    if (listMethods.length === 0 && hMethods.length === 0) return [];

    const primaryMethods = listMethods.length > 0 ? listMethods : hMethods;

    return primaryMethods.map(method => {
      if (!method.data?.accountHolder) {
        const matchingHostMethod = hMethods.find(hm => hm.type === method.type);
        if (matchingHostMethod?.data?.accountHolder) {
          return {
            ...method,
            data: {
              ...method.data,
              accountHolder: matchingHostMethod.data.accountHolder
            }
          };
        }
      }
      return method;
    });
  }, [listing?.paymentMethods, hostPaymentMethods]);

  const trustScore = useMemo(() => {
    if (!profileData) return 0;
    return calculateTrustScore(profileData);
  }, [profileData]);

  const isBlockedByTrust = useMemo(() => {
    return trustScore < 40;
  }, [trustScore]);

  const isKycVerified = useMemo(() => {
    const kycStatus = profileData?.kycStatus;
    return kycStatus === 'VERIFIED' || profileData?.isIdentityVerified === true;
  }, [profileData]);

  const isFormDisabled = useMemo(() => {
    if (isSubmitting) return true;
    
    // FASE 1: Usuario No Autenticado -> Totalmente habilitado para capturar el clic y abrir el AuthModal
    if (!user) return false;
    
    // FASE 2: Usuario Autenticado sin KYC -> Totalmente habilitado para capturar el clic y guiar a verificación
    if (!isKycVerified) return false;
    
    // FASE 3: Usuario Autenticado y Verificado -> Exigir validaciones estrictas de pasarela de pago
    if (isBlockedByTrust) return true;
    if (!hasConsentedPolicy) return true;
    
    // Si estamos en fase de solicitud (Request), no exigimos comprobante ni referencia
    if (isRequestPhase) return false;
    
    return !reference.trim() || !file;
  }, [isSubmitting, isBlockedByTrust, hasConsentedPolicy, user, isKycVerified, reference, file, isRequestPhase]);

  useEffect(() => {
    const fetchDraftData = async () => {
      const state = location.state as { bookingData: unknown } | null;
      const params = new URLSearchParams(location.search);

      const listingId =
        (state?.bookingData as { listingId?: string })?.listingId || params.get('listingId');
      const start = (state?.bookingData as { startDate?: string })?.startDate || params.get('startDate');
      const end = (state?.bookingData as { endDate?: string })?.endDate || params.get('endDate');
      const guests = (state?.bookingData as { guests?: string })?.guests || params.get('guests');

      if (!listingId || !start || !end) {
        setError(
          'Información de reserva incompleta o sesión expirada. Regresa a la propiedad.'
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const listingSnap = await getDoc(doc(db, 'listings', listingId));
        if (listingSnap.exists()) {
          const lData = {
            id: listingSnap.id,
            ...listingSnap.data(),
          } as Listing;
          setListing(lData);

          // v2.2 Host Audit for Commission Tier (Resilient Mode)
          let hostTier: CommissionTier = 12;
          let hMethods: PaymentMethod[] = [];
          if (lData.hostId) {
            try {
              const hostSnap = await getDoc(doc(db, 'users', lData.hostId));
              if (hostSnap.exists()) {
                const hData = hostSnap.data();
                const { getCommissionTier } = await import('@/lib/commission');
                hostTier = getCommissionTier(
                  hData.isVerified || false,
                  hData.completedBookings || 0
                );
                if (hData.paymentMethods && Array.isArray(hData.paymentMethods)) {
                  hMethods = hData.paymentMethods as PaymentMethod[];
                  setHostPaymentMethods(hData.paymentMethods as PaymentMethod[]);
                }
              }
            } catch (tierError) {
              console.warn(
                'Checkout: Fallo al obtener métricas del anfitrión. Usando Tier base (12%).',
                tierError
              );
            }
          }

          const sDate = new Date(start);
          const eDate = new Date(end);
          const nights =
            !isNaN(sDate.getTime()) && !isNaN(eDate.getTime())
              ? Math.max(0, differenceInDays(eDate, sDate))
              : 0;
          const total = nights * lData.pricePerNight;

          const { calculateCommission } = await import('@/lib/commission');
          const financials = calculateCommission(total, hostTier);

          setBooking({
            listingId,
            startDate: start,
            endDate: end,
            guests: parseInt(guests || '2'),
            totalAmount: total,
            financials, // Persist current financial law
            status: 'PENDING_PAYMENT' as BookingStatus,
            isDraft: true,
          } as Booking);

          const listMethods = lData.paymentMethods || [];
          const finalMethods = listMethods.length > 0 ? listMethods : hMethods;
          const enrichedMethods = finalMethods.map(method => {
            if (!method.data?.accountHolder) {
              const matchingHostMethod = hMethods.find(hm => hm.type === method.type);
              if (matchingHostMethod?.data?.accountHolder) {
                return {
                  ...method,
                  data: {
                    ...method.data,
                    accountHolder: matchingHostMethod.data.accountHolder
                  }
                };
              }
            }
            return method;
          });

          if (enrichedMethods.length > 0) {
            setSelectedMethod(enrichedMethods[0]);
          }
        } else {
          setError('Propiedad no encontrada.');
        }
      } catch (err) {
        console.error('Error fetching draft data:', err);
        setError('Error al cargar datos del borrador.');
      } finally {
        setLoading(false);
      }
    };

    if (urlBookingId) {
      const unsubscribe = onSnapshot(
        doc(db, 'bookings', urlBookingId),
        async (docSnap) => {
          if (docSnap.exists()) {
            const bookingData = docSnap.data();
            setBooking({ id: docSnap.id, ...bookingData } as Booking);

            if (!listing) {
              const listingSnap = await getDoc(
                doc(db, 'listings', bookingData.listingId)
              );
              if (listingSnap.exists()) {
                const data = listingSnap.data() as Listing;
                setListing({ id: listingSnap.id, ...data });

                let hMethods: PaymentMethod[] = [];
                if (data.hostId) {
                  try {
                    const hostSnap = await getDoc(doc(db, 'users', data.hostId));
                    if (hostSnap.exists()) {
                      const hData = hostSnap.data();
                      if (hData && hData.paymentMethods && Array.isArray(hData.paymentMethods)) {
                        hMethods = hData.paymentMethods as PaymentMethod[];
                        setHostPaymentMethods(hData.paymentMethods as PaymentMethod[]);
                      }
                    }
                  } catch (hostError) {
                    console.warn('Checkout: Fallo al obtener métodos del anfitrión.', hostError);
                  }
                }

                const listMethods = data.paymentMethods || [];
                const finalMethods = listMethods.length > 0 ? listMethods : hMethods;
                const enrichedMethods = (finalMethods as PaymentMethod[]).map((method: PaymentMethod) => {
                  if (!method.data?.accountHolder) {
                    const matchingHostMethod = hMethods.find(hm => hm.type === method.type) as PaymentMethod | undefined;
                    if (matchingHostMethod && matchingHostMethod.data && matchingHostMethod.data.accountHolder) {
                      return {
                        ...method,
                        data: {
                          ...method.data,
                          accountHolder: matchingHostMethod.data.accountHolder as string
                        }
                      };
                    }
                  }
                  return method;
                });

                if (enrichedMethods.length > 0) {
                  setSelectedMethod(enrichedMethods[0]);
                }
              }
            }
            setLoading(false);
          } else {
            setError('Reserva no encontrada.');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Checkout: Error in booking sync:', error);
          setError('Error al sincronizar datos de la reserva.');
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      fetchDraftData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBookingId, location.search, location.state]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const realRates = await getExchangeRates();
        setRates(realRates);
      } catch (err) {
        console.error('Error fetching rates:', err);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    if (!listing?.id) return;
    const fetchReserved = async () => {
      try {
        const ranges = await bookingService.getReservedDates(listing.id);
        const confirmed = ranges.filter(r => r.type === 'confirmed').map(r => ({ start: r.start, end: r.end }));
        const pending = ranges.filter(r => r.type === 'pending').map(r => ({ start: r.start, end: r.end }));
        
        if (listing.blockedDates && listing.blockedDates.length > 0) {
          const { parseISO } = await import('date-fns');
          listing.blockedDates.forEach((dateStr) => {
            const date = parseISO(dateStr);
            confirmed.push({ start: date, end: date });
          });
        }
        
        setReservedDates(confirmed);
        setSoftReservedDates(pending);
      } catch (err) {
        console.error('Error fetching reserved dates:', err);
      }
    };
    fetchReserved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const convertedAmount = useMemo(() => {
    if (!booking || !rates || !selectedMethod) return null;
    if (
      selectedMethod.type === 'PagoMovil' ||
      selectedMethod.type === 'Transferencia'
    ) {
      return booking.totalAmount * rates.bcv;
    }
    return null;
  }, [booking, rates, selectedMethod]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(key);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleGuestsChange = async (newGuests: number) => {
    if (newGuests < 1 || !listing || newGuests > listing.maxGuests || !booking) return;

    const newBooking = {
      ...booking,
      guests: newGuests,
    };

    setBooking(newBooking);

    if (!booking.isDraft && booking.id) {
      try {
        await updateDoc(doc(db, 'bookings', booking.id), {
          guests: newGuests,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Error updating guests:', err);
      }
    }
  };

  const handleDateChange = async (start: Date | null, end: Date | null) => {
    if (!listing || !booking) return;

    const newBooking = {
      ...booking,
      startDate: start ? format(start, 'yyyy-MM-dd') : booking.startDate,
      endDate: end ? format(end, 'yyyy-MM-dd') : start ? '' : booking.endDate,
    };

    if (start && end) {
      const nights = differenceInDays(end, start);
      const total = nights * listing.pricePerNight;

      let hostTier: CommissionTier = 12;
      try {
        const hostSnap = await getDoc(doc(db, 'users', listing.hostId));
        if (hostSnap.exists()) {
          const hData = hostSnap.data();
          const { getCommissionTier } = await import('@/lib/commission');
          hostTier = getCommissionTier(
            hData.isVerified || false,
            hData.completedBookings || 0
          );
        }
      } catch (tierError) {
        console.warn('Checkout: Error recalculando tier en cambio de fechas.', tierError);
      }

      const { calculateCommission } = await import('@/lib/commission');
      newBooking.totalAmount = total;
      newBooking.financials = calculateCommission(total, hostTier);

      setBooking(newBooking);

      if (!booking.isDraft && booking.id) {
        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            startDate: newBooking.startDate,
            endDate: newBooking.endDate,
            totalAmount: total,
            financials: newBooking.financials,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Error updating dates:', err);
        }
      }
    } else {
      setBooking(newBooking);
    }
  };

  const processAndSetFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Por favor sube una imagen válida (JPG, PNG).');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const options = {
        maxSizeMB: 0.75,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const compressed = await imageCompression(selectedFile, options);
      setFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      console.warn('Error comprimiendo comprobante client-side, usando archivo original:', err);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistDraftAndReturn = () => {
    if (!booking || !listing) return;
    saveDraft({
      listingId: listing.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests ?? 2,
      returnUrl: window.location.pathname + window.location.search,
    });
  };

  const handleGoToPassport = () => {
    persistDraftAndReturn();
    setShowKYCModal(false);
    navigate('/mi-pasaporte');
  };

  const handleSubmitPayment = async () => {
    if (!user) {
      persistDraftAndReturn();
      setShowAuthModal(true);
      return;
    }

    if (!booking || !listing) return;

    if (!emailVerified) {
      setError('Debes verificar tu correo electrónico antes de reservar. Revisa tu bandeja o haz clic en reenviar desde tu sesión.');
      return;
    }

    const kycStatus = profileData?.kycStatus;
    const isKycVerified =
      kycStatus === 'VERIFIED' || profileData?.isIdentityVerified === true;

    if (!isKycVerified && kycStatus !== 'PENDING_REVIEW') {
      persistDraftAndReturn();
      setShowKYCModal(true);
      return;
    }

    const isRequestMode = isRequestPhase;

    if (!isRequestMode) {
      if (!file || !reference.trim()) {
        setError(
          'Por favor sube tu comprobante de pago y escribe el número de referencia.'
        );
        return;
      }
    }

    if (isBlockedByTrust) {
      setError(
        `Tu nivel de confianza (${trustScore}%) es insuficiente para reservar. El mínimo requerido es 40%.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let currentBookingId = urlBookingId;

      if (booking.isDraft) {
        const initialStatus = isRequestMode ? 'PENDING_APPROVAL' : 'PENDING_PAYMENT';
        const expiresAtVal = isRequestMode
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        const bookingData: Partial<Booking> = {
          listingId: listing.id,
          listingTitle: listing.title,
          guestId: user.uid,
          guestName: user.displayName || 'Huésped',
          ownerId: listing.hostId || 'admin',
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount,
          agreedPercentage: 20,
          status: initialStatus as BookingStatus,
          bookingMode: listing.bookingMode || 'instant',
          guestMessage: isRequestMode ? guestMessage : undefined,
          expiresAt: expiresAtVal,
          paymentInstructions: listing.paymentInstructions || '',
          guests: booking.guests,
          cancellationPolicySnapshot: listing.cancellationPolicy ?? 'non_refundable_reschedulable',
          statusHistory: [
            {
              status: initialStatus as BookingStatus,
              timestamp: new Date().toISOString(),
              actorId: user.uid,
              actorName: user.displayName || 'Huésped',
              note: isRequestMode
                ? 'Solicitud de reserva enviada para aprobación del anfitrión'
                : 'Reserva creada desde el proceso de checkout (flujo frictionless)',
            },
          ],
        };

        currentBookingId = await bookingService.createBookingWithTransaction(
          bookingData,
          isRequestMode ? guestMessage : undefined
        );
      } else if (isRequestMode && currentBookingId) {
        const expiresAtVal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const historyEntry = {
          status: 'PENDING_APPROVAL' as BookingStatus,
          timestamp: new Date().toISOString(),
          actorId: user.uid,
          actorName: user.displayName || 'Huésped',
          note: 'Solicitud de reserva enviada para aprobación del anfitrión',
        };

        await updateDoc(doc(db, 'bookings', currentBookingId), {
          status: 'PENDING_APPROVAL',
          guestMessage: guestMessage || '',
          bookingMode: 'request',
          expiresAt: expiresAtVal,
          updatedAt: serverTimestamp(),
          statusHistory: [...(booking.statusHistory || []), historyEntry],
        });

        if (guestMessage?.trim()) {
          await addDoc(collection(db, 'messages'), {
            bookingId: currentBookingId,
            senderId: user.uid,
            senderName: user.displayName || 'Huésped',
            text: guestMessage,
            type: 'text',
            status: 'sent',
            createdAt: serverTimestamp(),
          });
        }
      }

      if (!currentBookingId) throw new Error('No booking ID available');

      if (isRequestMode && (!file || !reference.trim())) {
        setUploadSuccess(true);
        clearDraft();
        return;
      }

      const compressedFile = file!;
      const fileName = `${Date.now()}_receipt.jpg`;
      const storageRef = ref(
        storage,
        `bookings/${currentBookingId}/payments/${fileName}`
      );
      const metadata = {
        contentType: 'image/jpeg',
        cacheControl: 'public,max-age=31536000',
      };

      let proofUrl = '';
      try {
        await uploadBytes(storageRef, compressedFile, metadata);
        proofUrl = await getDownloadURL(storageRef);
      } catch (uploadError: unknown) {
        if (
          (uploadError as { code?: string }).code === 'storage/unauthorized' ||
          (uploadError as Error).message?.includes('storage/unauthorized') ||
          (uploadError as Error).message?.includes('does not have permission')
        ) {
          proofUrl =
            'https://placehold.co/600x400/2a3b5c/ffffff?text=Comprobante+(Storage+Bloqueado)';
          console.warn(
            'Storage is unauthorized. Using fallback URL.'
          );
        } else {
          throw uploadError;
        }
      }

      const ucpPayload: UCPTransactionPayload = {
        transactionId: currentBookingId,
        intent: 'escrow_deposit',
        currency:
          selectedMethod?.type === 'PagoMovil' ||
          selectedMethod?.type === 'Transferencia'
            ? 'VES'
            : 'USD',
        amounts: {
          total: booking.totalAmount,
          depositRequired: calculatePaymentBreakdown(booking.totalAmount, 12, listing.cleaningFee || 0).depositAmount,
          offlineBalance: calculatePaymentBreakdown(booking.totalAmount, 12, listing.cleaningFee || 0).remainingBalance,
        },
        metadata: { agenticReady: true },
      };

      await addDoc(collection(db, `bookings/${currentBookingId}/payments`), {
        ...ucpPayload,
        reference,
        proofUrl,
        method: selectedMethod?.type || 'P2P',
        methodLabel: selectedMethod?.label || 'Manual',
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });

      const bookingRef = doc(db, 'bookings', currentBookingId);
      await updateDoc(bookingRef, {
        status: isRequestMode ? 'PENDING_APPROVAL' : 'AWAITING_VERIFICATION',
        proofUrl,
        paymentReference: reference,
        financials: booking.financials || null,
        updatedAt: serverTimestamp(),
        statusHistory: [
          ...(booking.statusHistory || []),
          {
            status: isRequestMode ? 'PENDING_APPROVAL' : 'AWAITING_VERIFICATION',
            timestamp: new Date().toISOString(),
            actorId: user.uid,
            actorName: user.displayName || 'Huésped',
            note: isRequestMode 
              ? 'Solicitud enviada adjuntando comprobante de pago preliminar'
              : 'Comprobante de pago subido desde página de checkout',
          },
        ],
      });

      setUploadSuccess(true);
      clearDraft();
      if (booking.isDraft) {
        navigate(`/checkout/${currentBookingId}`, { replace: true });
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setError((err as Error).message || 'Error al procesar el pago. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalNights = useMemo(() => {
    if (!booking?.startDate || !booking?.endDate) return 0;
    const start = parseLocalDate(booking.startDate);
    const end = parseLocalDate(booking.endDate);
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return Math.max(0, differenceInDays(end, start));
  }, [booking]);

  const hasSoftBlockConflict = useMemo(() => {
    if (!booking?.startDate || !booking?.endDate) return false;
    const start = parseLocalDate(booking.startDate);
    const end = parseLocalDate(booking.endDate);
    if (!start || !end) return false;

    return softReservedDates.some((range) => {
      const rangeStart = startOfDay(range.start);
      const rangeEnd = startOfDay(range.end);
      const bStart = startOfDay(start);
      const bEnd = startOfDay(end);
      
      return (
        isWithinInterval(rangeStart, { start: bStart, end: bEnd }) ||
        isWithinInterval(rangeEnd, { start: bStart, end: bEnd }) ||
        isWithinInterval(bStart, { start: rangeStart, end: rangeEnd })
      );
    });
  }, [booking, softReservedDates]);

  return {
    booking,
    setBooking,
    listing,
    loading,
    error,
    file,
    setFile,
    previewUrl,
    reference,
    setReference,
    isCopied,
    isSubmitting,
    uploadSuccess,
    isChatOpen,
    setIsChatOpen,
    isMyTripsOpen,
    setIsMyTripsOpen,
    showAuthModal,
    setShowAuthModal,
    showKYCModal,
    setShowKYCModal,
    isCalendarOpen,
    setIsCalendarOpen,
    isGuestsEditorOpen,
    setIsGuestsEditorOpen,
    hasConsentedPolicy,
    setHasConsentedPolicy,
    guestMessage,
    setGuestMessage,
    isDraft,
    isPaymentPhase,
    isRequestPhase,
    reservedDates,
    softReservedDates,
    calendarRef,
    guestsRef,
    stayTriggerRef,
    guestsTriggerRef,
    selectedMethod,
    setSelectedMethod,
    rates,
    availablePaymentMethods,
    trustScore,
    isBlockedByTrust,
    isKycVerified,
    isFormDisabled,
    convertedAmount,
    totalNights,
    hasSoftBlockConflict,
    handleSubmitPayment,
    handleGuestsChange,
    handleDateChange,
    handleCopy,
    handleGoToPassport,
    processAndSetFile,
    authLoading,
    user,
    profileData,
    emailVerified,
  };
};
