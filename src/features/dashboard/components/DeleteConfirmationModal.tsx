import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
          >
            {/* Warning Icon Header */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-100 opacity-20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tight text-brand-navy">
                ¿Eliminar propiedad?
              </h3>
              <p className="mt-3 text-sm font-medium text-gray-500 leading-relaxed">
                Estás a punto de eliminar <span className="font-bold text-brand-navy">"{itemTitle}"</span>. 
                Esta acción no se puede deshacer y borrará toda la información asociada.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-red-500 py-4 font-black uppercase tracking-widest text-white transition-all hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/30"
              >
                <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Confirmar Eliminación</span>
              </button>
              
              <button
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-100 py-4 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 hover:text-brand-navy hover:border-gray-200"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </button>
            </div>

            {/* Decorative element */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gray-50 opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
