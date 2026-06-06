import React, { useEffect, useState, useRef } from 'react';
import { Booking } from '../types';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { 
  X, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  ExternalLink, 
  Clock, 
  Receipt, 
  ShieldCheck,
  AlertTriangle,
  Download,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Skeleton from '@/components/ui/Skeleton';
import { HOUSE_RULES_ICONS } from '@/features/listings/utils/amenities-icons';
import { useBookingSummary } from '../hooks/useBookingSummary';

interface BookingSummaryModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onContactHost?: () => void;
}

export const BookingSummaryModal: React.FC<BookingSummaryModalProps> = ({
  booking,
  isOpen,
  onClose,
  onContactHost
}) => {
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [showPrintInstructions, setShowPrintInstructions] = useState(false);

  const {
    listing,
    loading,
    error,
    proofSignedUrl,
    proofLoading,
  } = useBookingSummary(booking, isOpen);

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const totalNights = booking.startDate && booking.endDate
    ? differenceInDays(new Date(booking.endDate), new Date(booking.startDate))
    : 0;

  const getHouseRules = () => {
    if (!listing) return [];
    
    const rules = [];

    // Check allow smoking
    if (listing.allowSmoking) {
      rules.push(HOUSE_RULES_ICONS.smokingAllowed);
    } else {
      rules.push(HOUSE_RULES_ICONS.smokingForbidden);
    }

    // Check pet friendly
    if (listing.isPetFriendly) {
      rules.push(HOUSE_RULES_ICONS.petsAllowed);
    } else {
      rules.push(HOUSE_RULES_ICONS.petsForbidden);
    }

    // Check allow events
    if (listing.allowEvents) {
      rules.push(HOUSE_RULES_ICONS.eventsAllowed);
    } else {
      rules.push(HOUSE_RULES_ICONS.eventsForbidden);
    }

    return rules;
  };

  const isConfirmed = booking.status === 'CONFIRMED';

  const handlePrint = () => {
    setShowPrintInstructions(true);
  };

  return (
    <div 
      className="fixed inset-0 z-[150] bg-brand-navy/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
      id="booking-summary-print-root"
    >
      {/* Styles injected for printing layout */}
      <style>{`
        @media print {
          html, body, #root, .my-trips-page-container {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          nav, header, footer, aside, .chat-embedded-container, .my-trips-sidebar, [data-print-hide] {
            display: none !important;
          }
          #booking-summary-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            z-index: 999999 !important;
            background: #ffffff !important;
            display: block !important;
          }
          .print-container-layout {
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border-radius: 0 !important;
            position: static !important;
          }
          .print-text-dark {
            color: #0B1120 !important;
          }
          .print-text-muted {
            color: #4b5563 !important;
          }
          .print-bg-light {
            background-color: #f3f4f6 !important;
            border: 1px solid #e5e7eb !important;
          }
          .print-border {
            border: 1px solid #e5e7eb !important;
          }
          .print-header-only {
            display: block !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
        .print-header-only {
          display: none;
        }
      `}</style>

      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: 50, scale: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="print-container-layout relative w-full sm:max-w-2xl bg-brand-navy border border-white/10 rounded-t-[30px] sm:rounded-[30px] overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh]"
      >
        {/* Print Only Header */}
        <div className="print-header-only p-6 border-b border-gray-200 bg-[#0B1120] text-white">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xl font-black tracking-widest text-[#C5A059]">VENESTAY</span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Alquileres Premium · Lechería</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase text-white bg-[#C5A059]/20 border border-[#C5A059] px-2 py-0.5 rounded-full">
                {isConfirmed ? 'Reserva Confirmada' : 'Pago en Verificación'}
              </span>
            </div>
          </div>
        </div>

        {/* Header absolute close button */}
        <button
          onClick={onClose}
          data-print-hide
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 z-20 bg-brand-navy/60 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20 p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 select-none custom-scrollbar">
          {/* Cover Image */}
          <div className="relative h-44 md:h-52 bg-white/5 overflow-hidden">
            {loading ? (
              <Skeleton className="h-full w-full bg-white/10" />
            ) : error || !listing ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <AlertTriangle className="h-8 w-8 text-[#C5A059] mb-2" />
                <p className="text-xs font-bold">{error || 'Detalles no disponibles'}</p>
              </div>
            ) : (
              <>
                <img 
                  src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800'} 
                  alt={listing.title} 
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/20 to-transparent" />
                
                <div className="absolute bottom-4 left-6 right-6">
                  <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full mb-1 inline-block ${
                    isConfirmed ? 'bg-[#C5A059] text-brand-navy' : 'bg-amber-500 text-brand-navy'
                  }`}>
                    {isConfirmed ? 'Reserva Confirmada' : 'Pago en Verificación'}
                  </span>
                  <h2 id="summary-modal-title" className="text-white text-lg md:text-xl font-black leading-tight truncate">
                    {listing.title}
                  </h2>
                  <p className="text-gray-300 text-xs font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0 text-[#C5A059]" />
                    <span className="truncate">{listing.manualAddress || listing.location}</span>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full bg-white/10 rounded-2xl" />
                <Skeleton className="h-28 w-full bg-white/10 rounded-2xl" />
                <Skeleton className="h-24 w-full bg-white/10 rounded-2xl" />
              </div>
            ) : error || !listing ? (
              <div className="py-8 text-center text-gray-400 text-xs font-bold print-text-dark">
                No se pudieron cargar todos los detalles de esta estadía. Por favor, comunícate con soporte si este problema persiste.
              </div>
            ) : (
              <>
                {/* Status Announcement Note */}
                <div className={`print-border border rounded-2xl p-4 flex gap-3 items-center ${
                  isConfirmed 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {isConfirmed ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider print-text-dark">¡Tu estadía está confirmada!</h4>
                        <p className="text-[10px] font-bold text-gray-300 print-text-muted mt-0.5">El anfitrión ha verificado la garantía del 20% y asegurado tus fechas.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider print-text-dark">Pago en Proceso de Verificación</h4>
                        <p className="text-[10px] font-bold text-gray-300 print-text-muted mt-0.5">Tu comprobante está en revisión. El anfitrión confirmará la reserva a la brevedad.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Stay Summary Panel */}
                <div className="grid grid-cols-2 gap-4 print-bg-light bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 print-border print-bg-light h-fit text-[#C5A059]">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 print-text-muted font-bold uppercase tracking-wider leading-none mb-1">
                        Estadía
                      </p>
                      <p className="text-xs font-black text-white print-text-dark leading-tight">
                        {totalNights} {totalNights === 1 ? 'Noche' : 'Noches'}
                      </p>
                      <p className="text-[10px] text-gray-300 print-text-muted font-bold mt-0.5">
                        {booking.startDate && format(new Date(booking.startDate), 'dd MMM', { locale: es })}
                        {' → '}
                        {booking.endDate && format(new Date(booking.endDate), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 print-border print-bg-light h-fit text-[#C5A059]">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 print-text-muted font-bold uppercase tracking-wider leading-none mb-1">
                        Horarios
                      </p>
                      <p className="text-xs font-black text-white print-text-dark leading-tight">
                        In: {listing.checkInTime || '14:00'}
                      </p>
                      <p className="text-xs font-black text-white print-text-dark leading-tight mt-0.5">
                        Out: {listing.checkOutTime || '11:00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* House Rules */}
                <div className="space-y-3 house-rules-section">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#C5A059] print-text-dark">
                    Normas de la Casa
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getHouseRules().map((rule, idx) => {
                      const Icon = rule.icon;
                      return (
                        <div key={idx} className="flex items-center gap-3 print-bg-light bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                          <Icon className="h-4 w-4 text-[#C5A059] shrink-0" />
                          <span className="text-xs font-bold text-gray-200 print-text-dark">{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {listing.additionalRules && listing.additionalRules.length > 0 && (
                    <div className="mt-3 print-bg-light bg-white/5 border border-white/5 rounded-xl p-4">
                      <p className="text-[10px] text-[#C5A059] print-text-dark font-black uppercase tracking-wider mb-2">
                        Normas Adicionales del Anfitrión
                      </p>
                      <ul className="space-y-1.5 list-disc pl-4 text-xs font-bold text-gray-300 print-text-muted">
                        {listing.additionalRules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Payment Proof */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#C5A059] print-text-dark">
                    Comprobante de Pago
                  </h3>
                  <div className="print-bg-light bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="relative h-16 w-16 bg-white/5 print-border border border-white/10 rounded-xl overflow-hidden cursor-pointer group shrink-0"
                        onClick={() => {
                          if (proofSignedUrl) {
                            setShowFullReceipt(true);
                          }
                        }}
                        title="Ampliar comprobante"
                      >
                        {proofLoading ? (
                          <div className="h-full w-full flex items-center justify-center">
                            <Clock className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        ) : proofSignedUrl ? (
                          <>
                            <img 
                              src={proofSignedUrl} 
                              alt="Comprobante de pago" 
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                            />
                            <div data-print-hide className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <ExternalLink className="h-4 w-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500">
                            <Receipt className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 print-text-muted font-bold uppercase tracking-wider">
                          Referencia de Transacción
                        </p>
                        <p className="text-sm font-black text-white print-text-dark font-mono truncate">
                          {booking.paymentReference || 'No especificada'}
                        </p>
                        {isConfirmed ? (
                          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            Garantía del 20% recibida y verificada
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            Pago en verificación
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#C5A059] print-text-dark">
                    Resumen de Saldo
                  </h3>
                  <div className="print-bg-light bg-white/5 border border-white/5 rounded-2xl p-4 divide-y divide-white/5">
                    <div className="flex justify-between py-2 text-xs font-bold text-gray-300 print-text-dark border-b border-white/5 print-border">
                      <span>Total de la Estadía</span>
                      <span className="text-white print-text-dark font-black">${booking.totalAmount}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 text-xs font-bold text-[#C5A059] border-b border-white/5 print-border">
                      <span>Garantía Pagada (20%)</span>
                      <span className="font-black">${(booking.totalAmount * 0.2).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between py-2.5 text-xs font-bold text-gray-300 print-text-dark">
                      <div>
                        <span>Saldo Pendiente (80%)</span>
                        <span className="block text-[9px] text-gray-400 print-text-muted font-bold normal-case mt-0.5">
                          A pagar al anfitrión el día del Check-in
                        </span>
                      </div>
                      <span className="text-white print-text-dark font-black text-sm">${(booking.totalAmount * 0.8).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div data-print-hide className="p-6 bg-brand-navy border-t border-white/10 flex flex-wrap sm:flex-nowrap gap-3">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 text-xs font-black tracking-widest uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
          >
            Cerrar
          </button>
          
          <button
            onClick={handlePrint}
            className="w-full sm:flex-1 bg-white/5 border border-[#C5A059]/30 hover:bg-[#C5A059]/10 text-white rounded-xl py-3 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
          >
            <Download className="h-4 w-4 text-[#C5A059]" />
            Descargar PDF
          </button>

          {onContactHost && (
            <button
              onClick={() => {
                onClose();
                onContactHost();
              }}
              className="w-full sm:flex-1 bg-brand-gold hover:bg-[#b08e4d] text-brand-navy rounded-xl py-3 text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <MessageSquare className="h-4 w-4" />
              Chat Anfitrión
            </button>
          )}
        </div>
      </motion.div>

      {/* Lightbox for payment proof receipt */}
      {showFullReceipt && proofSignedUrl && (
        <div 
          data-print-hide
          className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowFullReceipt(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white transition-all focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullReceipt(false);
            }}
          >
            <X className="h-5 w-5" />
          </button>
          
          <img 
            src={proofSignedUrl} 
            alt="Comprobante en tamaño completo" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/10 shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-gray-400 text-xs font-bold mt-4 font-mono select-all">
            Ref: {booking.paymentReference}
          </p>
        </div>
      )}

      {/* Custom print instructions modal */}
      {showPrintInstructions && (
        <div data-print-hide className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1120] border border-white/10 text-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl relative">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#C5A059] mb-3 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Descargar Resumen PDF
            </h4>
            <p className="text-[11px] text-gray-300 font-bold leading-relaxed mb-5">
              Para guardar tu resumen de estadía como PDF:
              <br /><br />
              1. En la ventana del sistema que se abrirá, selecciona la opción <strong className="text-white">"Guardar como PDF"</strong> o <strong className="text-white">"Save as PDF"</strong> en el campo de <strong className="text-white">Destino (Destination)</strong>.
              <br /><br />
              2. Haz clic en el botón <strong className="text-[#C5A059]">Guardar</strong>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPrintInstructions(false);
                  setTimeout(() => {
                    window.print();
                  }, 150);
                }}
                className="flex-1 bg-[#C5A059] hover:bg-[#b08e4d] text-brand-navy rounded-xl py-2.5 text-xs font-black tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-white"
              >
                Imprimir / PDF
              </button>
              <button
                onClick={() => setShowPrintInstructions(false)}
                className="flex-1 border border-white/10 hover:bg-white/5 text-white rounded-xl py-2.5 text-xs font-black tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
