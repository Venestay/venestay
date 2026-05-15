import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';

export interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  required?: boolean;
}

export function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = 'Escribe aquí...',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  defaultValue = '',
  required = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(false);
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      const currentCount = parseInt(document.body.dataset.modalCount || '0', 10);
      document.body.dataset.modalCount = String(currentCount + 1);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (isOpen) {
        const newCount = parseInt(document.body.dataset.modalCount || '1', 10) - 1;
        document.body.dataset.modalCount = String(newCount);
        if (newCount <= 0) {
          document.body.style.overflow = '';
          document.body.removeAttribute('data-modal-count');
        }
      }
    };
  }, [isOpen, defaultValue]);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (required && !value.trim()) {
      setError(true);
      return;
    }
    
    onConfirm(value);
    onClose();
  };

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
              aria-labelledby="prompt-title"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                aria-label="Cerrar modal"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl flex-shrink-0 bg-primary/10 text-primary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h2 id="prompt-title" className="text-xl font-semibold text-white">
                  {title}
                </h2>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <p className="text-white/70 leading-relaxed mb-4">{message}</p>
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      if (error) setError(false);
                    }}
                    placeholder={placeholder}
                    className={`w-full bg-black/50 border ${
                      error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary'
                    } rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 ${
                      error ? 'focus:ring-red-500' : 'focus:ring-primary'
                    } transition-all`}
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-2">Este campo es requerido.</p>
                  )}
                </div>

                {/* Footer / Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 shadow-lg bg-primary hover:bg-primary-dark text-white focus:ring-primary/50 shadow-primary/20"
                  >
                    {confirmText}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
