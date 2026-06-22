import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Users,
  Globe,
  ShieldAlert,
  CreditCard,
  Upload,
  Loader2,
  CheckCircle2,
  MessageSquare,
  X,
  Copy,
  Check,
  ChevronRight,
  Smartphone,
  Landmark,
  Sparkles,
  Info,
  PlusCircle,
  QrCode,
} from 'lucide-react';
import {
  Listing,
  Booking,
  BookingDetails,
  BookingStatus,
  PaymentMethod,
  ExchangeRates,
  UCPTransactionPayload,
} from '@/types';
import { CommissionTier } from '@/lib/commission';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { getExchangeRates, HIDE_BCV_PRICES } from '@/services/exchange-service';
import { db, storage } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn, safeFormat, calculatePaymentBreakdown, parseLocalDate } from '@/lib/utils';
import { toast } from 'sonner';
import Chat from '@/components/Chat';
import { calculateTrustScore } from '@/services/user-service';
import * as bookingService from '@/services/booking-service';
import Skeleton from '@/components/ui/Skeleton';
import AuthModal from '@/features/auth/components/AuthModal';
import KYCRequiredModal from '@/features/auth/components/KYCRequiredModal';
import Calendar from '@/features/bookings/components/Calendar';

import PaymentBanner from '@/features/bookings/components/checkout/PaymentBanner';
import { calculateCancellationDeadline } from '@/features/bookings/hooks/useCancellationDeadline';
import { CANCELLATION_POLICIES } from '@/features/listings/utils/cancellationPolicies';
import { CancellationPolicyType } from '@/features/listings/types';
import { useBookingDraft } from '@/features/bookings/hooks/useBookingDraft';
import { Calendar as CalendarIcon } from 'lucide-react';

// Correos de administración/QA que marcan una reserva como prueba
const QA_TEST_EMAILS = [
  'anfitrionvenestay@venestay.com',
  'rodriguezzcarlose@gmail.com',
  'zabalareduardoc@gmail.com',
];

function isQaTestEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return (
    lower.endsWith('@venestay.com') ||
    QA_TEST_EMAILS.includes(lower)
  );
}

const CheckoutPage: React.FC = () => {
  const { bookingId: urlBookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileData, loading: authLoading } = useAuth();

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

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
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
    return trustScore < 25;
  }, [trustScore]);

  const isKycVerified = useMemo(() => {
    return profileData?.canBook === true;
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
                if (hData.paymentMethods && hData.paymentMethods.length > 0) {
                  hMethods = hData.paymentMethods;
                  setHostPaymentMethods(hData.paymentMethods);
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

            if (bookingData.status === 'PENDING_APPROVAL') {
              toast.info('Tu solicitud está en espera de aprobación.');
              navigate('/', { replace: true });
              return;
            }

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
                      if (hData.paymentMethods && hData.paymentMethods.length > 0) {
                        hMethods = hData.paymentMethods;
                        setHostPaymentMethods(hData.paymentMethods);
                      }
                    }
                  } catch (hostError) {
                    console.warn('Checkout: Fallo al obtener métodos del anfitrión.', hostError);
                  }
                }

                const listMethods = data.paymentMethods || [];
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
    // Fetch exchange rates
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
    if (newGuests < 1 || !listing || newGuests > listing.maxGuests) return;

    const newBooking = {
      ...booking,
      guests: newGuests,
    };

    setBooking(newBooking);

    // Update Firestore if not draft
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
    if (!listing) return;

    // Create new booking state with available dates
    const newBooking = {
      ...booking,
      startDate: start ? format(start, 'yyyy-MM-dd') : booking.startDate,
      endDate: end ? format(end, 'yyyy-MM-dd') : start ? '' : booking.endDate,
    };

    if (start && end) {
      const nights = differenceInDays(end, start);
      const total = nights * listing.pricePerNight;
      newBooking.totalAmount = total;

      // Recalculate financials with the same tier
      const currentTier = booking.financials?.commissionTier || 12;
      const { calculateCommission } = await import('@/lib/commission');
      newBooking.financials = calculateCommission(total, currentTier);

      setBooking(newBooking);
      setIsCalendarOpen(false);

      // If NOT a draft, update Firestore
      if (!booking.isDraft && booking.id) {
        try {
          await updateDoc(doc(db, 'bookings', booking.id), {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
            totalAmount: total,
            financials: newBooking.financials,
            updatedAt: serverTimestamp(),
            statusHistory: [
              ...(booking.statusHistory || []),
              {
                status: booking.status,
                timestamp: new Date().toISOString(),
                actorId: user?.uid || 'guest',
                actorName: user?.displayName || 'Huésped',
                note: 'Fechas modificadas desde el checkout',
              },
            ],
          });
        } catch (err) {
          console.error('Error updating dates:', err);
        }
      }
    } else if (start) {
      // Just update start date selection state
      setBooking(newBooking);
    }
  };

  const ensureBooking = async () => {
    if (!booking || !listing || !user || !booking.isDraft) return booking?.id;

    setIsSubmitting(true);
    try {
      const bookingData = {
        listingId: listing.id,
        listingTitle: listing.title,
        guestId: user.uid,
        guestName: user.displayName || 'Huésped',
        ownerId: listing.hostId || 'admin',
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        financials: booking.financials || null,
        agreedPercentage: 20,
        status: 'PENDING_PAYMENT' as BookingStatus,
        paymentInstructions: listing.paymentInstructions || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        guests: booking.guests,
        cancellationPolicySnapshot: listing.cancellationPolicy ?? 'moderate',
        statusHistory: [
          {
            status: 'PENDING_PAYMENT' as BookingStatus,
            timestamp: new Date().toISOString(),
            actorId: user.uid,
            actorName: user.displayName || 'Huésped',
            note: 'Reserva creada automáticamente al entrar al checkout',
          },
        ],
        isTestBooking: (() => {
          try {
            return isQaTestEmail(user.email);
          } catch { return false; }
        })(),
        appBaseUrl: window.location.origin,
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      setBooking({ id: docRef.id, ...bookingData, isDraft: false } as Booking);
      navigate(`/checkout/${docRef.id}`, { replace: true });
      return docRef.id;
    } catch (err) {
      console.error('Error creating booking:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-create booking if user is logged in — NEVER auto-create for request mode.
  // In request mode the booking must only be created/updated when the guest explicitly submits.
  useEffect(() => {
    const isRequestMode = listing?.bookingMode === 'request';
    if (user && booking?.isDraft && listing && !loading && !isSubmitting && !isRequestMode) {
      ensureBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, booking?.isDraft, listing, loading]);

  // Click outside logic to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close calendar if click is outside
      if (
        isCalendarOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        stayTriggerRef.current &&
        !stayTriggerRef.current.contains(target)
      ) {
        setIsCalendarOpen(false);
      }

      // Close guests editor if click is outside
      if (
        isGuestsEditorOpen &&
        guestsRef.current &&
        !guestsRef.current.contains(target) &&
        guestsTriggerRef.current &&
        !guestsTriggerRef.current.contains(target)
      ) {
        setIsGuestsEditorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen, isGuestsEditorOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processAndSetFile(selectedFile);
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

  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      if (isRequestPhase) return;
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const fileBlob = items[i].getAsFile();
          if (fileBlob) {
            processAndSetFile(fileBlob);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [isRequestPhase]);

  /**
   * Persiste el borrador de reserva en localStorage (TTL 4h) para que el
   * usuario pueda reanudar el checkout tras completar Auth o KYC.
   */
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

  /** Guarda el draft y navega al pasaporte para completar KYC */
  const handleGoToPassport = (section?: string) => {
    persistDraftAndReturn();
    setShowKYCModal(false);
    navigate(`/mi-pasaporte${section ? `?section=${section}` : ''}`);
  };

  const handleSubmitPayment = async () => {
    // 1. Verificar autenticación primero
    if (!user) {
      persistDraftAndReturn();
      setShowAuthModal(true);
      return;
    }

    if (!booking || !listing) return;

    // 2. Verificar Fase 1 de KYC (canBook)
    const canBook = profileData?.canBook === true;

    if (!canBook) {
      persistDraftAndReturn();
      setShowKYCModal(true);
      return;
    }

    const isRequestMode = isRequestPhase;

    // 3. Check Input (solo si no es modo solicitud de reserva)
    if (!isRequestMode) {
      if (!file || !reference.trim()) {
        setError(
          'Por favor sube tu comprobante de pago y escribe el número de referencia.'
        );
        return;
      }
    }

    // 4. Check Trust Score Gatekeeper (VeneStay Passport)
    if (isBlockedByTrust) {
      setError(
        `Tu nivel de confianza (${trustScore}%) es insuficiente para reservar. El mínimo requerido es 25%.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let currentBookingId = urlBookingId;

      // STEP 1: Create or update the booking document.
      if (booking.isDraft) {
        // Draft path: booking not yet in Firestore — create it via atomic transaction.
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
          bookingMode: listing.bookingMode,
          guestMessage: isRequestMode ? guestMessage : undefined,
          expiresAt: expiresAtVal,
          paymentInstructions: listing.paymentInstructions || '',
          guests: booking.guests,
          cancellationPolicySnapshot: listing.cancellationPolicy ?? 'moderate',
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
          isTestBooking: (() => {
            try {
              return isQaTestEmail(user.email);
            } catch { return false; }
          })(),
        };

        currentBookingId = await bookingService.createBookingWithTransaction(
          bookingData,
          isRequestMode ? guestMessage : undefined
        );
      } else if (isRequestMode && currentBookingId) {
        // Fix B — Non-draft request booking: ensureBooking already created the doc with
        // PENDING_PAYMENT (wrong status). Patch it now with the correct values.
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

        // Save guest message to root /messages collection so FloatingChat can read it.
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

      // STEP 2: If request mode with no proof, the submission is complete here.
      if (isRequestMode && (!file || !reference.trim())) {
        setUploadSuccess(true);
        clearDraft();
        return;
      }

      // 4. Use already compressed file (or original fallback)
      const compressedFile = file!;

      // 5. Upload to Storage
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
          // Fallback to a dummy URL so testing can proceed if storage rules are locked
          proofUrl =
            'https://placehold.co/600x400/2a3b5c/ffffff?text=Comprobante+(Storage+Bloqueado)';
          console.warn(
            'Storage is unauthorized. Using fallback URL. Please update Firebase Storage rules in the console.'
          );
        } else {
          throw uploadError;
        }
      }

      // 6. Create Payment record adhering to UCP structure
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
          depositRequired: calculatePaymentBreakdown(booking.totalAmount).depositAmount,
          offlineBalance: calculatePaymentBreakdown(booking.totalAmount).remainingBalance,
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

      // 7. Update Booking status (PENDING_APPROVAL si es request, AWAITING_VERIFICATION si es instant)
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
      clearDraft(); // Limpiar draft al completar
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
      // Check if any day in the softReserved range falls inside our booking range
      // or if any day in our booking range falls inside the softReserved range
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

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col overflow-hidden bg-white md:flex-row">
        <div className="grow space-y-12 p-12 md:w-[65%]">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Skeleton className="h-64 rounded-[35px]" />
            <Skeleton className="h-64 rounded-[35px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-[35px]" />
            <Skeleton className="h-32 w-full rounded-[35px]" />
          </div>
        </div>
        <div className="hidden bg-gray-50 p-12 md:block md:w-[35%]">
          <Skeleton className="h-full w-full rounded-[40px]" />
        </div>
      </div>
    );
  }

  if (error || !booking || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-12 text-center">
        <ShieldAlert className="mb-6 h-16 w-16 text-red-500" />
        <h2 className="text-brand-navy mb-4 text-2xl font-black tracking-tight uppercase">
          ¡Vaya! Algo salió mal
        </h2>
        <p className="mb-8 max-w-md text-gray-500">
          {error || 'No pudimos cargar la información de la reserva.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-brand-navy rounded-2xl px-10 py-4 text-xs font-black tracking-widest text-white uppercase"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Tab flotante del chat (Desktop) con aviso dorado parpadeante */}
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="fixed right-0 top-1/3 z-40 hidden md:flex items-center gap-3 bg-brand-navy text-white pl-5 pr-4 py-4 rounded-l-2xl shadow-2xl transition-all duration-300 hover:-translate-x-1 cursor-pointer border border-brand-500/20 group"
      >
        <div className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75 shadow-[0_0_8px_#c5a059]" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 shadow-[0_0_6px_#c5a059]" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-500">
          Chat Soporte
        </span>
        <MessageSquare className="h-4 w-4 text-brand-500 group-hover:scale-110 transition-transform" />
      </button>

      {/* Main Content Area: Payment & Booking Info (100% width on Desktop) */}
      <div className="no-scrollbar h-screen overflow-y-auto pb-24 w-full">
        {/* Navigation Bar */}
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 px-4 py-8 backdrop-blur-xl md:px-12">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => {
                  if (booking.isDraft) {
                    navigate(`/listing/${listing.id}`);
                  } else {
                    navigate('/mis-viajes');
                  }
                }}
                className="group rounded-2xl p-3 transition-all hover:bg-gray-100"
              >
                <ArrowLeft className="text-brand-navy h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </button>
              <div>
                <h1 className="text-brand-navy text-xl leading-none font-black tracking-tighter uppercase md:text-2xl">
                  Mi Reserva
                </h1>
                <div className="mt-2 flex items-center space-x-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      booking.status === 'PENDING_PAYMENT'
                        ? 'bg-brand-500 animate-pulse'
                        : 'bg-emerald-500'
                    )}
                  />
                  <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    {booking.status === 'PENDING_PAYMENT'
                      ? 'Pago Pendiente'
                      : 'En Verificación'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarea 3 — Guardia: acuerdo cerrado, no editable */}
        {!isDraft && (
          <div className="sticky top-[73px] z-10 border-b border-amber-100 bg-amber-50 px-4 py-2.5 md:px-12">
            <div className="max-w-5xl mx-auto flex items-center gap-2.5">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-[10px] font-black tracking-wide text-amber-800 uppercase">
                Este acuerdo está cerrado. Los términos fueron pactados con el anfitrión. Si necesitas un cambio, usa el chat.
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-5xl space-y-12 px-6 py-10 md:px-12">
          {uploadSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6 rounded-[40px] border border-emerald-100 bg-emerald-50 p-12 text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-brand-navy text-3xl font-black tracking-tight">
                {listing?.bookingMode === 'request' ? '¡Solicitud Enviada!' : '¡Estancia Asegurada!'}
              </h2>
              <p className="mx-auto max-w-md leading-relaxed font-medium text-gray-600">
                {listing?.bookingMode === 'request'
                  ? `Tu mensaje y pasaporte han sido presentados a ${listing.hostName || 'el anfitrión'}. Recibirás una respuesta en un plazo máximo de 24 horas. ¡Puedes chatear con el anfitrión ahora mismo!`
                  : 'Hemos enviado tu comprobante al anfitrión. Recibirás una notificación una vez que sea validado (usualmente en 2-4 horas).'}
              </p>
              <div className="flex flex-col justify-center items-center gap-4 pt-4 sm:flex-row">
                <button
                  onClick={() => navigate('/mis-viajes')}
                  className="bg-brand-500 hover:bg-brand-400 text-brand-navy rounded-2xl px-10 py-4 text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-brand-500/10 flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Ver Mis Reservas
                </button>
                {listing?.bookingMode === 'request' && (
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy rounded-2xl px-10 py-4 text-xs font-black tracking-widest text-white uppercase transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chatear con Anfitrión
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className={cn(
                    "text-xs font-black tracking-widest uppercase transition-all px-10 py-4 rounded-2xl",
                    listing?.bookingMode === 'request'
                      ? "text-gray-500 hover:text-brand-navy"
                      : "bg-brand-navy hover:bg-brand-500 hover:text-brand-navy text-white"
                  )}
                >
                  Explorar más estancias
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {hasSoftBlockConflict && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:flex-row">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                      <Clock className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-amber-800 text-sm font-black uppercase tracking-wider">Alta Demanda</h4>
                      <p className="text-amber-700 mt-1 text-xs">
                        Otro usuario está en proceso de pago para estas mismas fechas. Puedes continuar, pero la reserva se otorgará a quien el anfitrión valide primero.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Section */}
              <section className="space-y-6">
                <div className="flex flex-col items-start gap-8 rounded-[40px] border border-gray-100 bg-gray-50 p-8 md:flex-row md:items-center">
                  <div className="h-36 w-full overflow-hidden rounded-3xl border-4 border-white shadow-lg md:w-48">
                    <img
                      src={
                        listing.images?.[0] ||
                        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800'
                      }
                      className="h-full w-full object-cover"
                      alt="Listing"
                    />
                  </div>
                  <div className="grow space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
                        {listing.propertyType || 'Propiedad'}
                      </span>
                      <span className="text-gray-300">|</span>
                      <div className="text-brand-navy flex items-center text-[10px] font-black">
                        <Star className="text-brand-500 fill-brand-500 mr-1 h-3 w-3" />
                        {listing.rating}
                      </div>
                    </div>
                    <h3 className="text-brand-navy text-2xl leading-tight font-black">
                      {listing.title}
                    </h3>
                    <div className="flex items-center text-xs font-bold text-gray-400">
                      <MapPin className="mr-1 h-3 w-3" />
                      {listing.location}
                    </div>

                    {/* User Passport Check Section */}
                    <div className={cn(
                      "mt-4 flex items-center gap-4 rounded-3xl p-4 border transition-all",
                      isBlockedByTrust 
                        ? "bg-red-50 border-red-100" 
                        : "bg-emerald-50 border-emerald-100"
                    )}>
                      <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-2xl shadow-sm",
                        isBlockedByTrust ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                      )}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="grow">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-[10px] font-black tracking-widest uppercase",
                            isBlockedByTrust ? "text-red-600" : "text-emerald-600"
                          )}>
                            Pasaporte VeneStay
                          </p>
                          <span className={cn(
                            "text-xs font-black",
                            isBlockedByTrust ? "text-red-700" : "text-emerald-700"
                          )}>
                            {trustScore}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${trustScore}%` }}
                            className={cn(
                              "h-full rounded-full",
                              isBlockedByTrust ? "bg-red-500" : "bg-emerald-500"
                            )}
                          />
                        </div>
                        {isBlockedByTrust && (
                          <button 
                            onClick={() => {
                              if (!user) {
                                setShowAuthModal(true);
                              } else {
                                navigate('/mi-pasaporte');
                              }
                            }}
                            className="mt-2 text-[9px] font-black text-red-600 underline decoration-2 underline-offset-2 hover:text-red-700 uppercase"
                          >
                            Completar Pasaporte para Reservar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="relative w-full flex-1">
                    <button
                      ref={stayTriggerRef}
                      disabled={!isDraft}
                      onClick={() => {
                        setIsCalendarOpen(!isCalendarOpen);
                        setIsGuestsEditorOpen(false);
                      }}
                      className={cn(
                        'group h-28 w-full rounded-[28px] border bg-white p-6 text-left shadow-sm transition-all',
                        isCalendarOpen
                          ? 'border-brand-500 ring-brand-500/5 ring-4'
                          : !isDraft 
                            ? 'opacity-70 cursor-not-allowed bg-gray-50 border-gray-200' 
                            : 'hover:border-brand-500 border-gray-100 cursor-pointer'
                      )}
                      id="checkout-stay-trigger"
                    >
                      <div className="mb-2 flex items-center space-x-2">
                        <Clock className="text-brand-500 h-4 w-4 transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          Estadía
                        </span>
                      </div>
                      <p className="text-brand-navy text-sm font-black">
                        {booking.startDate &&
                        !isNaN(new Date(booking.startDate).getTime()) &&
                        booking.endDate &&
                        !isNaN(new Date(booking.endDate).getTime())
                          ? `${format(new Date(booking.startDate), 'dd MMM', { locale: es })} - ${format(new Date(booking.endDate), 'dd MMM', { locale: es })}`
                          : 'Fechas inválidas'}
                      </p>
                      <p className="text-brand-500 mt-1 text-[10px] font-black tracking-widest uppercase">
                        {totalNights} Noches
                      </p>
                    </button>

                    <AnimatePresence>
                      {isCalendarOpen && (
                        <motion.div
                          ref={calendarRef}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 z-60 mt-4 w-[320px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                        >
                          <div className="p-2">
                            <Calendar
                              startDate={parseLocalDate(booking.startDate)}
                              endDate={parseLocalDate(booking.endDate)}
                              reservedDates={reservedDates}
                              softReservedDates={softReservedDates}
                              minNights={listing.minNights ?? 2}
                              onChange={handleDateChange}
                              onClose={() => setIsCalendarOpen(false)}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative w-full flex-1">
                    <button
                      ref={guestsTriggerRef}
                      disabled={!isDraft}
                      onClick={() => {
                        setIsGuestsEditorOpen(!isGuestsEditorOpen);
                        setIsCalendarOpen(false);
                      }}
                      className={cn(
                        'group h-28 w-full rounded-[28px] border bg-white p-6 text-left shadow-sm transition-all',
                        isGuestsEditorOpen
                          ? 'border-brand-500 ring-brand-500/5 ring-4'
                          : !isDraft
                            ? 'opacity-70 cursor-not-allowed bg-gray-50 border-gray-200'
                            : 'hover:border-brand-500 border-gray-100 cursor-pointer'
                      )}
                      id="checkout-guests-trigger"
                    >
                      <div className="mb-2 flex items-center space-x-2">
                        <Users className="text-brand-500 h-4 w-4 transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          Huéspedes
                        </span>
                      </div>
                      <p className="text-brand-navy text-sm font-black">
                        {booking.guests} viajeros
                      </p>
                    </button>

                    <AnimatePresence>
                      {isGuestsEditorOpen && (
                        <motion.div
                          ref={guestsRef}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 z-60 mt-4 min-w-[250px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                        >
                          <div className="flex items-center justify-between p-6">
                            <span className="text-brand-navy text-[10px] font-black tracking-widest uppercase">
                              Total Viajeros
                            </span>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() =>
                                  handleGuestsChange(
                                    Math.max(1, booking.guests - 1)
                                  )
                                }
                                className="text-brand-navy hover:bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white font-black transition-colors hover:text-white"
                              >
                                -
                              </button>
                              <span className="text-brand-navy font-black">
                                {booking.guests}
                              </span>
                              <button
                                onClick={() =>
                                  handleGuestsChange(Math.min(listing.maxGuests, booking.guests + 1))
                                }
                                disabled={booking.guests >= listing.maxGuests}
                                className="text-brand-navy hover:bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white font-black transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4 flex flex-col rounded-[28px] border border-gray-800 bg-gray-900 p-6 shadow-2xl sm:p-8">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between font-medium text-gray-300">
                      <span>
                        ${listing.pricePerNight} x {totalNights} Noches
                      </span>
                      <span>${booking.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium text-gray-300">
                      <span>Tarifa de servicio (0%)</span>
                      <span>$0.00</span>
                    </div>
                  </div>

                  <hr className="my-4 border-gray-800" />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col space-y-1">
                      <h4
                        aria-label="deposit-label"
                        className="text-xs font-bold tracking-wider text-yellow-500 uppercase"
                      >
                        Costo de Aseguramiento (20%)
                      </h4>
                      <span className="text-xs font-medium text-gray-400">
                        A pagar ahora
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <p
                        aria-label="deposit-amount"
                        className="text-4xl font-extrabold tracking-tight text-white"
                      >
                        $
                        {calculatePaymentBreakdown(
                          booking.totalAmount
                        ).depositAmount.toFixed(2)}
                      </p>
                      {!HIDE_BCV_PRICES && convertedAmount && rates && (
                        <motion.p
                          aria-label="deposit-amount-converted"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-brand-500 mt-1 text-sm font-bold"
                        >
                          Bs.{' '}
                          {(
                            calculatePaymentBreakdown(booking.totalAmount)
                              .depositAmount * rates.bcv
                          ).toLocaleString('es-VE', {
                            maximumFractionDigits: 0,
                          })}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                    <p className="text-sm text-gray-300">
                      El saldo restante o <span className="text-emerald-400">Saldo Protegido</span> de{' '}
                      <strong aria-label="offline-balance-amount">
                        $
                        {calculatePaymentBreakdown(
                          booking.totalAmount
                        ).remainingBalance.toFixed(2)}
                      </strong>{' '}
                      se liquida directamente con tu anfitrión al momento del Check-in.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <PaymentBanner />

                  {/* BANNER DE POLÍTICA DE CANCELACIÓN */}
                  {(() => {
                    const policyKey = (listing.cancellationPolicy ?? 'moderate') as CancellationPolicyType;
                    const policy = CANCELLATION_POLICIES[policyKey];
                    const { deadlineFormatted, isExpired } = calculateCancellationDeadline(
                      booking.startDate,
                      policyKey
                    );
                    return (
                      <div className={cn(
                        'flex items-start gap-4 rounded-[28px] border p-6',
                        isExpired ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50/70'
                      )}>
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          isExpired ? 'bg-red-100' : 'bg-amber-100'
                        )}>
                          <Info className={cn('h-5 w-5', isExpired ? 'text-red-500' : 'text-amber-600')} />
                        </div>
                        <div>
                          <p className={cn(
                            'text-[10px] font-black tracking-widest uppercase mb-1',
                            isExpired ? 'text-red-600' : 'text-amber-700'
                          )}>
                            {policy.label}
                          </p>
                          {isExpired ? (
                            <p className="text-xs font-semibold text-red-600">
                              El plazo de cancelación gratuita ya venció. El depósito del 20% no es reembolsable.
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-slate-700">
                              Cancelación gratuita antes del <strong className="text-amber-800">{deadlineFormatted}</strong>.
                              Después de esa fecha, el depósito del 20% no es reembolsable.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </section>

              {/* Payment Steps Section */}
              <section className="space-y-8">
                <div className="mb-2 flex items-center space-x-4">
                  <div className="bg-brand-navy text-brand-500 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black">
                    1
                  </div>
                  <div className="flex grow items-center justify-between">
                    <h2 className="text-brand-navy text-sm font-black tracking-widest uppercase flex items-center gap-2">
                      Datos de Pago {listing?.bookingMode === 'request' && <span className="text-[9px] text-[#b08f23] font-black italic tracking-widest lowercase bg-brand-gold/10 px-2 py-0.5 rounded-md leading-none select-none">(Opcional)</span>}
                    </h2>
                    <div className="bg-brand-navy/5 flex items-center gap-2 rounded-xl px-3 py-1.5">
                      <ShieldCheck className="text-brand-navy h-3 w-3" />
                      <span className="text-brand-navy text-[9px] font-black tracking-widest uppercase">
                        Verified Host Data
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {availablePaymentMethods &&
                  availablePaymentMethods.length > 0 ? (
                    availablePaymentMethods.map((method) => {
                      const Icon =
                        method.type === 'Zelle'
                          ? Globe
                          : method.type === 'Binance'
                            ? Sparkles
                            : method.type === 'PagoMovil'
                              ? Smartphone
                              : method.type === 'Otro'
                                ? PlusCircle
                                : Landmark;
                      const isActive = selectedMethod?.id === method.id;

                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method)}
                          className={cn(
                            'relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border-2 p-4 transition-all',
                            isActive
                              ? 'bg-brand-navy border-brand-navy scale-105 text-white shadow-xl'
                              : 'text-brand-navy hover:border-brand-500/20 border-gray-100 bg-white'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-6 w-6',
                              isActive ? 'text-brand-500' : 'text-brand-navy/40'
                            )}
                          />
                          <span className="text-center text-[9px] leading-tight font-black tracking-widest uppercase">
                            {method.label}
                          </span>
                          {isActive && (
                            <motion.div
                              layoutId="active-dot"
                              className="bg-brand-500 absolute top-2 right-2 h-1.5 w-1.5 rounded-full"
                            />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-4 rounded-[30px] border border-gray-100 bg-gray-50 p-8 text-center text-xs text-gray-400 italic">
                      El anfitrión no ha registrado métodos dinámicos. Usa los
                      datos antiguos si están disponibles debajo.
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {selectedMethod ? (
                    <motion.div
                      key={selectedMethod.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-brand-navy group relative overflow-hidden rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl"
                    >
                      <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 transition-transform duration-700 group-hover:scale-110">
                        <Landmark className="h-24 w-24 md:h-32 md:w-32" />
                      </div>

                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                          <span className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
                            Datos para {selectedMethod.type === 'Otro' ? (selectedMethod.data.otherName || selectedMethod.label) : selectedMethod.label}
                          </span>
                          <div className="ml-auto flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">
                              Verificado
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {selectedMethod.data.bankName && (
                            <div className="space-y-1">
                              <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                                Banco
                              </p>
                              <div className="flex h-[52px] items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                                <p className="text-sm font-black">
                                  {selectedMethod.data.bankName}
                                </p>
                                <button
                                  onClick={() =>
                                    handleCopy(
                                      selectedMethod.data.bankName!,
                                      'bank'
                                    )
                                  }
                                  className="rounded-xl p-2 transition-colors hover:bg-white/10"
                                >
                                  {isCopied === 'bank' ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="text-brand-500 h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {selectedMethod.data.accountHolder && (
                            <div className="space-y-1">
                              <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                                Titular
                              </p>
                              <div className="flex h-[52px] items-center rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-black">
                                  {selectedMethod.data.accountHolder}
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedMethod.type === 'Otro' ? (
                            <>
                              {selectedMethod.data.email && (
                                <div className="space-y-1">
                                  <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                                    Correo Asociado
                                  </p>
                                  <div
                                    className="flex h-[52px] items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-2 transition-colors active:bg-white/10 cursor-pointer"
                                    onClick={() =>
                                      handleCopy(selectedMethod.data.email!, 'other-email')
                                    }
                                  >
                                    <p className="truncate pr-2 font-mono text-sm font-black tracking-tight">
                                      {selectedMethod.data.email}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(selectedMethod.data.email!, 'other-email');
                                      }}
                                      className="bg-brand-500 text-brand-navy hover:bg-brand-400 shrink-0 rounded-xl p-2.5 shadow-md transition-colors"
                                    >
                                      {isCopied === 'other-email' ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                              {selectedMethod.data.otherDetails && (
                                <div className="space-y-1">
                                  <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                                    Detalles / Cuenta
                                  </p>
                                  <div
                                    className="flex h-[52px] items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-2 transition-colors active:bg-white/10 cursor-pointer"
                                    onClick={() =>
                                      handleCopy(selectedMethod.data.otherDetails!, 'other-details')
                                    }
                                  >
                                    <p className="truncate pr-2 font-mono text-sm font-black tracking-tight">
                                      {selectedMethod.data.otherDetails}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(selectedMethod.data.otherDetails!, 'other-details');
                                      }}
                                      className="bg-brand-500 text-brand-navy hover:bg-brand-400 shrink-0 rounded-xl p-2.5 shadow-md transition-colors"
                                    >
                                      {isCopied === 'other-details' ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {(selectedMethod.data.accountNumber ||
                                selectedMethod.data.phoneNumber ||
                                selectedMethod.data.email ||
                                selectedMethod.data.binanceId) && (
                                <div className="space-y-1">
                                  <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                                    {selectedMethod.type === 'Zelle'
                                      ? 'Email'
                                      : selectedMethod.type === 'Binance'
                                        ? 'Pay ID / Email'
                                        : selectedMethod.type === 'PagoMovil'
                                          ? 'Número Celular'
                                          : 'Número de Cuenta'}
                                  </p>
                                  <div
                                    className="flex h-[52px] items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-2 transition-colors active:bg-white/10 cursor-pointer"
                                    onClick={() =>
                                      handleCopy(
                                        (selectedMethod.data.email ||
                                          selectedMethod.data.binanceId ||
                                          selectedMethod.data.accountNumber ||
                                          selectedMethod.data.phoneNumber)!,
                                        'main'
                                      )
                                    }
                                  >
                                    <p className="truncate pr-2 font-mono text-sm font-black tracking-tight">
                                      {selectedMethod.data.email ||
                                        selectedMethod.data.binanceId ||
                                        selectedMethod.data.accountNumber ||
                                        selectedMethod.data.phoneNumber}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(
                                          (selectedMethod.data.email ||
                                            selectedMethod.data.binanceId ||
                                            selectedMethod.data.accountNumber ||
                                            selectedMethod.data.phoneNumber)!,
                                          'main'
                                        );
                                      }}
                                      className="bg-brand-500 text-brand-navy hover:bg-brand-400 shrink-0 rounded-xl p-2.5 shadow-md transition-colors"
                                    >
                                      {isCopied === 'main' ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {selectedMethod.type === 'PagoMovil' && rates && (
                                <div className="md:col-span-2 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/2 p-6 text-center space-y-4">
                                  <div className="flex items-center gap-2">
                                    <QrCode className="h-5 w-5 text-brand-500" />
                                    <h4 className="text-[10px] font-black tracking-widest uppercase text-brand-500">
                                      QR Dinámico de Pago Rápido
                                    </h4>
                                  </div>
                                  <div className="bg-white p-4 rounded-3xl inline-block shadow-inner">
                                    <img
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                        `pago_movil:tel=${selectedMethod.data.phoneNumber}&rif=${selectedMethod.data.idNumber}&banco=${selectedMethod.data.bankName || ''}&monto=${(calculatePaymentBreakdown(booking.totalAmount).depositAmount * rates.bcv).toFixed(2)}&concepto=Reserva-${booking.id || 'Draft'}`
                                      )}`}
                                      alt="QR Dinámico de Pago Rápido"
                                      width={140}
                                      height={140}
                                      className="rounded-xl shadow-sm"
                                    />
                                  </div>
                                  <p className="text-[9px] font-semibold text-slate-400 max-w-xs leading-relaxed">
                                    Escanea este código desde la aplicación de tu banco para realizar la transferencia móvil con los datos y monto total pre-llenados de forma segura.
                                  </p>
                                </div>
                              )}

                              {selectedMethod.data.idNumber && (
                                <div className="space-y-1">
                                  <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                                    Identificación (RIF/V)
                                  </p>
                                  <div className="flex h-[52px] items-center rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-sm font-black">
                                      {selectedMethod.data.idNumber}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Privacy Footer */}
                      <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-6 text-white/40">
                        <Info className="h-3.5 w-3.5" />
                        <p className="text-[9px] font-medium italic">
                          Estos datos son confidenciales y se muestran solo
                          durante el proceso de reserva activa.
                        </p>
                      </div>
                    </motion.div>
                  ) : listing.bankDetails ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-brand-navy group relative overflow-hidden rounded-[40px] p-10 text-white shadow-2xl"
                    >
                      {/* Fallback to legacy bankDetails if selectedMethod is null and bankDetails exists */}
                      <div className="relative z-10 space-y-8">
                        <p className="mb-4 text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                          Datos Bancarios Predeterminados
                        </p>
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                              Entidad Bancaria
                            </p>
                            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                              <p className="text-sm font-black">
                                {listing.bankDetails.bankName}
                              </p>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    listing.bankDetails!.bankName,
                                    'bank'
                                  )
                                }
                                className="rounded-xl p-2 transition-colors hover:bg-white/10"
                              >
                                {isCopied === 'bank' ? (
                                  <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Copy className="text-brand-500 h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                              Titular de Cuenta
                            </p>
                            <div className="flex h-[52px] items-center rounded-2xl border border-white/10 bg-white/5 p-4">
                              <p className="text-sm font-black">
                                {listing.bankDetails.accountHolder}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <p className="text-brand-500 text-[9px] font-black tracking-widest uppercase">
                              Número de Cuenta / Pago Móvil
                            </p>
                            <div className="flex items-center justify-between rounded-3xl border border-white/20 bg-white/5 p-5">
                              <p className="font-mono text-lg font-black tracking-tight">
                                {listing.bankDetails.accountNumber}
                              </p>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    listing.bankDetails!.accountNumber,
                                    'acc'
                                  )
                                }
                                className="bg-brand-500 text-brand-navy hover:bg-brand-400 rounded-2xl p-3 shadow-lg transition-colors"
                              >
                                {isCopied === 'acc' ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <Copy className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-8 text-sm leading-relaxed text-slate-600 italic">
                      <MessageSquare className="text-brand-500 mb-4 h-6 w-6" />
                      {listing.paymentInstructions ||
                        'El anfitrión no ha registrado datos bancarios específicos. Consulta instrucciones en el chat.'}
                    </div>
                  )}
                </AnimatePresence>
              </section>

              <section className="space-y-8 pb-20">
                {(!isRequestPhase) && (
                  <>
                    <div className="mb-2 flex items-center space-x-4">
                      <div className="bg-brand-navy text-brand-500 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black">
                        2
                      </div>
                      <h2 className="text-brand-navy text-sm font-black tracking-widest uppercase flex items-center gap-2">
                        Carga de Comprobante
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                      <div className="lg:col-span-2">
                        <div
                          className={cn(
                            'group relative flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[40px] border-2 border-dashed bg-white p-8 shadow-sm transition-all',
                            previewUrl
                              ? 'border-emerald-500'
                              : 'hover:border-brand-500 border-gray-200 hover:bg-gray-50'
                          )}
                          onClick={() =>
                            document.getElementById('receipt-upload')?.click()
                          }
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <>
                              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 transition-all duration-500 group-hover:scale-110">
                                <Upload className="text-brand-navy/20 group-hover:text-brand-500 h-8 w-8" />
                              </div>
                              <p className="text-center text-xs leading-tight font-black tracking-widest text-gray-400 uppercase">
                                Arrastra, toca o presiona
                                <br />
                                <span className="text-brand-500 font-extrabold">Ctrl + V</span> para pegar
                              </p>
                            </>
                          )}
                          <input
                            id="receipt-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                          {previewUrl && (
                            <div className="bg-brand-navy/60 absolute inset-0 flex flex-col items-center justify-center opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              <Upload className="text-brand-500 mb-2 h-8 w-8" />
                              <p className="text-[10px] font-black tracking-widest text-white uppercase">
                                Cambiar Comprobante
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between space-y-6 lg:col-span-3">
                        <div className="space-y-2 rounded-[35px] border border-gray-100 bg-white p-8 shadow-sm">
                          <label className="text-brand-navy ml-1 block text-[10px] font-black tracking-widest uppercase">
                            Número de comprobante
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            id="reference-input"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Introduce los números"
                            className="focus:border-brand-500 text-brand-navy w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-5 text-sm font-black transition-all outline-none focus:bg-white"
                          />
                          <p className="mt-2 ml-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                            Revisamos esta referencia para validar el pago
                          </p>
                        </div>

                        <PaymentBanner />
                      </div>
                    </div>
                  </>
                )}

                {(isRequestPhase) && (
                  <div className="space-y-3 rounded-[32px] border border-brand-gold/20 bg-brand-gold/[0.01] p-6 shadow-sm mt-6">
                    <label className="text-brand-navy ml-1 block text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#b08f23]" />
                      Preséntate al anfitrión (Mensaje de solicitud)
                    </label>
                    <textarea
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      placeholder="Escribe algo sobre ti y el motivo del viaje para generar confianza..."
                      className="focus:border-brand-gold text-brand-navy w-full h-28 resize-none rounded-2xl border border-gray-100 bg-white px-6 py-4 text-xs font-bold transition-all outline-none"
                    />
                    <p className="ml-1 text-[9px] font-semibold text-slate-400 tracking-wide leading-relaxed">
                      El anfitrión revisará tu pasaporte y este mensaje para evaluar la aprobación en menos de 24 horas.
                    </p>
                  </div>
                )}

                {/* CONSENTIMIENTO LEGAL — POLÍTICA DE CANCELACIÓN */}
                <label
                  htmlFor="policy-consent"
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 select-none mt-6"
                >
                  <div className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                    hasConsentedPolicy
                      ? 'border-brand-navy bg-brand-navy'
                      : 'border-gray-300 bg-white'
                  )}>
                    {hasConsentedPolicy && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <input
                    id="policy-consent"
                    type="checkbox"
                    className="hidden"
                    checked={hasConsentedPolicy}
                    onChange={(e) => setHasConsentedPolicy(e.target.checked)}
                  />
                  <p className="text-[10.5px] leading-relaxed font-semibold text-slate-500">
                    Acepto los Términos de Servicio y la{' '}
                    <strong className="text-brand-navy">
                      {CANCELLATION_POLICIES[(listing.cancellationPolicy ?? 'moderate') as CancellationPolicyType].label}
                    </strong>{' '}
                    de este alojamiento. Entiendo que el depósito del 20% rige bajo esta política.
                  </p>
                </label>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 rounded-[28px] border border-red-100 bg-red-50 p-6 mt-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/10">
                      <ShieldAlert className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-[11px] font-black tracking-widest text-red-600 uppercase">
                      {error}
                    </p>
                  </motion.div>
                )}

                <div className="pt-6">
                  {!user && (
                    <div className="mb-4 text-center text-sm font-medium text-gray-600">
                      ¿Ya iniciaste sesión?{' '}
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="text-brand-navy hover:text-brand-500 font-black underline decoration-2 underline-offset-4 transition-colors"
                      >
                        Inicia sesión o regístrate
                      </button>{' '}
                      para asegurar tus fechas.
                    </div>
                  )}

                  {user && !isKycVerified && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleGoToPassport()}
                      className="mb-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 transition-all duration-300 hover:scale-[1.01] hover:border-amber-200 hover:bg-amber-50 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 animate-pulse">
                          <ShieldAlert className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black tracking-widest text-amber-800 uppercase">
                            Completa tu pasaporte para reservar
                          </p>
                          <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                            Haz clic aquí para terminar tu verificación y asegurar tu estadía.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-amber-600 shrink-0" />
                    </motion.div>
                  )}

                  <button
                    id="payment-submit-button-desktop"
                    disabled={isFormDisabled}
                    onClick={handleSubmitPayment}
                    className={cn(
                      "shadow-2xl flex w-full items-center justify-center space-x-4 rounded-[40px] py-8 text-sm font-black tracking-[0.3em] uppercase transition-all duration-500 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed",
                      isRequestPhase
                        ? "animate-shimmer-sweep bg-linear-to-r from-brand-600 via-brand-400 to-brand-600 bg-size-[200%_auto] hover:bg-right text-brand-navy shadow-brand-gold/20"
                        : "bg-brand-500 text-brand-navy shadow-brand-500/20 hover:bg-brand-400"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="text-brand-navy h-6 w-6 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>{
                          isPaymentPhase
                            ? 'Enviar Comprobante de Pago'
                            : isRequestPhase
                              ? 'Enviar Solicitud de Reserva'
                              : 'Asegurar mi Estadía Ahora'
                        }</span>
                        <ChevronRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  <div className="mt-6 flex items-center justify-center space-x-3 text-gray-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase">
                      Pago encriptado y seguro
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      {!uploadSuccess && (
        <div className="pointer-events-none fixed right-0 bottom-16 left-0 z-60 p-4 md:hidden">
          <button
            id="payment-submit-button-mobile"
            disabled={isFormDisabled}
            onClick={handleSubmitPayment}
            className={cn(
              "pointer-events-auto flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-xs font-black tracking-[0.2em] uppercase shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed",
              isRequestPhase
                ? "animate-shimmer-sweep bg-linear-to-r from-brand-600 via-brand-400 to-brand-600 bg-size-[200%_auto] hover:bg-right text-brand-navy shadow-brand-gold/20"
                : "bg-brand-500 text-brand-navy shadow-brand-500/40"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            {isPaymentPhase
              ? 'Enviar Comprobante'
              : isRequestPhase
                ? 'Enviar Solicitud'
                : 'Asegurar mi Estadía Ahora'}
          </button>
        </div>
      )}

      {/* Mobile Chat Button and View */}
      <div className="fixed right-0 bottom-0 left-0 z-80 flex gap-3 border-t border-gray-100 bg-white/80 p-3 backdrop-blur-xl md:hidden">
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-brand-navy flex grow items-center justify-center space-x-3 rounded-2xl py-4 text-white transition-transform active:scale-95"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-[10px] font-black tracking-widest uppercase">
            Hablar con{' '}
            {listing.hostName
              ? listing.hostName.split(' ')[0] || 'Anfitrión'
              : 'Anfitrión'}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Mobile View Popup */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-100 flex flex-col bg-white md:hidden"
            >
              <div className="bg-brand-navy flex items-center justify-between border-b border-gray-100 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/20">
                    <img
                      src={
                        listing.hostAvatar ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
                      }
                      className="h-full w-full object-cover"
                      alt="Avatar"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight uppercase">
                      Soporte Anfitrión
                    </h3>
                    <p className="text-brand-500 mt-1 text-[9px] leading-none font-bold tracking-widest uppercase">
                      En línea ahora
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="rounded-2xl bg-white/10 p-3 transition-transform hover:bg-white/20 active:scale-90"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="grow overflow-hidden">
                <Chat
                  bookingId={booking?.id || ''}
                  senderId={user?.uid || 'guest'}
                  senderName={user?.displayName || 'Huésped'}
                  recipientId={listing?.hostId}
                  isFloating={false}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </div>
            </motion.div>

            {/* Desktop Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 z-90 bg-brand-navy hidden md:block backdrop-blur-[2px]"
            />

            {/* Desktop View Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-100 hidden h-screen w-[420px] flex-col border-l border-gray-100 bg-gray-50 shadow-2xl md:flex"
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="border-brand-navy/5 h-12 w-12 overflow-hidden rounded-2xl border-2 shadow-md">
                      <img
                        src={
                          listing.hostAvatar ||
                          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
                        }
                        className="h-full w-full object-cover"
                        alt="Avatar"
                      />
                    </div>
                    <div className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                      <div className="h-1 w-1 animate-ping rounded-full bg-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-brand-navy text-sm font-black tracking-tight uppercase">
                      Chat con {listing.hostName || 'Anfitrión'}
                    </h3>
                    <p className="mt-0.5 text-[8px] font-black tracking-widest text-emerald-500 uppercase">
                      Soporte Inmediato
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="rounded-xl bg-gray-50 p-2.5 text-gray-400 hover:bg-gray-100 hover:text-brand-navy transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grow overflow-hidden bg-white/40 backdrop-blur-sm">
                <Chat
                  bookingId={booking?.id || ''}
                  senderId={user?.uid || 'guest'}
                  senderName={user?.displayName || 'Huésped'}
                  recipientId={listing?.hostId}
                  isFloating={false}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </div>

              <div className="flex items-center gap-4 border-t border-gray-100 bg-white p-6">
                <div className="bg-brand-navy text-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-[8px] leading-relaxed font-black tracking-wider text-slate-500 uppercase">
                  Tus conversaciones están protegidas por VeneStay. Nunca realices
                  pagos fuera de la plataforma.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="login"
      />

      <KYCRequiredModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        kycStatus={profileData?.kycStatus}
        profile={profileData}
        onGoToPassport={handleGoToPassport}
      />


    </div>
  );
};

export default CheckoutPage;






