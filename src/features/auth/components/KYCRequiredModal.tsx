/**
 * KYCRequiredModal
 *
 * Modal de verificación de identidad (KYC) que aparece cuando el usuario
 * está autenticado pero su KYC no está completo (UNVERIFIED o REJECTED).
 * Si está PENDING_REVIEW, muestra un aviso informativo y permite continuar.
 *
 * Spec: flujo-auth-kyc-pre-reserva
 * skill: vercel-react-best-practices, accessibility (WCAG 2.2)
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ShieldAlert, Clock, ArrowRight, Info } from 'lucide-react';
import { KYCStatus } from '@/features/auth/types';
import { cn } from '@/lib/utils';
import { PassportCompletionBanner } from './passport/PassportCompletionBanner';

export interface PendingBookingSummary {
  listingTitle: string;
  datesText: string;
  totalAmount: number;
}

interface KYCRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycStatus: KYCStatus | undefined;
  profile?: Partial<import('@/features/auth/types').UserProfile> | null;
  /** Resumen del pago o reserva en borrador */
  pendingBookingSummary?: PendingBookingSummary | null;
  /** Llamado cuando el usuario hace clic en "Completar verificación" */
  onGoToPassport: (section?: string) => void;
}

interface KYCStateConfig {
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  ctaLabel: string;
  showCTA: boolean;
  canContinue: boolean;
}

export const getKYCConfig = (status: KYCStatus | undefined, hasPendingBooking?: boolean): KYCStateConfig => {
  switch (status) {
    case 'REJECTED':
      return {
        icon: <ShieldAlert className="h-8 w-8 text-white" />,
        iconBg: 'bg-red-500',
        badge: 'Verificación rechazada',
        badgeColor: 'text-red-600 bg-red-50 border-red-100',
        title: 'Tu verificación fue rechazada',
        description:
          'Para proteger a la comunidad VeneStay, necesitamos verificar tu identidad. Por favor revisa los datos enviados y reintenta la verificación.',
        ctaLabel: 'Reintentar verificación',
        showCTA: true,
        canContinue: false,
      };
    case 'PENDING_REVIEW':
      return {
        icon: <Clock className="h-8 w-8 text-white" />,
        iconBg: 'bg-amber-500',
        badge: 'Verificación en proceso',
        badgeColor: 'text-amber-700 bg-amber-50 border-amber-100',
        title: 'Tu verificación está en revisión',
        description:
          'Nuestro equipo está revisando tu información. Esto puede tomar entre 2 y 24 horas. Mientras tanto, tus fechas y borrador están guardados.',
        ctaLabel: 'Ver estado de verificación',
        showCTA: true,
        canContinue: true,
      };
    default:
      // UNVERIFIED o undefined
      return {
        icon: <ShieldCheck className="h-8 w-8 text-white" />,
        iconBg: 'bg-brand-navy',
        badge: hasPendingBooking ? '🔒 Pago Pendiente Guardado' : 'Verificación rápida',
        badgeColor: hasPendingBooking ? 'text-brand-gold bg-amber-50/80 border-amber-200' : 'text-brand-navy bg-blue-50 border-blue-100',
        title: hasPendingBooking ? '¡Casi listo para asegurar tu estadía! 🌴' : 'Completa tu verificación para reservar',
        description: hasPendingBooking
          ? 'Tus fechas y precios están guardados en borrador. Para proteger tu dinero y dar confianza mutua al anfitrión, completa dos pasos rápidos en tu Pasaporte (menos de 1 minuto).'
          : 'VeneStay requiere verificar tu identidad antes de realizar tu primera reserva. Es un proceso rápido que protege tanto a huéspedes como anfitriones.',
        ctaLabel: hasPendingBooking ? 'Completar en Mi Pasaporte y Continuar Pago' : 'Completar verificación ahora',
        showCTA: true,
        canContinue: false,
      };
  }
};

/** Selector de elementos focusables para el trap de foco (WCAG 2.2) */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const KYCRequiredModal: React.FC<KYCRequiredModalProps> = ({
  isOpen,
  onClose,
  kycStatus,
  profile,
  pendingBookingSummary,
  onGoToPassport,
}) => {
  const config = getKYCConfig(kycStatus, !!pendingBookingSummary);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape key (WCAG 2.2 §4.1.2)
  useEffect(() => {
    if (!isOpen) return;

    // Mover foco al modal al abrirse
    const prevFocus = document.activeElement as HTMLElement | null;
    const firstFocusable = modalRef.current?.querySelector(FOCUSABLE) as HTMLElement | null;
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(FOCUSABLE) ?? [];
      const focusable = Array.from(focusableElements).filter(
        (el): el is HTMLElement => el instanceof HTMLElement
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaurar foco al elemento que lo tenía antes
      prevFocus?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-modal-title"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header gradient strip */}
            <div
              className={cn(
                'relative flex flex-col items-center gap-4 px-8 pt-10 pb-8',
                kycStatus === 'REJECTED'
                  ? 'bg-gradient-to-b from-red-50 to-white'
                  : kycStatus === 'PENDING_REVIEW'
                    ? 'bg-gradient-to-b from-amber-50 to-white'
                    : 'bg-gradient-to-b from-blue-50 to-white'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg',
                  config.iconBg
                )}
              >
                {config.icon}
              </div>

              {/* Badge */}
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase',
                  config.badgeColor
                )}
              >
                {config.badge}
              </span>
            </div>

            {/* Body */}
            <div className="px-8 pb-8">
              <h2
                id="kyc-modal-title"
                className="text-brand-navy mb-3 text-center text-xl font-black tracking-tight"
              >
                {config.title}
              </h2>
              <p className="mb-6 text-center text-sm leading-relaxed text-gray-500">
                {config.description}
              </p>

              {/* Pending booking card */}
              {pendingBookingSummary && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2 mb-2">
                    <span className="text-[11px] font-black tracking-widest text-brand-navy uppercase">
                      Reserva en borrador
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      ⏱️ Guardada (4h)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {pendingBookingSummary.listingTitle}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-600">
                    <span>{pendingBookingSummary.datesText}</span>
                    <span className="font-extrabold text-brand-navy">
                      ${pendingBookingSummary.totalAmount} USD
                    </span>
                  </div>
                </div>
              )}

              {/* PENDING_REVIEW info chip */}
              {kycStatus === 'PENDING_REVIEW' && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs font-medium text-amber-700">
                    Podrás reservar una vez que tu verificación sea aprobada.
                    Si tienes urgencia, contacta a soporte.
                  </p>
                </div>
              )}

              {/* Steps summary (only for UNVERIFIED) */}
              {(!kycStatus || kycStatus === 'UNVERIFIED') && profile ? (
                <div className="mb-6">
                  <PassportCompletionBanner profile={profile} onNavigate={onGoToPassport} />
                </div>
              ) : null}

              {/* CTAs */}
              <div className="space-y-3">
                {config.showCTA && (
                  <button
                    onClick={() => onGoToPassport()}
                    className={cn(
                      'group flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[11px] font-black tracking-widest text-white uppercase shadow-lg transition-all active:scale-[0.98]',
                      kycStatus === 'REJECTED'
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                        : kycStatus === 'PENDING_REVIEW'
                          ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                          : 'bg-brand-navy hover:bg-brand-navy/90 shadow-blue-200'
                    )}
                  >
                    {config.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                )}

                {config.canContinue && (
                  <button
                    onClick={onClose}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-[11px] font-black tracking-widest text-gray-600 uppercase transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    Continuar con la reserva
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
                >
                  Continuar más tarde
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KYCRequiredModal;
