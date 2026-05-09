import React from 'react';
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
import { calculateCommission, getCommissionTier } from '@/lib/commission';

interface BookingListProps {
  bookings: Booking[];
  isAdmin: boolean;
  user: any;
  handleUpdateStatus: (booking: Booking, newStatus: BookingStatus, note?: string) => Promise<void>;
  setActiveChatId: (id: string | null) => void;
  setActiveChatBooking: (booking: Booking | null) => void;
  tier: number;
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  isAdmin,
  user,
  handleUpdateStatus,
  setActiveChatId,
  setActiveChatBooking,
  tier,
}) => {
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
                      : booking.status === 'REJECTED'
                        ? 'border-red-100 bg-red-50 text-red-600'
                        : 'border-gray-100 bg-gray-50 text-gray-600'
              )}
            >
              {booking.status === 'CONFIRMED' ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : booking.status === 'REJECTED' ? (
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
                    : booking.status === 'REJECTED'
                      ? 'Rechazada'
                      : 'Cancelada'}
              </div>
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
                className="hover:text-brand-navy rounded-xl border border-gray-200 bg-white p-2 text-gray-400 transition-all hover:shadow-md"
              >
                <MessageSquare className="h-4 w-4" />
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
                    ${calculateCommission(booking.totalAmount, tier as any).hostNetProfit.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400">Total: ${booking.totalAmount}</span>
                </div>
                
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Cobro Check-in (80%)</span>
                    <span className="text-xs font-black text-emerald-400">${calculateCommission(booking.totalAmount, tier as any).ucpBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Liquidación Garantía</span>
                    <span className="text-xs font-black text-brand-500">${calculateCommission(booking.totalAmount, tier as any).settlementAmount.toFixed(2)}</span>
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
                    onClick={() => {
                      const reason = window.prompt(
                        'Indica la razón del rechazo:'
                      );
                      if (reason)
                        handleUpdateStatus(
                          booking,
                          'REJECTED',
                          reason
                        );
                    }}
                    className="transform rounded-2xl border-2 border-red-100 px-6 py-3 text-[10px] font-black tracking-widest text-red-500 uppercase transition-all hover:bg-red-50 active:scale-95"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
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
                          {h.timestamp &&
                          !isNaN(new Date(h.timestamp).getTime())
                            ? format(
                                new Date(h.timestamp),
                                'dd/MM HH:mm'
                              )
                            : ''}
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
            {booking.status === 'PENDING_PAYMENT' && (
              <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-amber-50 py-3">
                <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">
                  Esperando comprobante del Huésped
                </span>
                <div className="mt-2">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          '¿Deseas cancelar esta reserva por falta de pago?'
                        )
                      ) {
                        handleUpdateStatus(
                          booking,
                          'CANCELLED',
                          'Cancelada por administrador'
                        );
                      }
                    }}
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
    </div>
  );
};

export default BookingList;
