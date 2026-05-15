import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}: ConfirmDialogProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const currentCount = parseInt(document.body.dataset.modalCount || '0', 10);
    document.body.dataset.modalCount = String(currentCount + 1);
    document.body.style.overflow = 'hidden';

    return () => {
      const newCount = parseInt(document.body.dataset.modalCount || '1', 10) - 1;
      document.body.dataset.modalCount = String(newCount);
      if (newCount <= 0) {
        document.body.style.overflow = '';
        document.body.removeAttribute('data-modal-count');
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 pointer-events-auto overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Top Accent Line */}
              <div
                className={`absolute top-0 left-0 w-full h-1 ${
                  isDestructive ? 'bg-red-500' : 'bg-primary'
                }`}
              />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-xl flex-shrink-0 ${
                    isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 id="modal-title" className="text-xl font-semibold text-white">
                  {title}
                </h2>
              </div>

              {/* Body */}
              <div className="mb-8">
                <p className="text-white/70 leading-relaxed">{message}</p>
              </div>

              {/* Footer / Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 shadow-lg ${
                    isDestructive
                      ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50 shadow-red-500/20'
                      : 'bg-primary hover:bg-primary-dark text-white focus:ring-primary/50 shadow-primary/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
