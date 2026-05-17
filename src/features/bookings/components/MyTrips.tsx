import React, { useEffect, useState } from 'react';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Chat from '@/components/Chat';
import FloatingChat from '@/components/FloatingChat';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MyTripsProps {
  isOpen: boolean;
  onClose: () => void;
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
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !user) {
      setBookings([]);
      return;
    }

    setLoading(true);

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
  }, [isOpen, user]);

  const handlePaymentSubmit = async (bookingId: string) => {
    if (!paymentRef.trim()) return;
    setSubmitting(true);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      const historyEntry = {
        status: 'AWAITING_VERIFICATION' as const,
        timestamp: new Date().toISOString(),
        actorId: user.uid,
        actorName: user.displayName || 'Huésped',
        note: `Comprobante enviado. Ref: ${paymentRef}`,
      };

      await updateDoc(bookingRef, {
        status: 'AWAITING_VERIFICATION',
        paymentReference: paymentRef,
        paymentSubmittedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        statusHistory: [...(booking.statusHistory || []), historyEntry],
      });
      setVerifyingId(null);
      setPaymentRef('');
    } catch (error) {
      console.error('Error updating payment info:', error);
      toast.error('Hubo un error al subir el comprobante. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return {
          label: 'Pago Pendiente',
          icon: <Clock className="h-3 w-3" />,
          color: 'text-amber-500 bg-amber-50 border-amber-100',
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
            onClick={onClose}
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
                onClick={onClose}
                className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-8 rounded-2xl px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all"
              >
                Explorar Propiedades
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {bookings.map((booking) => {
                const statusInfo = getStatusDisplay(booking.status);
                return (
                  <div
                    key={booking.id}
                    className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-xl"
                  >
                    <div className="bg-brand-navy/5 absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-bl-[100px] transition-transform group-hover:scale-110" />

                    <div className="relative z-10">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex flex-col gap-2">
                          <div
                            className={cn(
                              'flex w-fit items-center space-x-2 rounded-full border px-3 py-1.5 text-[10px] font-black tracking-wider uppercase',
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
                            className="hover:text-brand-navy relative rounded-xl border border-gray-100 bg-white p-2 text-gray-400 transition-all hover:shadow-md"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <span className="text-[10px] font-black tracking-tighter text-gray-300 uppercase">
                            REF: {booking.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-brand-navy group-hover:text-brand-500 mb-1 text-lg leading-tight font-black transition-colors">
                        {booking.listingTitle}
                      </h4>

                      <>
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

                        <div className="mt-6 space-y-3">
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
                          <div className="text-brand-navy mt-4 flex items-center border-t border-dashed border-gray-100 py-4 text-lg font-black">
                            <span className="mr-2 text-[10px] text-gray-400 uppercase">
                              Total
                            </span>
                            ${booking.totalAmount}
                          </div>
                        </div>

                        {booking.status === 'PENDING_PAYMENT' && (
                          <div className="mt-6 space-y-3">
                            <AnimatePresence mode="wait">
                              {verifyingId === booking.id ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                                >
                                  <div className="mb-3 flex items-center space-x-2">
                                    <Hash className="text-brand-500 h-3 w-3" />
                                    <span className="text-brand-navy/60 text-[10px] font-black tracking-widest uppercase">
                                      Ref. de Transferencia
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={paymentRef}
                                      onChange={(e) =>
                                        setPaymentRef(e.target.value)
                                      }
                                      placeholder="Ej: 12345678"
                                      className="focus:border-brand-500 flex-grow rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold focus:outline-none"
                                    />
                                    <button
                                      disabled={submitting || !paymentRef}
                                      onClick={() =>
                                        handlePaymentSubmit(booking.id)
                                      }
                                      className="bg-brand-500 text-brand-navy rounded-xl p-2 shadow-lg transition-transform active:scale-90 disabled:opacity-50"
                                    >
                                      {submitting ? (
                                        <div className="border-brand-navy h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between">
                                    <button
                                      onClick={() => setVerifyingId(null)}
                                      className="hover:text-brand-navy text-[10px] font-black tracking-widest text-gray-400 uppercase transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() =>
                                        navigate(`/checkout/${booking.id}`)
                                      }
                                      className="text-brand-500 text-[10px] font-black tracking-widest uppercase hover:underline"
                                    >
                                      Ver Resumen Completo
                                    </button>
                                  </div>
                                </motion.div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setVerifyingId(booking.id)}
                                    className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy w-full transform rounded-2xl py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all active:scale-95"
                                  >
                                    Subir Comprobante Rápido
                                  </motion.button>
                                  <button
                                    onClick={() =>
                                      navigate(`/checkout/${booking.id}`)
                                    }
                                    className="text-brand-navy w-full rounded-2xl border-2 border-gray-100 bg-white py-4 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-gray-50"
                                  >
                                    Ver Detalles y Pagar
                                  </button>
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </>
                    </div>
                  </div>
                );
              })}
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
        />
      </div>
    </div>
  );
};

export default MyTrips;






