import React, { useEffect, useState, useMemo } from 'react';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { Booking } from '@/types';
import {
  X,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  ChevronRight,
  Hash,
  MessageSquare,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Chat from '@/components/Chat';
import FloatingChat from '@/components/FloatingChat';
import { useTripFilters } from '../hooks/useTripFilters';
import { TripFilterBar } from './TripFilterBar';
import { useChatNotifications } from '../hooks/useChatNotifications';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cleanupExpiredBookings } from '@/services/booking-service';
import { RescheduleRequestModal } from './RescheduleRequestModal';
import { BookingSummaryModal } from './BookingSummaryModal';

interface MyTripsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const CountdownTimer: React.FC<{ createdAt: unknown }> = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      const ca = createdAt as { toDate?: () => Date };
      const createdDate = ca?.toDate
        ? ca.toDate()
        : new Date(createdAt as string | Date);
      const expiryDate = new Date(createdDate.getTime() + 60 * 60 * 1000); // 1 hour later
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('EXPIRADO');
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-red-500">
      <Clock className="h-3 w-3 animate-pulse" />
      <span className="font-mono text-[10px] font-black">{timeLeft}</span>
    </div>
  );
};

// Threshold for considering a terminal booking as "recent" (visible in main section)
const RECENT_TERMINAL_HOURS = 48;
const TERMINAL_STATUSES = ['CANCELLED', 'REJECTED', 'EXPIRED', 'CANCELLED_BY_GUEST'] as const;
type TerminalStatus = typeof TERMINAL_STATUSES[number];

const MyTrips: React.FC<MyTripsProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(
    null
  );
  const [mobileTab, setMobileTab] = useState<'reservas' | 'chat'>('reservas');
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [summaryBooking, setSummaryBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();

  // Stable snapshot of "now" for the 48-hour threshold comparison.
  // useState(Date.now) calls Date.now once at mount (lazy initializer — not in render).
  const [nowMs] = useState<number>(Date.now);

  const activeOpen = isOpen !== undefined ? isOpen : true;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!activeOpen || !user) {
      setBookings([]);
      return;
    }

    setLoading(true);

    // Run expiration cleanup locally in the background
    cleanupExpiredBookings();

    // Use onSnapshot for real-time updates - this solves any latency/sync issues
    const q = query(
      collection(db, 'bookings'),
      where('guestId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];

        // Sort in memory (safe for both local and server timestamps)
        const sortedData = data.sort((a, b) => {
          const timeA = (a as unknown as { createdAt?: { seconds: number } }).createdAt?.seconds || Date.now() / 1000;
          const timeB = (b as unknown as { createdAt?: { seconds: number } }).createdAt?.seconds || Date.now() / 1000;
          return timeB - timeA;
        });

        setBookings(sortedData);
        setLoading(false);

        // Auto-expand history when no active/recent bookings exist
        const nowMs = Date.now();
        const threshold48h = RECENT_TERMINAL_HOURS * 60 * 60 * 1000;
        const hasActiveOrRecent = sortedData.some((b) => {
          if (!TERMINAL_STATUSES.includes(b.status as TerminalStatus)) return true;
          const raw =
            (b as unknown as { updatedAt?: string | { seconds: number } }).updatedAt ||
            (b as unknown as { createdAt?: string | { seconds: number } }).createdAt;
          if (typeof raw === 'string') {
            const d = new Date(raw);
            return !isNaN(d.getTime()) && (nowMs - d.getTime()) < threshold48h;
          }
          if (raw && typeof (raw as { seconds: number }).seconds === 'number') {
            return (nowMs - (raw as { seconds: number }).seconds * 1000) < threshold48h;
          }
          return false;
        });
        if (!hasActiveOrRecent && sortedData.length > 0) {
          setIsHistoryExpanded(true);
        }

        // Auto-select or update chat booking dynamically
        if (sortedData.length > 0) {
          const currentSelected = sortedData.find(b => b.id === activeChatId);
          // If no chat selected, or current selection is terminal, select the first active booking
          if (!activeChatId || !currentSelected || TERMINAL_STATUSES.includes(currentSelected.status as TerminalStatus)) {
            const active = sortedData.find(b => !TERMINAL_STATUSES.includes(b.status as TerminalStatus));
            const first = active || sortedData[0];
            setActiveChatId(first.id);
            setActiveChatBooking(first);
          } else {
            // Keep current selection updated with fresh database data
            setActiveChatBooking(currentSelected);
          }
        }
      },
      (error) => {
        console.error('Error listening to bookings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOpen, user, activeChatId]);


  const { unreadPerBooking } = useChatNotifications();
  const unreadChatMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.keys(unreadPerBooking).forEach((key) => {
      map[key] = unreadPerBooking[key] > 0;
    });
    return map;
  }, [unreadPerBooking]);

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredBookings,
    activosCount,
    historialCount,
  } = useTripFilters(bookings, unreadChatMap, nowMs);

  const processAndSetFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Por favor sube una imagen válida (JPG, PNG).');
      return;
    }
    setSubmitting(true);
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
      console.warn('Error comprimiendo comprobante en Mis Viajes:', err);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processAndSetFile(selectedFile);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      if (!isOpen || !verifyingId) return;
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
  }, [isOpen, verifyingId]);

  const handlePaymentSubmit = async (bookingId: string) => {
    if (!paymentRef.trim() || !file) {
      toast.error('Debes incluir el número de referencia y la imagen del comprobante.');
      return;
    }
    setSubmitting(true);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking || !user) return;

      let proofUrl = booking.proofUrl || '';

      // Upload file if exists
      if (file) {
        // eslint-disable-next-line react-hooks/purity
        const fileName = `${Date.now()}_receipt.jpg`;
        const storageRef = ref(
          storage,
          `bookings/${bookingId}/payments/${fileName}`
        );
        const metadata = {
          contentType: 'image/jpeg',
          cacheControl: 'public,max-age=31536000',
        };
        try {
          const uploadResult = await uploadBytes(storageRef, file, metadata);
          proofUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadError: unknown) {
          if (
            (uploadError as { code?: string }).code === 'storage/unauthorized' ||
            (uploadError as Error).message?.includes('storage/unauthorized') ||
            (uploadError as Error).message?.includes('does not have permission')
          ) {
            proofUrl =
              'https://placehold.co/600x400/2a3b5c/ffffff?text=Comprobante+(Storage+Bloqueado)';
            console.warn(
              'Storage is unauthorized in MyTrips. Using fallback URL. Please update Firebase Storage rules in the console.'
            );
          } else {
            throw uploadError;
          }
        }
      }

      const historyEntry = {
        status: 'AWAITING_VERIFICATION' as const,
        timestamp: new Date().toISOString(),
        actorId: user.uid,
        actorName: user.displayName || 'Huésped',
        note: `Comprobante enviado desde Mis Viajes. Ref: ${paymentRef}`,
      };

      await updateDoc(bookingRef, {
        status: 'AWAITING_VERIFICATION',
        paymentReference: paymentRef,
        proofUrl,
        paymentSubmittedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        statusHistory: [...(booking.statusHistory || []), historyEntry],
      });

      // Registrar transacción en subcolección para UCP
      try {
        const ucpPayload = {
          bookingId,
          amount: booking.totalAmount * 0.20, // 20% seña UCP
          reference: paymentRef,
          proofUrl,
          method: booking.hostSelectedPaymentMethod?.type || 'P2P',
          methodLabel: booking.hostSelectedPaymentMethod?.label || 'Pago Móvil / Transferencia',
          status: 'PENDING',
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'bookings', bookingId, 'payments'), ucpPayload);
      } catch (payErr) {
        console.warn('Error recording payment in subcollection:', payErr);
      }

      setVerifyingId(null);
      setPaymentRef('');
      setFile(null);
      setPreviewUrl(null);
      toast.success('¡Comprobante de pago enviado con éxito!');
    } catch (error) {
      console.error('Error updating payment info:', error);
      toast.error('Hubo un error al subir el comprobante. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeOpen) return null;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return {
          label: 'Pago Pendiente',
          icon: <Clock className="h-3 w-3" />,
          color: 'text-amber-500 bg-amber-50 border-amber-100',
        };
      case 'PENDING_APPROVAL':
        return {
          label: 'Esperando Aprobación',
          icon: <Clock className="h-3 w-3 animate-pulse" />,
          color: 'text-[#b08f23] bg-brand-gold/[0.05] border-brand-gold/20',
        };
      case 'EXPIRED':
        return {
          label: 'Solicitud Expirada',
          icon: <X className="h-3 w-3" />,
          color: 'text-slate-400 bg-slate-50 border-slate-200',
        };
      case 'CANCELLED_BY_GUEST':
        return {
          label: 'Cancelada por Huésped',
          icon: <X className="h-3 w-3" />,
          color: 'text-slate-400 bg-slate-50 border-slate-200',
        };
      case 'AWAITING_VERIFICATION':
        return {
          label: 'Verificando Pago',
          icon: <CreditCard className="h-3 w-3" />,
          color: 'text-blue-500 bg-blue-50 border-blue-100',
        };
      case 'CONFIRMED':
        return {
          label: 'Confirmada',
          icon: <CheckCircle2 className="h-3 w-3" />,
          color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        };
      case 'REJECTED':
        return {
          label: 'Solicitud Rechazada',
          icon: <X className="h-3 w-3" />,
          color: 'text-red-600 bg-red-50 border-red-100',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelada',
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-slate-500 bg-slate-50 border-slate-200',
        };
      case 'RESCHEDULE_REQUESTED':
        return {
          label: 'Reprogramación Solicitada',
          icon: <Clock className="h-3 w-3" />,
          color: 'text-amber-600 bg-amber-50 border-amber-100',
        };
      case 'RESCHEDULE_PENDING':
        return {
          label: 'Reprogramación: Pago Ajuste',
          icon: <CreditCard className="h-3 w-3" />,
          color: 'text-blue-600 bg-blue-50 border-blue-100',
        };
      default:
        return {
          label: status,
          icon: <Clock className="h-3 w-3" />,
          color: 'text-gray-500 bg-gray-50 border-gray-100',
        };
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50/50 font-sans overflow-hidden">
      <div className="flex flex-col h-full w-full bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-brand-navy flex shrink-0 items-center justify-between border-b border-gray-100 p-6 lg:p-8">
          <div className="flex items-center space-x-4">
            <div className="bg-brand-500/20 rounded-2xl p-3">
              <Calendar className="text-brand-500 h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white">
                Mis Viajes
              </h2>
              <p className="text-brand-500 mt-0.5 text-[10px] font-black tracking-[0.2em] uppercase">
                Gestión de Reservas VeneStay
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-2xl bg-white/10 px-4 py-2.5 text-white transition-all duration-300 hover:bg-white/20 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden border-b border-gray-100 bg-white px-4 shrink-0">
          <button
            onClick={() => setMobileTab('reservas')}
            className={cn(
              "flex-grow text-center py-3.5 text-xs font-black tracking-widest uppercase border-b-2 transition-all",
              mobileTab === 'reservas'
                ? "border-brand-navy text-brand-navy font-black"
                : "border-transparent text-gray-400"
            )}
          >
            Reservas
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={cn(
              "flex-grow text-center py-3.5 text-xs font-black tracking-widest uppercase border-b-2 transition-all relative flex items-center justify-center gap-1.5",
              mobileTab === 'chat'
                ? "border-brand-navy text-brand-navy font-black"
                : "border-transparent text-gray-400"
            )}
          >
            Chat
            {activeChatBooking && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Content & Chat Split */}
        <div className="flex flex-row overflow-hidden flex-grow h-full w-full">
          {/* Left Column: Bookings */}
          <div className={cn(
            "no-scrollbar flex-1 overflow-y-auto p-4 lg:p-8 space-y-6",
            mobileTab === 'reservas' ? 'block' : 'hidden lg:block'
          )}>
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <div className="border-brand-500 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
                <p className="text-xs font-black tracking-widest text-gray-400 uppercase">
                  Cargando tus aventuras...
                </p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                  <MapPin className="h-8 w-8 text-gray-200" />
                </div>
                <h3 className="text-brand-navy mb-2 text-xl font-black">
                  Aún no tienes viajes
                </h3>
                <p className="mx-auto max-w-xs text-sm text-gray-500">
                  Explora nuestras propiedades exclusivas y comienza a planificar tu próxima estancia en Venezuela.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-8 rounded-2xl px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all"
                >
                  Explorar Propiedades
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                <TripFilterBar
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  activosCount={activosCount}
                  historialCount={historialCount}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                {filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-gray-50/30 rounded-[24px] border border-gray-100/50 p-8">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-100 text-gray-300 shadow-sm">
                      <Clock className="h-6 w-6" />
                    </div>
                    <p className="text-xs text-gray-400 font-black tracking-widest uppercase">
                      {activeTab === 'activos'
                        ? 'No tienes reservas activas en este momento.'
                        : 'Tu historial de reservas aparecerá aquí.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                      {filteredBookings.map((booking) => {
                        const statusInfo = getStatusDisplay(booking.status);
                        const isTerminalRecent = ['REJECTED', 'CANCELLED', 'EXPIRED', 'CANCELLED_BY_GUEST'].includes(booking.status);
                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                              'group relative overflow-hidden rounded-[24px] border p-6 shadow-sm transition-all duration-300 hover:shadow-md',
                              isTerminalRecent
                                ? 'border-red-100 bg-red-50/10'
                                : activeChatId === booking.id
                                ? 'border-brand-gold bg-brand-gold/[0.01]'
                                : 'border-gray-100 bg-white'
                            )}
                          >
                            <div className="bg-brand-navy/5 absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-bl-[80px] transition-transform group-hover:scale-110" />

                            <div className="relative z-10">
                              {/* Card Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div
                                  className={cn(
                                    'flex items-center space-x-1.5 rounded-full border px-3 py-1 text-[9px] font-black tracking-wider uppercase',
                                    statusInfo.color
                                  )}
                                >
                                  {statusInfo.icon}
                                  <span>{statusInfo.label}</span>
                                </div>
                                <span className="text-[10px] font-mono font-black text-gray-300">
                                  REF: {booking.id.toUpperCase().slice(0, 8)}
                                </span>
                              </div>

                              <h4 className="text-brand-navy group-hover:text-brand-500 mb-3 text-lg lg:text-xl leading-tight font-black transition-colors">
                                {booking.listingTitle}
                              </h4>

                              {/* Rejection note */}
                              {booking.status === 'REJECTED' && booking.rejectionReason && (
                                <div className="bg-red-50/40 border border-red-100/50 rounded-xl p-3 mb-4 select-none">
                                  <label className="text-red-500 block text-[8px] font-black tracking-[0.2em] uppercase mb-1">
                                    Nota del anfitrión
                                  </label>
                                  <p className="text-red-700 text-[10px] leading-relaxed font-bold">
                                    "{booking.rejectionReason}"
                                  </p>
                                </div>
                              )}

                              {/* Countdown for Pending Payment */}
                              {booking.status === 'PENDING_PAYMENT' && (
                                <div className="mb-4">
                                  <CountdownTimer createdAt={booking.createdAt} />
                                </div>
                              )}

                              {/* Dates & Guests (single line) */}
                              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 mb-4 border-y border-gray-50 py-3">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  {booking.startDate && booking.endDate
                                    ? `${format(new Date(booking.startDate), 'dd MMM', { locale: es })} → ${format(new Date(booking.endDate), 'dd MMM yyyy', { locale: es })}`
                                    : 'Fechas por definir'}
                                </span>
                                <span className="text-gray-300 font-normal">·</span>
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-gray-400" />
                                  {booking.guests} {booking.guests === 1 ? 'Viajero' : 'Viajeros'}
                                </span>
                              </div>

                              {/* Financial Details (single line horizontal) */}
                              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between text-[11px] font-bold text-gray-500 gap-2">
                                <div>
                                  <span className="text-[8px] text-gray-400 uppercase block leading-none mb-0.5">Total</span>
                                  <span className="text-brand-navy font-black text-xs">${booking.totalAmount}</span>
                                </div>
                                <div className="h-6 w-px bg-gray-200/80" />
                                <div>
                                  <span className="text-[8px] text-brand-gold uppercase block leading-none mb-0.5">Garantía (20%)</span>
                                  <span className="text-brand-gold font-black text-xs">${(booking.totalAmount * 0.2).toFixed(2)}</span>
                                </div>
                                <div className="h-6 w-px bg-gray-200/80" />
                                <div>
                                  <span className="text-[8px] text-gray-400 uppercase block leading-none mb-0.5">Saldo en Check-In (80%)</span>
                                  <span className="text-brand-navy font-black text-xs">${(booking.totalAmount * 0.8).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Subir comprobante payment container */}
                              {booking.status === 'PENDING_PAYMENT' && verifyingId === booking.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4 mb-4"
                                >
                                  <div
                                    onClick={() => document.getElementById(`receipt-upload-${booking.id}`)?.click()}
                                    className="group border-2 border-dashed border-gray-200 hover:border-brand-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white flex flex-col items-center justify-center"
                                  >
                                    <input
                                      id={`receipt-upload-${booking.id}`}
                                      type="file"
                                      accept="image/*"
                                      onChange={handleFileUpload}
                                      className="hidden"
                                    />
                                    {previewUrl ? (
                                      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-100">
                                        <img src={previewUrl} className="h-full w-full object-cover" alt="Receipt preview" />
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <Upload className="h-4 w-4 mx-auto text-brand-500" />
                                        <p className="text-[9px] font-black uppercase text-gray-500">Subir Comprobante</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={paymentRef}
                                      onChange={(e) => setPaymentRef(e.target.value)}
                                      placeholder="Referencia"
                                      className="focus:border-brand-500 flex-grow rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none"
                                    />
                                    <button
                                      disabled={submitting || !paymentRef || !file}
                                      onClick={() => handlePaymentSubmit(booking.id)}
                                      className="bg-brand-500 text-brand-navy rounded-xl px-4 py-1.5 text-[9px] font-black uppercase shadow-md"
                                    >
                                      Enviar
                                    </button>
                                  </div>
                                </motion.div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between gap-3 mt-4">
                                <div className="flex-1">
                                  {booking.status === 'PENDING_PAYMENT' ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setVerifyingId(verifyingId === booking.id ? null : booking.id)}
                                        className="flex-1 bg-brand-navy text-white hover:bg-brand-navy/90 rounded-xl py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                                      >
                                        {verifyingId === booking.id ? 'Cancelar' : 'Subir Pago'}
                                      </button>
                                      <button
                                        onClick={() => navigate(`/checkout/${booking.id}`)}
                                        className="flex-1 border border-gray-200 hover:bg-gray-50 text-brand-navy rounded-xl py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                                      >
                                        Detalles
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          if (booking.status === 'CONFIRMED' || booking.status === 'AWAITING_VERIFICATION') {
                                            setSummaryBooking(booking);
                                          } else {
                                            navigate(`/checkout/${booking.id}`);
                                          }
                                        }}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-brand-navy rounded-xl py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                                      >
                                        Ver Resumen
                                      </button>
                                      {booking.status === 'CONFIRMED' && booking.cancellationPolicySnapshot === 'non_refundable_reschedulable' && (
                                        <button
                                          onClick={() => setRescheduleBookingId(booking.id)}
                                          className="flex-1 border border-[#C5A059] hover:bg-[#C5A059]/10 text-[#C5A059] rounded-xl py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                                        >
                                          Reprogramar
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    setActiveChatId(booking.id);
                                    setActiveChatBooking(booking);
                                    if (window.innerWidth < 1024) {
                                      setMobileTab('chat');
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black tracking-wider uppercase border transition-all duration-300",
                                    activeChatId === booking.id
                                      ? "bg-brand-navy text-white border-brand-navy"
                                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                  )}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  Chat
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Embedded Chat */}
          <div className={cn(
            "w-[380px] shrink-0 border-l border-gray-100 bg-gray-50/50 h-full flex-col overflow-hidden",
            mobileTab === 'chat' ? 'flex w-full lg:w-[380px]' : 'hidden lg:flex'
          )}>
            {activeChatBooking ? (
              <div className="flex flex-col h-full bg-white overflow-hidden">
                <div className="bg-brand-navy p-4 text-white shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-brand-gold/20">
                      <MessageSquare className="h-5 w-5 text-brand-gold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black tracking-tight leading-tight">Chat con Anfitrión</h3>
                      <p className="text-[10px] text-brand-500 tracking-wider font-bold uppercase">Ref: {activeChatBooking.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Seguro
                  </div>
                </div>
                <div className="flex-grow overflow-hidden relative chat-embedded-container">
                  <Chat
                    bookingId={activeChatBooking.id}
                    senderId={user?.uid || ''}
                    senderName={user?.displayName || 'Huésped'}
                    recipientId={activeChatBooking.ownerId}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4 text-gray-300">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h4 className="text-brand-navy font-black text-xs mb-1 uppercase tracking-wider">Sin Conversación Activa</h4>
                <p className="text-[10px] text-gray-400 font-semibold max-w-xs leading-relaxed">
                  Selecciona una reserva para ver la conversación con el anfitrión.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <RescheduleRequestModal
        isOpen={!!rescheduleBookingId}
        onClose={() => setRescheduleBookingId(null)}
        bookingId={rescheduleBookingId || ''}
      />
      <BookingSummaryModal
        booking={summaryBooking}
        isOpen={!!summaryBooking}
        onClose={() => setSummaryBooking(null)}
        onContactHost={summaryBooking ? () => {
          setActiveChatId(summaryBooking.id);
          setActiveChatBooking(summaryBooking);
          if (window.innerWidth < 1024) {
            setMobileTab('chat');
          }
        } : undefined}
      />
    </div>
  );
};

export default MyTrips;






