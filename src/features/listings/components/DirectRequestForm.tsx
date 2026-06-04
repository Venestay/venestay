import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Users,
  Loader2,
  Star,
  Clock
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useGuestProfile } from '@/features/dashboard/hooks/useGuestProfile';
import CalendarComponent from '@/features/bookings/components/Calendar';
import { requestBookingDirectly } from '@/services/booking-service';
import { Listing } from '@/types';
import { cn, calculatePaymentBreakdown } from '@/lib/utils';
import { directRequestSchema } from '../schemas/directRequest.schema';
import { User } from 'firebase/auth';

interface DirectRequestFormProps {
  listing: Listing;
  user: User | null;
  onSuccess?: (bookingId: string) => void;
  reservedDates?: { start: Date; end: Date }[];
  softReservedDates?: { start: Date; end: Date }[];
}

export const DirectRequestForm: React.FC<DirectRequestFormProps> = ({
  listing,
  user,
  onSuccess,
  reservedDates = [],
  softReservedDates = []
}) => {
  const navigate = useNavigate();
  const { profileData } = useAuth();

  // Trust Score check
  const { trustScore, isLoading: isProfileLoading } = useGuestProfile(user?.uid);

  // State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [guestsCount, setGuestsCount] = useState(2);
  const [guestMessage, setGuestMessage] = useState('');
  const paymentMethod: 'ves' | 'usdt' = 'usdt';
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Caracteres restantes
  const messageLength = guestMessage.trim().length;
  const isMessageValid = messageLength >= 20;

  const totalNights = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice = totalNights > 0 ? listing.pricePerNight * totalNights : listing.pricePerNight;

  const breakdown = calculatePaymentBreakdown(totalPrice, 12, listing.cleaningFee || 0);
  const anticipoAmount = breakdown.depositAmount;
  const remainingAmount = breakdown.remainingBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Por favor, inicia sesión para solicitar tu reserva.');
      return;
    }

    if (trustScore < 40) {
      toast.error('Tu nivel de confianza (Trust Score) es menor a 40%. Completa tu perfil para realizar reservas directas.');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Selecciona las fechas de tu estadía.');
      setIsCalendarOpen(true);
      return;
    }

    const minNights = listing.minNights ?? 2;
    if (totalNights < minNights) {
      toast.error(`La estadía mínima para este alojamiento es de ${minNights} noches.`);
      return;
    }

    // Validar esquema Zod
    const validation = directRequestSchema.safeParse({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      guestMessage,
      guestsCount,
      paymentMethod
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        listingId: listing.id,
        listingTitle: listing.title,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        guestMessage,
        guestId: user.uid,
        guestName: profileData?.displayName || user.displayName || 'Huésped',
        hostId: listing.hostId,
        guestsCount,
        anticipoAmount,
        totalAmount: totalPrice,
        paymentMethod
      };

      const result = await requestBookingDirectly(payload);

      toast.success('¡Solicitud enviada! El anfitrión responderá en menos de 24 horas.');

      if (onSuccess) {
        onSuccess(result.bookingId);
      } else {
        navigate(`/mis-viajes`);
      }
    } catch (error) {
      console.error('Error creating direct booking request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar la solicitud. Intenta de nuevo.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[32px] border border-white/60 p-6 md:p-8 bg-white/98 backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.04),0_0_50px_rgba(212,175,55,0.015)] space-y-6.5">

      {/* HEADER EXPLICATIVO */}
      <div className="flex flex-col space-y-3.5 border-b border-slate-100 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-brand-navy text-2xl font-black block tracking-tight">
              Solicitar Reserva
            </span>
            <span className="text-[10.5px] font-semibold text-slate-500 block leading-relaxed">
              El anfitrión responderá en menos de 24 horas. Sin cargos previos.
            </span>
          </div>
          <div className="flex items-center gap-1 bg-brand-navy/[0.02] border border-brand-navy/[0.06] rounded-xl px-2.5 py-1.5 shrink-0 select-none">
            <Star className="text-brand-500 fill-brand-500 h-3.5 w-3.5" />
            <span className="text-brand-navy text-[11px] font-extrabold">
              {listing.rating}
            </span>
          </div>
        </div>
        <div className="flex select-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/[0.07] border border-brand-gold/[0.18] px-3.5 py-1 text-[10.5px] font-bold text-[#b08f23] tracking-wide">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
            Anticipo diferido del 20% si el dueño aprueba
          </span>
        </div>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* BLOQUE DE FECHAS & HUÉSPEDES */}
        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          <div className="grid grid-cols-2 border-b border-slate-100">
            <div
              className="cursor-pointer border-r border-slate-100 p-4 hover:bg-slate-50/50"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <div className="mb-1 flex items-center space-x-1.5 select-none">
                <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                  Entrada
                </p>
              </div>
              <p className="text-brand-navy text-[12.5px] font-black leading-tight mt-1">
                {startDate ? format(startDate, 'dd MMM yyyy', { locale: es }) : 'Elegir fecha'}
              </p>
            </div>

            <div
              className="cursor-pointer p-4 hover:bg-slate-50/50"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <div className="mb-1 flex items-center space-x-1.5 select-none">
                <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                  Salida
                </p>
              </div>
              <p className="text-brand-navy text-[12.5px] font-black leading-tight mt-1">
                {endDate ? format(endDate, 'dd MMM yyyy', { locale: es }) : 'Elegir fecha'}
              </p>
            </div>
          </div>

          {/* CALENDARIO DESPLEGABLE */}
          <AnimatePresence>
            {isCalendarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-slate-100 bg-white"
              >
                <div className="p-2">
                  <CalendarComponent
                    startDate={startDate}
                    endDate={endDate}
                    reservedDates={reservedDates}
                    softReservedDates={softReservedDates}
                    minNights={listing.minNights ?? 2}
                    onChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CANTIDAD DE HUÉSPEDES */}
          <div className="flex items-center justify-between p-4 bg-white select-none">
            <div className="flex items-center space-x-2">
              <Users className="text-brand-navy/40 h-3.5 w-3.5" />
              <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                Huéspedes
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 active:scale-95 text-xs font-bold"
              >
                -
              </button>
              <span className="text-brand-navy min-w-[2.5rem] text-center text-xs font-black">
                {guestsCount} {guestsCount === 1 ? 'Viajero' : 'Viajeros'}
              </span>
              <button
                type="button"
                onClick={() => setGuestsCount(Math.min(listing.maxGuests, guestsCount + 1))}
                disabled={guestsCount >= listing.maxGuests}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 active:scale-95 disabled:opacity-30 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* MENSAJE AL ANFITRIÓN */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="text-[8.5px] font-black tracking-[0.12em] uppercase text-slate-400">
              Mensaje al Anfitrión (Mín. 20 caracteres)
            </label>
            <span className={cn(
              "text-[9px] font-bold select-none",
              isMessageValid ? "text-emerald-600" : "text-amber-600"
            )}>
              {messageLength} / 500
            </span>
          </div>
          <textarea
            required
            rows={4}
            value={guestMessage}
            onChange={(e) => setGuestMessage(e.target.value.slice(0, 500))}
            placeholder="Preséntate con el anfitrión, cuéntale el motivo de tu viaje y quién te acompaña. Esto incrementa tu probabilidad de aceptación..."
            className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#b08f23] focus:ring-1 focus:ring-[#b08f23] focus:outline-none"
          />
          {messageLength > 0 && !isMessageValid && (
            <p className="text-[9px] font-bold text-red-500 uppercase select-none">
              El mensaje debe tener al menos {20 - messageLength} caracteres más.
            </p>
          )}
        </div>

        {/* DESGLOSE FINANCIERO ESTIMADO */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Estadía ({totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : '1 noche'})</span>
            <span className="font-extrabold text-brand-navy">${(listing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Limpieza de alojamiento</span>
            {listing.cleaningFee && listing.cleaningFee > 0 ? (
              <span className="font-extrabold text-brand-navy font-sans text-xs">${listing.cleaningFee} USD</span>
            ) : (
              <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none uppercase tracking-widest">Incluida</span>
            )}
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Servicios e Impuestos</span>
            <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none uppercase tracking-widest">Incluidos</span>
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <div className="flex justify-between items-baseline font-black text-brand-navy">
              <span className="text-[9px] tracking-widest uppercase text-slate-400">Anticipo de Reserva (20%)</span>
              <span className="text-sm font-black text-brand-gold">
                ${anticipoAmount.toFixed(0)} USDT
              </span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-slate-400 text-[10px]">
              <span>Saldo al llegar (80% + Limpieza)</span>
              <span className="font-semibold">${remainingAmount.toFixed(0)} USD</span>
            </div>
          </div>
        </div>

        {/* TRUST GATE ALERT */}
        {user && !isProfileLoading && trustScore < 40 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
              Perfil Incompleto
            </p>
            <p className="text-xs text-red-500 font-medium leading-relaxed">
              Tu nivel de confianza actual ({trustScore}%) no cumple con el mínimo requerido (40%) para solicitar reservas. Por favor, verifica tu identidad o número de teléfono.
            </p>
          </div>
        )}

        {/* BOTÓN DE ACCIÓN */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isMessageValid || (user ? trustScore < 40 : false)}
            className={cn(
              "w-full rounded-[24px] py-4.5 text-[11px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2",
              isSubmitting || !isMessageValid || (user ? trustScore < 40 : false)
                ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-gold to-[#cfae69] text-brand-navy hover:shadow-lg active:scale-98 cursor-pointer"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando solicitud...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Solicitar Reserva de Forma Segura
              </>
            )}
          </button>
          <p className="text-center text-[9px] text-slate-400 font-medium tracking-normal mt-2.5">
            🔒 No se realizará ningún cobro hasta que el anfitrión apruebe la solicitud.
          </p>
        </div>

      </form>

    </div>
  );
};
