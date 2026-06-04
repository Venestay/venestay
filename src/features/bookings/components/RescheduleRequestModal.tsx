import React from 'react';
import { useRescheduleRequest } from '../hooks/useRescheduleRequest';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface RescheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

export const RescheduleRequestModal: React.FC<RescheduleRequestModalProps> = ({
  isOpen,
  onClose,
  bookingId,
}) => {
  const {
    proposedStartDate,
    setProposedStartDate,
    proposedEndDate,
    setProposedEndDate,
    rescheduleNote,
    setRescheduleNote,
    isSubmitting,
    error,
    submitReschedule,
    reset,
  } = useRescheduleRequest(bookingId, () => {
    onClose();
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#0B1120]/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 id="reschedule-modal-title" className="text-sm font-black uppercase tracking-wider text-[#0B1120]">
                  Reprogramar Fechas
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
              {/* Alert: Host approval needed */}
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-wider">Aprobación requerida</p>
                  <p className="text-xs font-semibold leading-relaxed text-amber-700">
                    Tu solicitud está sujeta a aprobación previa del anfitrión. Las fechas originales permanecerán bloqueadas para evitar reservas dobles hasta que se confirme el cambio.
                  </p>
                </div>
              </div>

              {/* Alert: Non-refundable deposit */}
              <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-wider">Anticipo no reembolsable</p>
                  <p className="text-xs font-semibold leading-relaxed text-red-700">
                    El anticipo del 20% es estrictamente no reembolsable. Podrían aplicar cargos de ajuste si las nuevas fechas cruzan a una temporada de mayor demanda.
                  </p>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="proposed-start" className="text-[10px] font-black tracking-widest text-[#0B1120]/40 uppercase ml-1">
                    Nueva Fecha Inicio
                  </label>
                  <input
                    id="proposed-start"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={proposedStartDate}
                    onChange={(e) => setProposedStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-xs font-bold text-[#0B1120] outline-none focus:border-[#C5A059]/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="proposed-end" className="text-[10px] font-black tracking-widest text-[#0B1120]/40 uppercase ml-1">
                    Nueva Fecha Fin
                  </label>
                  <input
                    id="proposed-end"
                    type="date"
                    min={proposedStartDate || new Date().toISOString().split('T')[0]}
                    value={proposedEndDate}
                    onChange={(e) => setProposedEndDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-xs font-bold text-[#0B1120] outline-none focus:border-[#C5A059]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Textarea for note */}
              <div className="space-y-2">
                <label htmlFor="reschedule-note" className="text-[10px] font-black tracking-widest text-[#0B1120]/40 uppercase ml-1">
                  Nota para el Anfitrión
                </label>
                <textarea
                  id="reschedule-note"
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value.slice(0, 200))}
                  placeholder="Explica los motivos del cambio o propón alternativas al anfitrión..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-xs font-bold text-[#0B1120] outline-none focus:border-[#C5A059]/50 transition-colors"
                />
                <p className="text-[9px] font-semibold text-slate-400 text-right mr-1">
                  {rescheduleNote.length}/200 caracteres
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-600 text-xs font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 px-6 py-5 bg-slate-50/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-1/3 rounded-2xl border border-slate-200 bg-white py-4 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-55"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitReschedule}
                disabled={isSubmitting}
                className="w-full sm:w-2/3 rounded-2xl bg-[#C5A059] py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-[#B8924B] shadow-lg shadow-[#C5A059]/20 transition-all disabled:opacity-55 active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  'Solicitar Cambio de Fechas'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
