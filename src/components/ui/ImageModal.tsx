import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, altText = 'Imagen' }: ImageModalProps) {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="relative w-full h-full max-w-5xl max-h-[90vh] flex flex-col pointer-events-none"
          >
            {/* Top Toolbar */}
            <div className="absolute top-0 right-0 p-4 flex gap-3 pointer-events-auto z-10">
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                title="Abrir original"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                aria-label="Cerrar vista de imagen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Container */}
            <div 
              className="w-full h-full flex items-center justify-center p-4 md:p-8 pointer-events-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt={altText}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                style={{ WebkitUserDrag: 'none' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
