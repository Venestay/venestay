import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertTriangle, Trash2, X } from 'lucide-react';
import { previewTestBookings, purgeTestBookings, PurgePreviewResult } from '@/services/admin-service';
import { toast } from 'sonner';

interface PurgeTestBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

export const PurgeTestBookingsModal: React.FC<PurgeTestBookingsModalProps> = ({
  isOpen,
  onClose,
  listingId,
}) => {
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [preview, setPreview] = useState<PurgePreviewResult | null>(null);

  useEffect(() => {
    if (isOpen && listingId) {
      setLoading(true);
      previewTestBookings(listingId)
        .then((data) => setPreview(data))
        .catch((err) => {
          console.error(err);
          toast.error('Error al previsualizar reservas de prueba.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, listingId]);

  const handlePurge = async () => {
    if (!preview || preview.count === 0) return;
    const ids = preview.testBookings.map((b) => b.bookingId);
    setPurging(true);
    try {
      const result = await purgeTestBookings(listingId, ids);
      toast.success(`Se purgaron ${result.cancelledCount} reservas de prueba.`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al purgar reservas.');
    } finally {
      setPurging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-navy/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-brand-navy flex items-center gap-2">
              <AlertTriangle className="text-orange-500 w-6 h-6" />
              Purgar Reservas de Prueba
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-brand-navy transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-medium">Analizando reservas...</p>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {preview.count === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
                  <p className="text-gray-600 font-medium">No se encontraron reservas de prueba activas para esta propiedad.</p>
                </div>
              ) : (
                <>
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-orange-800 text-sm">
                    Se encontraron <strong>{preview.count}</strong> reservas marcadas como prueba. Serán canceladas administrativamente para liberar el calendario.
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {preview.testBookings.map((b) => (
                      <div key={b.bookingId} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                        <div>
                          <p className="font-bold text-brand-navy">{b.guestName}</p>
                          <p className="text-gray-500">{b.checkIn} a {b.checkOut}</p>
                        </div>
                        <span className="bg-brand-navy/5 px-2 py-1 rounded text-[10px] font-black uppercase text-brand-navy/60">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                      onClick={onClose}
                      disabled={purging}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePurge}
                      disabled={purging}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50"
                    >
                      {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Ejecutar Purga
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-red-500 text-sm font-medium">
              Ocurrió un error al cargar la previsualización.
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
