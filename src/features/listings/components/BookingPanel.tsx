import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { NavigateOptions } from 'react-router-dom';
import {
  Clock,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  Globe,
} from 'lucide-react';
import { cn, calculatePaymentBreakdown } from '@/lib/utils';
import CalendarComponent from '@/features/bookings/components/Calendar';
import ExchangeCalculator from '@/features/bookings/components/checkout/ExchangeCalculator';
import { DirectRequestForm } from './DirectRequestForm';
import { Listing } from '@/types';
import { CancellationPolicyType } from '../types';
import { CANCELLATION_POLICIES } from '../utils/cancellationPolicies';

interface BookingPanelProps {
  listing: Listing;
  user: FirebaseUser | null;
  startDate: Date | null;
  endDate: Date | null;
  onDatesChange: (start: Date | null, end: Date | null) => void;
  guests: number;
  setGuests: (guests: number) => void;
  bookingError: string | null;
  reservedDates: { start: Date; end: Date }[];
  softReservedDates: { start: Date; end: Date }[];
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  isBreakdownOpen: boolean;
  setIsBreakdownOpen: (open: boolean) => void;
  isPanelExpanded: boolean;
  togglePanel: () => void;
  handleBooking: () => void;
  totalNights: number;
  totalPrice: number;
  isMobileRequestOpen: boolean;
  setIsMobileRequestOpen: (open: boolean) => void;
  navigate: (path: string, options?: NavigateOptions) => void;
  onOpenAuth?: (view?: 'login' | 'register') => void;
}

export const BookingPanel: React.FC<BookingPanelProps> = ({
  listing,
  user,
  startDate,
  endDate,
  onDatesChange,
  guests,
  setGuests,
  bookingError,
  reservedDates,
  softReservedDates,
  isCalendarOpen,
  setIsCalendarOpen,
  isBreakdownOpen,
  setIsBreakdownOpen,
  isPanelExpanded,
  togglePanel,
  handleBooking,
  totalNights,
  totalPrice,
  isMobileRequestOpen,
  setIsMobileRequestOpen,
  navigate,
  onOpenAuth,
}) => {
  const isRequestMode = (listing.bookingMode as string) === 'request';
  const SHOW_CANCELLATION_POLICY_DETAIL = true;

  return (
    <>
      {/* Mobile Booking Details Accordion (in-page block on mobile) */}
      <div className="space-y-6 block lg:hidden border-t border-gray-100 pt-8">
        <h3 className="text-brand-navy flex items-center text-2xl font-black">
          <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
            04
          </span>
          Detalle de Reserva y Divisas
        </h3>

        <div className="rounded-[32px] border border-gray-100 p-6 bg-gray-50/30 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 border-b border-slate-100">
              <div
                className="cursor-pointer border-r border-slate-100 p-4 active:bg-slate-50"
                onClick={() => setIsCalendarOpen(true)}
              >
                <div className="mb-1 flex items-center space-x-1.5 select-none">
                  <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                  <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                    Check-in
                  </p>
                </div>
                <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                  {startDate
                    ? format(startDate, 'dd MMM yyyy', { locale: es })
                    : 'Elegir fecha'}
                </p>
              </div>
              <div
                className="cursor-pointer p-4 active:bg-slate-50"
                onClick={() => setIsCalendarOpen(true)}
              >
                <div className="mb-1 flex items-center space-x-1.5 select-none">
                  <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                  <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                    Check-out
                  </p>
                </div>
                <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                  {endDate
                    ? format(endDate, 'dd MMM yyyy', { locale: es })
                    : 'Elegir fecha'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white select-none">
              <div className="flex items-center space-x-2">
                <Users className="text-brand-navy/40 h-3.5 w-3.5" />
                <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                  Huéspedes
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 active:bg-slate-100 text-xs font-bold"
                  aria-label="Disminuir número de huéspedes"
                >
                  -
                </button>
                <span className="text-brand-navy min-w-10 text-center text-xs font-black">
                  {guests} {guests === 1 ? 'Viajero' : 'Viajeros'}
                </span>
                <button
                  onClick={() => setGuests(Math.min(listing.maxGuests, guests + 1))}
                  disabled={guests >= listing.maxGuests}
                  className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 active:bg-slate-100 disabled:opacity-30 text-xs font-bold"
                  aria-label="Aumentar número de huéspedes"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <ExchangeCalculator
              totalPrice={totalNights > 0 ? totalPrice : listing.pricePerNight}
              depositAmount={
                totalNights > 0
                  ? calculatePaymentBreakdown(totalPrice, 12, listing.cleaningFee || 0).depositAmount
                  : calculatePaymentBreakdown(listing.pricePerNight, 12, listing.cleaningFee || 0).depositAmount
              }
              remainingAmount={
                totalNights > 0
                  ? calculatePaymentBreakdown(totalPrice, 12, listing.cleaningFee || 0).remainingBalance
                  : calculatePaymentBreakdown(listing.pricePerNight, 12, listing.cleaningFee || 0).remainingBalance
              }
              paymentMethods={listing.paymentMethods}
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="flex w-full items-center justify-between text-[10px] font-black tracking-widest text-[#0a142c]/60 uppercase py-1 px-1 select-none"
              aria-expanded={isBreakdownOpen}
            >
              <span>{isBreakdownOpen ? 'Ocultar desglose' : 'Ver desglose de tarifas'}</span>
              <span className="text-sm font-semibold transition-transform duration-200 text-slate-400" style={{ transform: isBreakdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                ▼
              </span>
            </button>
            <AnimatePresence>
              {isBreakdownOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3.5 pt-4 pb-2 px-1 text-[12px] font-medium text-slate-500">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 font-medium">Estadía • {totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : '1 noche'}</span>
                      <span className="font-extrabold text-brand-navy font-sans text-sm">
                        ${(listing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Limpieza de alojamiento</span>
                      {listing.cleaningFee && listing.cleaningFee > 0 ? (
                        <span className="font-extrabold text-brand-navy font-sans text-sm">
                          ${listing.cleaningFee} USD
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none">
                          Incluida
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Servicios de plataforma</span>
                      <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none">
                        $0 Cargo
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Impuestos municipales</span>
                      <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none">
                        Incluidos
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-3.5 flex justify-between items-baseline font-black text-brand-navy mt-1">
                      <span className="text-[10px] tracking-widest uppercase text-slate-400 font-extrabold">Total Final</span>
                      <span className="text-base font-extrabold font-sans">
                        ${(listing.pricePerNight * (totalNights > 0 ? totalNights : 1) + (listing.cleaningFee || 0)).toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {SHOW_CANCELLATION_POLICY_DETAIL && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#0a142c]/60 uppercase select-none">
                <Info className="h-3.5 w-3.5 text-brand-gold" />
                <span>Política de Cancelación</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-slate-500 font-medium">
                {(() => {
                  const policyKey = 'non_refundable_reschedulable' as CancellationPolicyType;
                  const policy = CANCELLATION_POLICIES[policyKey];
                  return (
                    <>
                      <strong>{policy.label}:</strong> {policy.detail}
                    </>
                  );
                })()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Booking Panel — Variants Expanded / Collapsed */}
      {isRequestMode ? (
        <div className="hidden w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-[460px] pr-2" role="complementary" aria-label="Formulario de solicitud de reserva">
          <DirectRequestForm
            listing={listing}
            user={user}
            onSuccess={() => navigate('/mis-viajes')}
            reservedDates={reservedDates}
            softReservedDates={softReservedDates}
            onOpenAuth={onOpenAuth}
          />
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {isPanelExpanded ? (
            /* VARIANTE EXPANDED (panel sticky actual) */
            <motion.div
              key="booking-panel-expanded"
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
              className="hidden w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-[460px] pr-2"
              role="complementary"
              aria-label="Panel de reserva detallado"
            >
              <div className="rounded-[32px] border border-white/60 p-6 md:p-8 bg-white/98 backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.04),0_0_50px_rgba(212,175,55,0.015)] space-y-6.5">
                {/* 1. HEADER DE PRECIO */}
                <div className="flex flex-col space-y-3.5 border-b border-slate-100 pb-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-brand-navy text-4xl font-extrabold font-sans tracking-tight leading-none block">
                        ${(totalNights > 0 ? totalPrice : listing.pricePerNight).toLocaleString()}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {totalNights > 0 ? (
                          <>
                            Total estadía <span className="text-slate-300 mx-1">•</span> {totalNights} {totalNights === 1 ? 'noche' : 'noches'}
                          </>
                        ) : (
                          'Precio por noche'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-brand-navy/2 border border-brand-navy/6 rounded-xl px-2.5 py-1.5 shrink-0 select-none">
                        <Star className="text-brand-500 fill-brand-500 h-3.5 w-3.5" />
                        <span className="text-brand-navy text-[11px] font-extrabold">
                          {listing.rating}
                        </span>
                      </div>

                      <button
                        onClick={togglePanel}
                        aria-label="Contraer panel de reserva"
                        aria-expanded={isPanelExpanded}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-brand-navy active:scale-95 cursor-pointer animate-none"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex select-none">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/[0.07] border border-brand-gold/[0.18] px-3.5 py-1 text-[11px] font-bold text-[#b08f23] tracking-wide shadow-[0_2px_10px_rgba(212,175,55,0.03)] transition-all hover:bg-brand-gold/[0.1]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
                      Reserva hoy con solo ${(totalNights > 0 ? calculatePaymentBreakdown(totalPrice).depositAmount : listing.pricePerNight * 0.20).toFixed(0)} USD
                    </span>
                  </div>
                </div>

                {/* 2. BLOQUE DE RESERVA */}
                <div
                  className={cn(
                    'group relative overflow-hidden rounded-[24px] border bg-white transition-all duration-300 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)]',
                    isCalendarOpen
                      ? 'border-brand-navy/60 ring-brand-navy/5 shadow-md ring-2'
                      : 'hover:border-slate-300 border-slate-200/80'
                  )}
                >
                  <div className="grid grid-cols-2 border-b border-slate-100">
                    <div
                      className="group/item cursor-pointer border-r border-slate-100 p-4 transition-all hover:bg-slate-50/50"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    >
                      <div className="mb-1 flex items-center space-x-1.5 select-none">
                        <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                        <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                          Check-in
                        </p>
                      </div>
                      <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                        {startDate
                          ? format(startDate, 'dd MMM yyyy', { locale: es })
                          : 'Elegir fecha'}
                      </p>
                    </div>
                    <div
                      className="group/item cursor-pointer p-4 transition-all hover:bg-slate-50/50"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    >
                      <div className="mb-1 flex items-center space-x-1.5 select-none">
                        <Clock className="text-brand-navy/40 h-3.5 w-3.5 shrink-0" />
                        <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                          Check-out
                        </p>
                      </div>
                      <p className="text-brand-navy text-[13px] font-black leading-tight mt-1">
                        {endDate
                          ? format(endDate, 'dd MMM yyyy', { locale: es })
                          : 'Elegir fecha'}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-slate-100 bg-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2">
                          <CalendarComponent
                            startDate={startDate}
                            endDate={endDate}
                            reservedDates={reservedDates}
                            softReservedDates={softReservedDates}
                            minNights={listing.minNights ?? 2}
                            onChange={onDatesChange}
                            onClose={() => setIsCalendarOpen(false)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between p-4 bg-white select-none">
                    <div className="flex items-center space-x-2">
                      <Users className="text-brand-navy/40 h-3.5 w-3.5" />
                      <p className="text-brand-navy/40 text-[8.5px] font-black tracking-[0.12em] uppercase">
                        Huéspedes
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-100 active:scale-95 text-xs font-bold"
                        aria-label="Disminuir número de huéspedes"
                      >
                        -
                      </button>
                      <span className="text-brand-navy min-w-10 text-center text-xs font-black">
                        {guests} {guests === 1 ? 'Viajero' : 'Viajeros'}
                      </span>
                      <button
                        onClick={() => setGuests(Math.min(listing.maxGuests, guests + 1))}
                        disabled={guests >= listing.maxGuests}
                        className="text-brand-navy flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                        aria-label="Aumentar número de huéspedes"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. BLOQUE DE PAGO */}
                <div>
                  <ExchangeCalculator
                    totalPrice={totalNights > 0 ? totalPrice : listing.pricePerNight}
                    depositAmount={
                      totalNights > 0
                        ? calculatePaymentBreakdown(totalPrice, 12, listing.cleaningFee || 0).depositAmount
                        : calculatePaymentBreakdown(listing.pricePerNight, 12, listing.cleaningFee || 0).depositAmount
                    }
                    remainingAmount={
                      totalNights > 0
                        ? calculatePaymentBreakdown(totalPrice, 12, listing.cleaningFee || 0).remainingBalance
                        : calculatePaymentBreakdown(listing.pricePerNight, 12, listing.cleaningFee || 0).remainingBalance
                    }
                    paymentMethods={listing.paymentMethods}
                  />
                </div>

                {/* 4. DESGLOSE TRANSPARENTE */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                    className="flex w-full items-center justify-between text-[10px] font-black tracking-widest text-[#0a142c]/60 uppercase hover:text-brand-navy transition-colors py-1 px-1 select-none"
                    aria-expanded={isBreakdownOpen}
                  >
                    <span>{isBreakdownOpen ? 'Ocultar desglose' : 'Ver desglose'}</span>
                    <span className="text-sm font-semibold transition-transform duration-200 text-slate-400" style={{ transform: isBreakdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                      ▼
                    </span>
                  </button>
                  <AnimatePresence>
                    {isBreakdownOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3.5 pt-4 pb-2 px-1 text-[12px] font-medium text-slate-500">
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-500 font-medium">Estadía • {totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : '1 noche'}</span>
                            <span className="font-extrabold text-brand-navy font-sans text-sm">
                              ${(listing.pricePerNight * (totalNights > 0 ? totalNights : 1)).toLocaleString()} USD
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Limpieza de alojamiento</span>
                            {listing.cleaningFee && listing.cleaningFee > 0 ? (
                              <span className="font-extrabold text-brand-navy font-sans text-sm">
                                ${listing.cleaningFee} USD
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none select-none">
                                Incluida
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Servicios de plataforma</span>
                            <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none select-none">
                              $0 Cargo
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Impuestos municipales</span>
                            <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50/70 border border-emerald-100/50 px-2 py-0.5 rounded-md leading-none select-none">
                              Incluidos
                            </span>
                          </div>
                          <div className="border-t border-slate-100 pt-3.5 flex justify-between items-baseline font-black text-brand-navy mt-1">
                            <span className="text-[10px] tracking-widest uppercase text-slate-400 font-extrabold">Total Final</span>
                            <span className="text-base font-extrabold font-sans">
                              ${(listing.pricePerNight * (totalNights > 0 ? totalNights : 1) + (listing.cleaningFee || 0)).toLocaleString()} USD
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {bookingError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                    <p className="text-[10px] font-black tracking-widest text-red-500 uppercase leading-snug">
                      {bookingError}
                    </p>
                  </div>
                )}

                {/* 6. CTA PRINCIPAL */}
                <div className="space-y-3.5">
                  <button
                    id="reserve-button-desktop"
                    className="bg-linear-to-r from-brand-navy via-[#0d1b3a] to-brand-navy hover:from-[#0d1b3a] hover:to-brand-navy active:scale-[0.99] group/btn relative w-full transform overflow-hidden rounded-[24px] py-[18px] text-[11px] font-black tracking-[0.25em] text-white uppercase shadow-[0_10px_30px_rgba(10,15,40,0.18)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_14px_35px_rgba(10,15,40,0.22)] cursor-pointer"
                    onClick={handleBooking}
                  >
                    <span className="relative z-10">Asegurar mi Estadía</span>
                    <div className="bg-brand-500 absolute inset-0 -translate-x-full opacity-10 transition-transform duration-500 group-hover/btn:translate-x-0" />
                  </button>
                  <p className="text-center text-[10.5px] text-slate-500 font-semibold tracking-normal select-none">
                    No se realizará ningún cargo adicional.
                  </p>
                </div>

                {/* 5. BLOQUE DE CONFIANZA */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 pt-5 border-t border-slate-100 select-none">
                  <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Pago seguro</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Confirmación inmediata</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Reserva protegida</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10.5px] font-bold text-slate-500 select-none">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100/50 shrink-0">
                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Sin cargos ocultos</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* VARIANTE COLLAPSED — barra fija bottom-right (desktop only) */
            <motion.div
              key="booking-panel-collapsed"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="hidden lg:block fixed bottom-6 right-6 z-55"
            >
              <div className="flex items-center gap-4 rounded-[20px] border border-white/60 bg-white/98 px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-md">
                <div className="flex flex-col select-none">
                  <span className="text-brand-navy text-lg font-extrabold font-sans leading-none">
                    ${(totalNights > 0 ? totalPrice : listing.pricePerNight).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {totalNights > 0 ? `${totalNights} ${totalNights === 1 ? 'noche' : 'noches'}` : 'por noche'}
                  </span>
                </div>

                <div className="h-8 w-px bg-slate-100" />

                <div className="flex items-center gap-1 select-none">
                  <Star className="text-brand-500 fill-brand-500 h-3.5 w-3.5" />
                  <span className="text-brand-navy text-[12px] font-extrabold">
                    {listing.rating}
                  </span>
                </div>

                <div className="h-8 w-px bg-slate-100" />

                <button
                  onClick={handleBooking}
                  className="bg-linear-to-r from-brand-navy to-[#0d1b3a] rounded-[14px] px-5 py-2.5 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  Reservar
                </button>

                <button
                  onClick={togglePanel}
                  aria-label="Expandir panel de reserva"
                  aria-expanded={isPanelExpanded}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-brand-navy/30 hover:bg-slate-50 hover:text-brand-navy active:scale-95 cursor-pointer"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Sticky Mobile CTA Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-70 flex items-center justify-between border-t border-gray-100 bg-white/95 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-brand-navy shadow-sm transition-transform active:scale-90"
            aria-label="Volver al inicio"
          >
            <Globe className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-brand-navy text-lg font-black">
                ${listing.pricePerNight}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                / noche
              </span>
            </div>
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-brand-500 text-[10px] font-black tracking-widest uppercase hover:underline"
            >
              {startDate && endDate
                ? `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM', { locale: es })}`
                : 'Elegir fechas'}
            </button>
          </div>
        </div>
        <button
          id="reserve-button-mobile"
          onClick={handleBooking}
          className={cn(
            "flex h-[60px] min-w-[160px] items-center justify-center rounded-2xl px-10 py-5 text-xs font-black tracking-widest uppercase shadow-xl transition-all active:scale-95",
            isRequestMode
              ? "animate-shimmer-sweep bg-linear-to-r from-brand-600 via-brand-400 to-brand-600 bg-size-[200%_auto] hover:bg-right text-brand-navy shadow-brand-gold/20"
              : "bg-brand-500 text-brand-navy shadow-brand-500/20"
          )}
        >
          {startDate && endDate
            ? (isRequestMode ? 'Solicitar Reserva' : 'Asegurar Estadía')
            : 'Disponibilidad'}
        </button>
      </div>

      {/* Mobile Request Sheet Modal */}
      <AnimatePresence>
        {isMobileRequestOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-brand-navy/60 fixed inset-0 z-100 flex items-end justify-center p-4 backdrop-blur-md lg:hidden"
            onClick={() => setIsMobileRequestOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm overflow-y-auto max-h-[85vh] rounded-[32px] bg-white text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMobileRequestOpen(false)}
                  className="absolute right-4 top-4 z-110 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 active:scale-90 font-bold"
                  aria-label="Cerrar solicitud"
                >
                  ✕
                </button>
                <DirectRequestForm
                  listing={listing}
                  user={user}
                  onSuccess={() => {
                    setIsMobileRequestOpen(false);
                    navigate('/mis-viajes');
                  }}
                  reservedDates={reservedDates}
                  softReservedDates={softReservedDates}
                  onOpenAuth={onOpenAuth}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingPanel;
