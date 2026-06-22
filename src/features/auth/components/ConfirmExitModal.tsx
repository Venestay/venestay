import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          {/* Backdrop con Glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-md"
          />
          
          {/* Contenedor del Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[#C5A059]/30 bg-[#0B1120] p-8 text-white shadow-[0_0_50px_rgba(197,160,89,0.15)]"
          >
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar confirmación"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6 text-center">
              {/* Icono de advertencia premium */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30">
                <AlertTriangle className="h-6 w-6 text-[#C5A059] animate-pulse" />
              </div>

              {/* Mensaje de confirmación */}
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight text-[#C5A059] uppercase">
                  Cambios sin guardar
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Tienes modificaciones activas en tu pasaporte. ¿Estás seguro de que deseas salir? Los datos no guardados se mantendrán temporalmente como borrador local.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Cancelar (Quedarse y editar) */}
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-white/5 py-4 text-xs font-black tracking-widest text-white uppercase border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  Permanecer
                </button>
                
                {/* Confirmar salida */}
                <button
                  onClick={onConfirm}
                  className="flex-1 rounded-2xl bg-[#C5A059] py-4 text-xs font-black tracking-widest text-[#0B1120] uppercase shadow-lg shadow-[#C5A059]/20 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Salir sin guardar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmExitModal;
