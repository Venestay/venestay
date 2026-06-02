import React, { useEffect, useState, useMemo } from 'react';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
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
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  ChevronRight,
  Hash,
  RefreshCcw,
  MessageSquare,
  Upload,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Chat from '@/components/Chat';
import FloatingChat from '@/components/FloatingChat';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cleanupExpiredBookings } from '@/services/booking-service';

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
  const navigate = useNavigate();

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
      },
      (error) => {
        console.error('Error listening to bookings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOpen, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const { activeBookings, pastBookings } = useMemo(() => {
    const active: Booking[] = [];
    const past: Booking[] = [];

    bookings.forEach((booking) => {
      const status = booking.status;
      const isCompletedOrTerminal =
        status === 'CANCELLED' ||
        status === 'REJECTED' ||
        (status === 'CONFIRMED' &&
          booking.endDate &&
          new Date(booking.endDate).getTime() < new Date().setHours(0, 0, 0, 0));

      if (isCompletedOrTerminal) {
        past.push(booking);
      } else {
        active.push(booking);
      }
    });

    return { activeBookings: active, pastBookings: past };
  }, [bookings]);

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
        const fileName = `${Date.now()}_receipt.jpg`;
        const storageRef = ref(
          storage,
          `bookings/${bookingId}/payments/${fileName}`
        );
        const metadata = {
          contentType: 'image/jpeg',
          cacheControl: 'public,max-age=31536000',
        };
        const uploadResult = await uploadBytes(storageRef, file, metadata);
        proofUrl = await getDownloadURL(uploadResult.ref);
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
        proofUrl: 'mock-url-from-storage-pending', // En un entorno real se subiría el file al Storage y se guardaría la URL aquí
      });

      // Registrar transacción en subcolección para UCP
      try {
        const ucpPayload = {
          bookingId,
          amount: booking.totalAmount * 0.20, // 20% seña UCP
          reference: paymentRef,
          proofUrl,
          method: 'P2P',
          methodLabel: 'Pago Móvil / Transferencia',
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
      case 'CANCELLED':
        return {
          label: 'Cancelada',
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-red-500 bg-red-50 border-red-100',
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
    <div className="bg-brand-navy/60 animate-fade-in fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md">
      <div className="animate-slide-up relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-brand-navy flex shrink-0 items-center justify-between border-b border-gray-100 p-8">
          <div className="flex items-center space-x-4">
            <div className="bg-brand-500/20 rounded-2xl p-3">
              <Calendar className="text-brand-500 h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Mis Viajes
              </h2>
              <p className="text-brand-500 mt-0.5 text-[10px] font-black tracking-[0.2em] uppercase">
                Gestión de Reservas VeneStay
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-2xl bg-white/10 p-3 text-white transition-all duration-300 hover:rotate-90 hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="no-scrollbar flex-grow overflow-y-auto p-8">
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
                Explora nuestras propiedades exclusivas y comienza a planificar
                tu próxima estancia en Venezuela.
              </p>
              <button
                onClick={handleClose}
                className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-8 rounded-2xl px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all"
              >
                Explorar Propiedades
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* --- VIAJE ACTIVO PRINCIPAL --- */}
              {activeBookings.length > 0 ? (
                <div className="mx-auto max-w-2xl">
                  <h3 className="text-brand-navy mb-4 text-[10px] font-black tracking-[0.25em] uppercase">
                    Viaje Actual
                  </h3>
                  {activeBookings.slice(0, 1).map((booking) => {
                    const statusInfo = getStatusDisplay(booking.status);
                    return (
                      <div
                        key={booking.id}
                        className="group relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-8 shadow-md transition-all duration-500 hover:shadow-xl"
                      >
                        <div className="bg-brand-navy/5 absolute top-0 right-0 h-32 w-32 translate-x-6 -translate-y-6 rounded-bl-[120px] transition-transform group-hover:scale-110" />

                        <div className="relative z-10">
                          <div className="mb-6 flex items-start justify-between">
                            <div className="flex flex-col gap-2">
                              <div
                                className={cn(
                                  'flex w-fit items-center space-x-2 rounded-full border px-4 py-2 text-[10px] font-black tracking-wider uppercase',
                                  statusInfo.color
                                )}
                              >
                                {statusInfo.icon}
                                <span>{statusInfo.label}</span>
                              </div>
                              {booking.status === 'PENDING_PAYMENT' && (
                                <CountdownTimer createdAt={booking.createdAt} />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveChatId(booking.id);
                                  setActiveChatBooking(booking);
                                }}
                                className="hover:text-brand-navy relative rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 transition-all hover:shadow-md"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <span className="text-[10px] font-black tracking-tighter text-gray-300 uppercase">
                                REF: {booking.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-brand-navy group-hover:text-brand-500 mb-2 text-2xl leading-tight font-black transition-colors">
                            {booking.listingTitle}
                          </h4>

                          <>
                            {booking.status === 'PENDING_APPROVAL' && (
                              <div className="bg-brand-gold/[0.05] border-brand-gold/10 mt-4 rounded-2xl border p-4 space-y-2 select-none">
                                <label className="text-[#b08f23] block text-[8px] font-black tracking-[0.2em] uppercase">
                                  🕐 SOLICITUD ENVIADA — ESPERANDO AL ANFITRIÓN
                                </label>
                                <p className="text-slate-600 text-[10px] leading-relaxed font-bold">
                                  El anfitrión tiene hasta 24 horas para responder a tu solicitud. Se ha realizado un soft-block temporal de las fechas.
                                </p>
                              </div>
                            )}

                            {booking.status === 'EXPIRED' && (
                              <div className="bg-slate-50 border-slate-200 mt-4 rounded-2xl border p-4 space-y-2 select-none">
                                <label className="text-slate-400 block text-[8px] font-black tracking-[0.2em] uppercase">
                                  ⏰ SOLICITUD VENCIDA
                                </label>
                                <p className="text-slate-500 text-[10px] leading-relaxed font-bold">
                                  El anfitrión no respondió a tiempo en las 24 horas reglamentarias. Las fechas han quedado liberadas y no se ha realizado ningún cobro.
                                </p>
                              </div>
                            )}

                            {booking.status === 'REJECTED' && booking.rejectionReason && (
                              <div className="bg-red-50 border-red-100 mt-4 rounded-2xl border p-4 space-y-2 select-none">
                                <label className="text-red-500 block text-[8px] font-black tracking-[0.2em] uppercase">
                                  ✕ SOLICITUD RECHAZADA
                                </label>
                                <p className="text-red-700 text-[10px] leading-relaxed font-bold">
                                  Nota del anfitrión: "{booking.rejectionReason}"
                                </p>
                              </div>
                            )}

                            {booking.status === 'PENDING_PAYMENT' &&
                              booking.paymentInstructions && (
                                <div className="bg-brand-500/5 border-brand-500/10 mt-4 rounded-2xl border p-4">
                                  <label className="text-brand-500 mb-2 block text-[8px] font-black tracking-[0.2em] uppercase">
                                    Instrucciones de Pago
                                  </label>
                                  <p className="text-brand-navy text-[10px] leading-relaxed font-bold whitespace-pre-line">
                                    {booking.paymentInstructions}
                                  </p>
                                </div>
                              )}
                          </>

                          <div className="mt-6 space-y-4">
                            <div className="flex items-center text-sm font-bold text-gray-500">
                              <Calendar className="text-brand-navy/20 mr-3 h-4 w-4" />
                              {booking.startDate &&
                              !isNaN(new Date(booking.startDate).getTime()) &&
                              booking.endDate &&
                              !isNaN(new Date(booking.endDate).getTime())
                                ? `${format(new Date(booking.startDate), 'dd MMM', { locale: es })} - ${format(new Date(booking.endDate), 'dd MMM yyyy', { locale: es })}`
                                : 'Fechas inválidas'}
                            </div>
                            <div className="flex items-center text-sm font-bold text-gray-500">
                              <Users className="text-brand-navy/20 mr-3 h-4 w-4" />
                              {booking.guests}{' '}
                              {booking.guests === 1 ? 'Viajero' : 'Viajeros'}
                            </div>
                            {booking.status === 'AWAITING_VERIFICATION' &&
                              booking.paymentReference && (
                                <div className="text-brand-500 bg-brand-500/5 border-brand-500/10 mt-2 flex items-center rounded-xl border p-2 px-3 text-[10px] font-black tracking-widest uppercase">
                                  <Hash className="mr-2 h-3 w-3" />
                                  Ref: {booking.paymentReference}
                                </div>
                              )}
                                </div>
                              )}
                            <div className="text-brand-navy mt-4 flex items-center border-t border-dashed border-gray-100 py-4 text-xl font-black">
                              <span className="mr-2 text-[10px] text-gray-400 uppercase">
                                Total Reserva
                              </span>
                              ${booking.totalAmount}
                            </div>
                          </div>

                          {booking.status === 'PENDING_PAYMENT' && (
                            <div className="mt-6">
                              <AnimatePresence mode="wait">
                                {verifyingId === booking.id ? (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-4"
                                  >
                                    {/* Zona de Arrastre/Pegado de Comprobante */}
                                    <div
                                      onClick={() => document.getElementById('modal-receipt-upload')?.click()}
                                      className="group border-2 border-dashed border-gray-200 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white relative overflow-hidden flex flex-col items-center justify-center"
                                    >
                                      <input
                                        id="modal-receipt-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                      />
                                      {previewUrl ? (
                                        <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-gray-100">
                                          <img
                                            src={previewUrl}
                                            className="h-full w-full object-cover"
                                            alt="Receipt preview"
                                          />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="h-5 w-5 text-white" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                                            <Upload className="h-5 w-5" />
                                          </div>
                                          <p className="text-[10px] font-black tracking-wider uppercase text-gray-500">
                                            Subir Comprobante
                                          </p>
                                          <p className="text-[9px] text-gray-400">
                                            Haz clic para seleccionar o presiona Ctrl+V para pegar captura
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Input de Referencia */}
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Hash className="text-brand-500 h-3 w-3" />
                                        <span className="text-brand-navy/60 text-[10px] font-black tracking-widest uppercase">
                                          Referencia de Transferencia
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={paymentRef}
                                          onChange={(e) => setPaymentRef(e.target.value)}
                                          placeholder="Ej: 12345678"
                                          className="focus:border-brand-500 flex-grow rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold focus:outline-none"
                                        />
                                        <button
                                          disabled={submitting || !paymentRef || !file}
                                          onClick={() => handlePaymentSubmit(booking.id)}
                                          className="bg-brand-500 text-brand-navy hover:bg-brand-400 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                        >
                                          {submitting ? (
                                            <div className="border-brand-navy h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                          ) : (
                                            <>
                                              Enviar
                                              <ChevronRight className="h-4 w-4" />
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                      <button
                                        onClick={() => {
                                          setVerifyingId(null);
                                          setFile(null);
                                          setPreviewUrl(null);
                                          setPaymentRef('');
                                        }}
                                        className="hover:text-brand-navy text-[10px] font-black tracking-widest text-gray-400 uppercase transition-colors"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => navigate(`/checkout/${booking.id}`)}
                                        className="text-brand-500 text-[10px] font-black tracking-widest uppercase hover:underline"
                                      >
                                        Ver Resumen Completo
                                      </button>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    <motion.button
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      onClick={() => setVerifyingId(booking.id)}
                                      className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy w-full transform rounded-2xl py-4.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                      <Upload className="h-4 w-4" />
                                      Subir Comprobante Rápido
                                    </motion.button>
                                    <button
                                      onClick={() => navigate(`/checkout/${booking.id}`)}
                                      className="text-brand-navy w-full rounded-2xl border-2 border-gray-100 bg-white py-4 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-gray-50"
                                    >
                                      Ver Detalles y Pagar
                                    </button>
                                  </div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mx-auto max-w-md py-12 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-gray-50 mx-auto">
                    <MapPin className="h-8 w-8 text-gray-200" />
                  </div>
                  <h3 className="text-brand-navy mb-2 text-xl font-black">
                    No tienes viajes activos
                  </h3>
                  <p className="mx-auto max-w-xs text-sm text-gray-500">
                    Explora nuestras propiedades exclusivas y comienza a planificar tu próxima estancia en Venezuela.
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-6 rounded-2xl px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all"
                  >
                    Explorar Propiedades
                  </button>
                </div>
              )}

              {/* --- HISTORIAL DE VIAJES COLAPSABLE --- */}
              {pastBookings.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex w-full items-center justify-between rounded-2xl bg-gray-50 hover:bg-gray-100/80 p-4 transition-all"
                  >
                    <span className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial de Viajes ({pastBookings.length})
                    </span>
                    {isHistoryExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isHistoryExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 overflow-hidden"
                      >
                        {pastBookings.map((booking) => {
                          const statusInfo = getStatusDisplay(booking.status);
                          return (
                            <div
                              key={booking.id}
                              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300"
                            >
                              <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div
                                    className={cn(
                                      'flex items-center space-x-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black tracking-wider uppercase',
                                      statusInfo.color
                                    )}
                                  >
                                    {statusInfo.icon}
                                    <span>{statusInfo.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setActiveChatId(booking.id);
                                        setActiveChatBooking(booking);
                                      }}
                                      className="hover:text-brand-navy rounded-lg border border-gray-100 bg-white p-1.5 text-gray-400 transition-all"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="text-[9px] font-bold text-gray-300">
                                      {booking.id.slice(0, 8)}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="text-brand-navy text-sm font-black tracking-tight leading-tight">
                                    {booking.listingTitle}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                                    {booking.startDate &&
                                    !isNaN(new Date(booking.startDate).getTime()) &&
                                    booking.endDate &&
                                    !isNaN(new Date(booking.endDate).getTime())
                                      ? `${format(new Date(booking.startDate), 'dd MMM', { locale: es })} - ${format(new Date(booking.endDate), 'dd MMM yyyy', { locale: es })}`
                                      : 'Fechas inválidas'}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100 text-xs font-bold text-gray-500">
                                  <span>Total</span>
                                  <span className="text-brand-navy font-black">${booking.totalAmount}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>

        <FloatingChat
          isOpen={!!activeChatId}
          onClose={() => {
            setActiveChatId(null);
            setActiveChatBooking(null);
          }}
          bookingId={activeChatId}
          listingTitle={activeChatBooking?.listingTitle || ''}
          senderId={user?.uid || ''}
          senderName={user?.displayName || 'Huésped'}
          recipientName="Soporte VeneStay"
          recipientId={activeChatBooking?.ownerId}
        />
      </div>
    </div>
  );
};

export default MyTrips;






