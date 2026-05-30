import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Calendar,
  Users,
  Hash,
  Filter,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types';
import { calculateCommission, getCommissionTier, CommissionTier } from '@/lib/commission';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PromptDialog } from '@/components/ui/PromptDialog';
import { useChatNotifications } from '@/features/bookings/hooks/useChatNotifications';

const CountdownTimer: React.FC<{ expiresAt?: string }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const calculateTime = () => {
      const difference = new Date(expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft('Expirado');
        return;
      }
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="flex items-center gap-1 w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black tracking-widest text-amber-700 uppercase animate-pulse">
      <Clock className="h-3 w-3 text-amber-600" />
      <span>Vence en: {timeLeft}</span>
    </div>
  );
};

interface BookingListProps {
  bookings: Booking[];
  isAdmin: boolean;
  user: { uid: string; displayName?: string | null } | null;
  handleUpdateStatus: (booking: Booking, newStatus: BookingStatus, note?: string) => Promise<void>;
  setActiveChatId: (id: string | null) => void;
  setActiveChatBooking: (booking: Booking | null) => void;
  tier: CommissionTier;
  onVerifyRequest: (booking: Booking) => void;
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  isAdmin,
  user,
  handleUpdateStatus,
  setActiveChatId,
  setActiveChatBooking,
  tier,
  onVerifyRequest,
}) => {
  const [bookingToReject, setBookingToReject] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const { unreadPerBooking } = useChatNotifications();

  const getSafeDate = (dateVal: Date | string | { seconds: number } | null | undefined | unknown): Date | null => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === 'string') {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? null : d;
    }
    if (dateVal && typeof dateVal === 'object') {
      const obj = dateVal as { seconds?: number; toDate?: () => Date };
      if (typeof obj.seconds === 'number') {
        return new Date(obj.seconds * 1000);
      }
      if (typeof obj.toDate === 'function') {
        return obj.toDate();
      }
    }
    return null;
  };

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Filter className="mb-6 h-16 w-16 text-gray-100" />
        <h3 className="text-brand-navy text-xl font-black">
          No hay reservas
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          No se encontraron registros con este filtro.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {bookings.map((booking) => {
        const isConflicting = bookings.some(b => {
          if (b.id === booking.id || b.listingId !== booking.listingId) return false;
          if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') return false;
          if (b.status === 'REJECTED' || b.status === 'CANCELLED') return false;

          try {
            const start1 = startOfDay(parseISO(booking.startDate));
            const end1 = startOfDay(parseISO(booking.endDate));
            const start2 = startOfDay(parseISO(b.startDate));
            const end2 = startOfDay(parseISO(b.endDate));

            return (
              isWithinInterval(start1, { start: start2, end: end2 }) ||
              isWithinInterval(end1, { start: start2, end: end2 }) ||
              isWithinInterval(start2, { start: start1, end: end1 })
            );
          } catch {
            return false;
          }
        });

        return (
        <motion.div
          layout
          key={booking.id}
          className={cn("flex h-full flex-col rounded-[32px] border bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-xl", isConflicting && booking.status === 'AWAITING_VERIFICATION' ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-100')}
        >
          <div className="mb-6 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div
                className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black tracking-widest uppercase',
                booking.status === 'CONFIRMED'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  : booking.status === 'AWAITING_VERIFICATION'
                    ? 'border-blue-100 bg-blue-50 text-blue-600'
                    : booking.status === 'PENDING_PAYMENT'
                      ? 'border-amber-100 bg-amber-50 text-amber-600'
                      : booking.status === 'PENDING_APPROVAL'
                        ? 'border-amber-200 bg-amber-50/50 text-amber-700'
                        : booking.status === 'EXPIRED'
                          ? 'border-gray-200 bg-gray-50 text-gray-400'
                          : booking.status === 'REJECTED'
                            ? 'border-red-100 bg-red-50 text-red-600'
                            : 'border-gray-100 bg-gray-50 text-gray-600'
              )}
            >
              {booking.status === 'CONFIRMED' ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : booking.status === 'REJECTED' || booking.status === 'EXPIRED' ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {booking.status === 'CONFIRMED'
                ? 'Confirmada'
                : booking.status === 'AWAITING_VERIFICATION'
                  ? 'Verificación Pendiente'
                  : booking.status === 'PENDING_PAYMENT'
                    ? 'Esperando Pago'
                    : booking.status === 'PENDING_APPROVAL'
                      ? 'Solicitud Pendiente'
                      : booking.status === 'EXPIRED'
                        ? 'Solicitud Expirada'
                        : booking.status === 'REJECTED'
                          ? 'Rechazada'
                          : 'Cancelada'}
              </div>
              {booking.status === 'PENDING_APPROVAL' && (
                <CountdownTimer expiresAt={booking.expiresAt} />
              )}
              {isConflicting && booking.status === 'AWAITING_VERIFICATION' && (
                <div className="flex w-fit items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-[9px] font-black tracking-widest text-red-600 uppercase">
                    Solapamiento de Fechas
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveChatId(booking.id);
                  setActiveChatBooking(booking);
                }}
                className={cn(
                  "relative flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all hover:shadow-lg active:scale-95",
                  unreadPerBooking[booking.id] > 0
                    ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 shadow-sm shadow-red-100"
                    : "bg-white border-gray-200 text-gray-400 hover:text-brand-navy hover:border-gray-300"
                )}
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
                <span>Chat</span>
                {unreadPerBooking[booking.id] > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                    {unreadPerBooking[booking.id]}
                  </span>
                )}
              </button>
              <span className="shrink-0 text-[10px] font-black text-gray-300 uppercase">
                REF: {booking.id.slice(0, 8)}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <div className="mb-8 flex flex-col gap-6 sm:flex-row">
              <div className="flex-grow space-y-4">
                <h4 className="text-brand-navy text-xl leading-tight font-black">
                  {booking.listingTitle}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-xs font-bold text-gray-500">
                    <Calendar className="text-brand-500 mr-2 h-4 w-4" />
                    {booking.startDate &&
                    !isNaN(new Date(booking.startDate).getTime()) &&
                    booking.endDate &&
                    !isNaN(new Date(booking.endDate).getTime())
                      ? `${format(new Date(booking.startDate), 'dd/MM')} - ${format(new Date(booking.endDate), 'dd/MM/yy')}`
                      : 'Fechas inválidas'}
                  </div>
                  <div className="flex items-center text-xs font-bold text-gray-500">
                    <Users className="text-brand-500 mr-2 h-4 w-4" />
                    {booking.guests} Huéspedes
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-2xl bg-gray-50 p-3">
                  <div className="bg-brand-navy flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white uppercase">
                    {booking.guestName?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-brand-navy text-xs font-black uppercase">
                      {booking.guestName}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      Inquilino
                    </span>
                  </div>
                </div>
                {booking.guestMessage && (
                  <div className="relative mt-2 rounded-2xl bg-amber-50/40 border border-amber-100 p-3 text-xs text-brand-navy">
                    <p className="font-semibold text-[9px] uppercase tracking-wider text-amber-700 mb-1">
                      Presentación del huésped:
                    </p>
                    <p className="italic text-gray-600 font-medium">
                      "{booking.guestMessage}"
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-brand-navy flex w-full flex-col gap-4 rounded-3xl p-5 text-white sm:w-56">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-500 text-[9px] font-black tracking-widest uppercase">Ganancia Real</span>
                    <span className="bg-brand-500 rounded-full px-2 py-0.5 text-[8px] font-black text-brand-navy">
                      Tier {tier}%
                    </span>
                  </div>
                  <span className="text-2xl font-black">
                    ${calculateCommission(booking.totalAmount, tier).hostNetProfit.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400">Total: ${booking.totalAmount}</span>
                </div>
                
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Cobro Check-in (80%)</span>
                    <span className="text-xs font-black text-emerald-400">${calculateCommission(booking.totalAmount, tier).ucpBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Liquidación Garantía</span>
                    <span className="text-xs font-black text-brand-500">${calculateCommission(booking.totalAmount, tier).settlementAmount.toFixed(2)}</span>
                  </div>
                </div>

                {booking.paymentReference && (
                  <div className="mt-2 flex flex-col border-t border-white/10 pt-4">
                    <span className="text-brand-500 flex items-center gap-1 text-[10px] font-black uppercase">
                      <Hash className="h-3 w-3" /> Referencia
                    </span>
                    <span className="truncate text-xs font-black">
                      {booking.paymentReference}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </AnimatePresence>

          {/* Admin Actions */}
          <div className="mt-auto space-y-4 border-t border-dashed border-gray-100 pt-6">
            {booking.status === 'AWAITING_VERIFICATION' && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleUpdateStatus(booking, 'CONFIRMED')
                    }
                    className="flex-grow transform rounded-2xl bg-emerald-500 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
                  >
                    Validar Pago
                  </button>
                  <button
                    onClick={() => setBookingToReject(booking)}
                    className="transform rounded-2xl border-2 border-red-100 px-6 py-3 text-[10px] font-black tracking-widest text-red-500 uppercase transition-all hover:bg-red-50 active:scale-95"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {booking.status === 'PENDING_APPROVAL' && (
              <button
                onClick={() => onVerifyRequest(booking)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-gold bg-white py-3 text-[10px] font-black tracking-widest text-brand-navy uppercase shadow-sm transition-all hover:bg-brand-gold/10 active:scale-95"
                aria-label={`Verificar solicitud de ${booking.guestName}`}
              >
                Verificar Solicitud →
              </button>
            )}

            {/* Status History / Info */}
            <div className="space-y-2 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                  Actividad de la Reserva
                </span>
                {booking.verifiedBy && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-600">
                    Verificado por {booking.verifiedBy}
                  </span>
                )}
              </div>

              <div className="no-scrollbar max-h-24 space-y-2 overflow-y-auto pr-2">
                {booking.statusHistory?.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-[9px]"
                  >
                    <div className="bg-brand-500 mt-1.5 h-1 w-1 shrink-0 rounded-full" />
                    <div className="flex-grow">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="text-brand-navy font-black uppercase">
                          {h.status}
                        </span>
                        <span className="text-[8px] text-gray-400">
                          {(() => {
                            const d = getSafeDate(h.timestamp);
                            return d ? format(d, 'dd/MM HH:mm') : '';
                          })()}
                        </span>
                      </div>
                      {h.note && (
                        <p className="leading-snug text-gray-500 italic">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(!booking.statusHistory ||
                  booking.statusHistory.length === 0) && (
                  <p className="text-[10px] text-gray-400 italic">
                    No hay historial registrado.
                  </p>
                )}
              </div>
            </div>

            {booking.status === 'CONFIRMED' && (
              <div className="flex w-full items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 py-3">
                <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                  Reserva Asegurada ✓
                </span>
              </div>
            )}
            {booking.status === 'REJECTED' && (
              <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-3">
                <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">
                  Pago Rechazado ✕
                </span>
                {booking.rejectionReason && (
                  <p className="mt-1 text-[9px] font-bold text-red-400">
                    {booking.rejectionReason}
                  </p>
                )}
              </div>
            )}
            {booking.status === 'EXPIRED' && (
              <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-3">
                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Solicitud Expirada ✕
                </span>
                <p className="mt-1 text-[9px] font-medium text-gray-400">
                  Expiró automáticamente a las 24 horas sin respuesta.
                </p>
              </div>
            )}
            {booking.status === 'PENDING_PAYMENT' && (
              <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-amber-50 py-3">
                <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">
                  Esperando comprobante del Huésped
                </span>
                <div className="mt-2">
                  <button
                    onClick={() => setBookingToCancel(booking)}
                    className="text-[8px] font-black tracking-tighter text-amber-700 uppercase underline"
                  >
                    Forzar Cancelación
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )})}
      
      <PromptDialog
        isOpen={!!bookingToReject}
        onClose={() => setBookingToReject(null)}
        onConfirm={(reason) => {
          if (bookingToReject) {
            handleUpdateStatus(bookingToReject, 'REJECTED', reason);
          }
        }}
        title="Rechazar Reserva"
        message="Indica la razón del rechazo para que el huésped esté informado:"
        placeholder="Razón del rechazo..."
        confirmText="Rechazar Pago"
        required
      />

      <ConfirmDialog
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={() => {
          if (bookingToCancel) {
            handleUpdateStatus(bookingToCancel, 'CANCELLED', 'Cancelada por administrador');
          }
        }}
        title="Forzar Cancelación"
        message="¿Deseas cancelar esta reserva por falta de pago? Esta acción no se puede deshacer."
        confirmText="Sí, Cancelar"
        isDestructive
      />
    </div>
  );
};

export default BookingList;
