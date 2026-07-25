import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Unlock,
  CheckCircle,
  CalendarX,
  CalendarCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Listing } from '@/features/listings/types';
import { useHostCalendar } from '../hooks/useHostCalendar';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HostCalendarManagerProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── Component ───────────────────────────────────────────────────────────────

const HostCalendarManager: React.FC<HostCalendarManagerProps> = ({
  listing,
  isOpen,
  onClose,
}) => {
  const titleId = useId();
  const {
    days,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,
    rangeStart,
    rangeEnd,
    hasBlockedInRange,
    hasAvailableInRange,
    handleDayClick,
    blockSelectedRange,
    unblockSelectedRange,
    clearAll,
    resetRange,
    isLoading,
    isSaving,
    errorMessage,
  } = useHostCalendar(listing);

  const monthLabel = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  const truncatedTitle = listing.title.length > 32
    ? listing.title.slice(0, 30) + '…'
    : listing.title;

  const blockedCount = listing.blockedDates?.length ?? 0;

  const getDayAriaLabel = (date: string, isReserved: boolean, isBlocked: boolean, isPast: boolean) => {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const formatted = d.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
    if (isPast) return `Fecha pasada (${formatted})`;
    if (isReserved) return `Reservado el ${formatted}`;
    if (isBlocked) return `Bloqueado manualmente el ${formatted}`;
    return `Seleccionar ${formatted}`;
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed z-50 flex flex-col bg-white shadow-2xl',
              // Mobile: bottom sheet full width
              'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl',
              // Desktop: centered modal
              'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
              'sm:rounded-3xl sm:max-h-[90vh] sm:w-full sm:max-w-xl'
            )}
          >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
              {/* Mobile drag handle */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-gray-200 sm:hidden" aria-hidden="true" />

              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#c5a059]">
                  Gestión de Disponibilidad
                </p>
                <h2
                  id={titleId}
                  className="mt-0.5 truncate text-lg font-black tracking-tight text-[#0b1120]"
                >
                  {truncatedTitle}
                </h2>
              </div>

              <button
                onClick={onClose}
                aria-label="Cerrar calendario"
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5">

              {/* Error banner */}
              {errorMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Month navigator */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={goToPrevMonth}
                  aria-label="Mes anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#c5a059] hover:text-[#c5a059]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-black tracking-wide text-[#0b1120]">
                  {monthLabel}
                </span>
                <button
                  onClick={goToNextMonth}
                  aria-label="Mes siguiente"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#c5a059] hover:text-[#c5a059]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Week day headers */}
              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#c5a059]" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day) => {
                    const isDisabled = !day.isCurrentMonth || day.isReserved || day.isPast;
                    const ariaLabel = day.isCurrentMonth
                      ? getDayAriaLabel(day.date, day.isReserved, day.isBlocked, day.isPast)
                      : undefined;

                    return (
                      <button
                        key={day.date}
                        disabled={isDisabled}
                        onClick={() => handleDayClick(day.date)}
                        aria-label={ariaLabel}
                        aria-pressed={day.isSelected}
                        className={cn(
                          'relative flex flex-col items-center justify-center rounded-xl transition-all',
                          'aspect-square text-xs font-bold',
                          // Not current month
                          !day.isCurrentMonth && 'cursor-default opacity-20',
                          // Past date
                          day.isCurrentMonth && day.isPast && [
                            'cursor-not-allowed opacity-30 text-gray-400 bg-gray-50',
                          ],
                          // Reserved (read-only)
                          day.isCurrentMonth && !day.isPast && day.isReserved && [
                            'cursor-not-allowed bg-[#0b1120] text-white',
                          ],
                          // Blocked manually
                          day.isCurrentMonth && !day.isPast && day.isBlocked && !day.isReserved && [
                            'bg-[#c5a059] text-[#0b1120] cursor-pointer hover:bg-[#b58f48]',
                          ],
                          // Selected endpoints
                          day.isCurrentMonth && !day.isPast && day.isSelected && !day.isReserved && [
                            'bg-[#0b1120] text-white ring-2 ring-[#c5a059] ring-offset-1 scale-110 z-10',
                          ],
                          // In range (between start and end)
                          day.isCurrentMonth && !day.isPast && day.isInRange && !day.isSelected && !day.isReserved && !day.isBlocked && [
                            'bg-[#c5a059]/20 text-[#0b1120]',
                          ],
                          // Available
                          day.isCurrentMonth && !day.isPast && !day.isBlocked && !day.isReserved && !day.isSelected && !day.isInRange && [
                            'hover:bg-gray-100 text-gray-700 cursor-pointer',
                          ],
                        )}
                      >
                        <span>{day.dayOfMonth}</span>
                        {day.isCurrentMonth && !day.isPast && day.isReserved && (
                          <CheckCircle className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5" aria-hidden="true" />
                        )}
                        {day.isCurrentMonth && !day.isPast && day.isBlocked && !day.isReserved && (
                          <Lock className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selection status */}
              <AnimatePresence>
                {rangeStart && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 overflow-hidden rounded-2xl border border-[#c5a059]/30 bg-[#c5a059]/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">
                          Rango seleccionado
                        </p>
                        <p className="font-bold text-[#0b1120]">
                          {rangeStart}
                          {rangeEnd && rangeEnd !== rangeStart ? ` → ${rangeEnd}` : ' → (selecciona fin)'}
                        </p>
                      </div>
                      <button
                        onClick={resetRange}
                        aria-label="Limpiar selección de rango"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Legend */}
              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-md bg-[#c5a059] flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5 text-[#0b1120]" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Bloqueado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-md bg-[#0b1120] flex items-center justify-center">
                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Reservado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-md border border-gray-200 bg-white" />
                  <span className="text-[10px] font-bold text-gray-500">Disponible</span>
                </div>
              </div>
            </div>

            {/* ── Footer actions ── */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4 pb-safe">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Clear all */}
                <button
                  onClick={clearAll}
                  disabled={isSaving || blockedCount === 0}
                  aria-label={`Limpiar los ${blockedCount} bloqueos manuales de esta propiedad`}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black tracking-widest uppercase transition-all',
                    blockedCount === 0
                      ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                      : 'border-red-200 text-red-500 hover:bg-red-50'
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarX className="h-4 w-4" />
                  )}
                  <span>Limpiar todo</span>
                  {blockedCount > 0 && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-500">
                      {blockedCount}
                    </span>
                  )}
                </button>

                {/* Range actions */}
                <div className="flex flex-1 gap-2">
                  {/* Unblock range */}
                  <button
                    onClick={unblockSelectedRange}
                    disabled={isSaving || !rangeStart || !hasBlockedInRange}
                    aria-label="Desbloquear el rango de fechas seleccionado"
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[11px] font-black tracking-widest uppercase transition-all shadow-sm border',
                      rangeStart && hasBlockedInRange && !isSaving
                        ? 'border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    <span>Desbloquear Rango</span>
                  </button>

                  {/* Block range */}
                  <button
                    onClick={blockSelectedRange}
                    disabled={isSaving || !rangeStart || !hasAvailableInRange}
                    aria-label="Bloquear el rango de fechas seleccionado"
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[11px] font-black tracking-widest uppercase transition-all shadow-sm',
                      rangeStart && hasAvailableInRange && !isSaving
                        ? 'bg-[#0b1120] text-white hover:bg-[#c5a059] hover:text-[#0b1120]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarCheck className="h-4 w-4" />
                    )}
                    <span>Bloquear Rango</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};

export default HostCalendarManager;

