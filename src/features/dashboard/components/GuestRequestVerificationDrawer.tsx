import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Users, 
  Hash, 
  MessageSquare, 
  Shield, 
  Mail, 
  Phone, 
  Award,
  Clock,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types';
import { calculateCommission, CommissionTier } from '@/lib/commission';
import { useGuestProfile } from '../hooks/useGuestProfile';
import { useListingPaymentMethods } from '@/features/listings/hooks/useListingPaymentMethods';
import { approveBookingRequestWithDetails, rejectBookingRequest } from '@/services/booking-request.service';
import { toast } from 'sonner';
import { z } from 'zod';

const rejectionReasonSchema = z.string()
  .min(10, 'El motivo de rechazo debe tener al menos 10 caracteres.')
  .max(300, 'El motivo de rechazo no puede superar los 300 caracteres.');

interface GuestRequestVerificationDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onApproveSuccess?: (bookingId: string) => void;
  onRejectSuccess?: (bookingId: string) => void;
  onOpenChat: (booking: Booking) => void;
  allBookings: Booking[];
  tier: CommissionTier;
}

const GuestRequestVerificationDrawer: React.FC<GuestRequestVerificationDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onApproveSuccess,
  onRejectSuccess,
  onOpenChat,
  allBookings,
  tier
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [timeWarning, setTimeWarning] = useState(false);
  
  const [hostNote, setHostNote] = useState('');
  const [selectedPaymentDataIdx, setSelectedPaymentDataIdx] = useState<number>(0);

  // Hooks
  const { paymentMethods: listingPaymentMethods } = useListingPaymentMethods(booking?.listingId);
  const { guestProfile, trustScore, isLoading: isProfileLoading } = useGuestProfile(booking?.guestId);

  // Expiration countdown effect
  useEffect(() => {
    if (!booking?.expiresAt || !isOpen) return;

    const calculateTime = () => {
      const difference = new Date(booking.expiresAt!).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft('Expirado');
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      
      // Warning if less than 2 hours left
      if (difference < 2 * 60 * 60 * 1000) {
        setTimeWarning(true);
      } else {
        setTimeWarning(false);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [booking?.expiresAt, isOpen]);

  if (!booking) return null;

  // Conflict calculation
  const isConflicting = allBookings.some(b => {
    if (b.id === booking.id || b.listingId !== booking.listingId) return false;
    if (booking.status === 'REJECTED' || booking.status === 'CANCELLED' || booking.status === 'EXPIRED') return false;
    if (b.status === 'REJECTED' || b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;

    try {
      const start1 = startOfDay(parseISO(booking.startDate));
      const end1 = startOfDay(parseISO(booking.endDate));
      const start2 = startOfDay(parseISO(b.startDate));
      const end2 = startOfDay(parseISO(b.endDate));

      return (
        isWithinInterval(start1, { start: start2, end: end2 }) ||
        isWithinInterval(end1, { start: start2, end: end2 }) ||
        isWithinInterval(start2, { start: start1, end: end1 })
      );
    } catch {
      return false;
    }
  });

  // UCP Calculations
  const commission = calculateCommission(booking.totalAmount, tier);

  const handleApproveWithDetails = async () => {
    try {
      setIsSubmitting(true);
      const selectedPayment = listingPaymentMethods[selectedPaymentDataIdx];
      const paymentInstructions = selectedPayment 
        ? `${selectedPayment.label} - ${selectedPayment.type}\nDetalles adicionales provistos por el anfitrión en su perfil.`
        : 'Pago Móvil (o método predeterminado).';
        
      await approveBookingRequestWithDetails(booking.id, hostNote, paymentInstructions, booking.ownerId);
      toast.success('Solicitud de reserva aprobada con éxito');
      if (onApproveSuccess) onApproveSuccess(booking.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aprobar la reserva.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    const validation = rejectionReasonSchema.safeParse(rejectionReason);
    if (!validation.success) {
      setRejectionError(validation.error.issues[0].message);
      return;
    }

    try {
      setIsSubmitting(true);
      setRejectionError('');
      await rejectBookingRequest(booking.id, rejectionReason);
      toast.success('Solicitud de reserva rechazada');
      if (onRejectSuccess) onRejectSuccess(booking.id);
      setShowRejectDialog(false);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al rechazar la reserva.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Radial SVG Arc calculations for Trust Score
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  // Adaptive Trust Score Color
  const trustColorClass = trustScore < 40 
    ? 'text-red-500 stroke-red-500' 
    : trustScore < 80 
      ? 'text-brand-500 stroke-brand-500' 
      : 'text-emerald-500 stroke-emerald-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[120]"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[130] flex flex-col no-scrollbar overflow-y-auto"
            role="dialog"
            aria-labelledby="drawer-title"
          >
            {/* Header */}
            <div className="bg-brand-navy p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black tracking-widest text-brand-500 uppercase">
                  Verificar Solicitud
                </span>
                <h3 id="drawer-title" className="text-lg font-black mt-1 leading-tight">
                  Ref: #{booking.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {booking.expiresAt && (
                  <div className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase",
                    timeWarning 
                      ? "border-red-500/30 bg-red-500/10 text-red-400 animate-pulse" 
                      : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  )} aria-live="polite">
                    <Clock className="h-3 w-3" />
                    <span>{timeLeft}</span>
                  </div>
                )}
                <button 
                  onClick={onClose}
                  className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-all active:scale-95"
                  aria-label="Cerrar panel de verificación"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-grow p-6 space-y-6 overflow-y-auto no-scrollbar">
              {/* Conflict Alerter */}
              {isConflicting && (
                <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 flex gap-3 text-red-700 animate-pulse">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                  <div className="text-xs">
                    <p className="font-black uppercase tracking-wider text-[9px] mb-1">
                      Alerta de Solapamiento
                    </p>
                    <p className="font-semibold leading-relaxed">
                      Tienes otra reserva que se superpone con estas fechas. Verifica tu calendario antes de aprobar.
                    </p>
                  </div>
                </div>
              )}

              {/* Guest Pasaporte Section */}
              <div className="rounded-3xl border border-gray-100 bg-gray-50/40 p-5 space-y-4" aria-label="Pasaporte del huésped">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    Pasaporte VeneStay
                  </span>
                  {guestProfile?.isIdentityVerified && (
                    <span className="rounded-full bg-emerald-100/50 border border-emerald-200 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-600 uppercase flex items-center gap-1">
                      <UserCheck className="h-2.5 w-2.5" /> Verificado
                    </span>
                  )}
                </div>

                {isProfileLoading ? (
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="h-14 w-14 rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-grow">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    {/* Guest Main Info */}
                    <div className="flex items-center gap-4">
                      {guestProfile?.photoURL ? (
                        <img 
                          src={guestProfile.photoURL} 
                          alt={booking.guestName}
                          className="h-14 w-14 rounded-full object-cover border-2 border-brand-gold/30 shadow-sm"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-brand-navy text-white flex items-center justify-center font-black text-xl border-2 border-brand-gold/30 shadow-sm">
                          {booking.guestName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-brand-navy font-black text-sm uppercase">
                          {booking.guestName}
                        </h4>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                          Huésped de la plataforma
                        </p>
                        {/* KYC badges */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span 
                            className={cn(
                              "p-1 rounded-lg border",
                              guestProfile?.isEmailVerified ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-400"
                            )} 
                            title={guestProfile?.isEmailVerified ? "Correo verificado" : "Correo sin verificar"}
                          >
                            <Mail className="h-3 w-3" />
                          </span>
                          <span 
                            className={cn(
                              "p-1 rounded-lg border",
                              guestProfile?.isPhoneVerified ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-400"
                            )}
                            title={guestProfile?.isPhoneVerified ? "Teléfono verificado" : "Teléfono sin verificar"}
                          >
                            <Phone className="h-3 w-3" />
                          </span>
                          <span 
                            className={cn(
                              "p-1 rounded-lg border",
                              guestProfile?.isIdentityVerified ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-400"
                            )}
                            title={guestProfile?.isIdentityVerified ? "Identidad verificado" : "Identidad sin verificar"}
                          >
                            <Shield className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Radial SVG Trust Score */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <svg className="absolute transform -rotate-90 w-14 h-14">
                          {/* Background Circle */}
                          <circle
                            cx="28"
                            cy="28"
                            r={radius}
                            className="stroke-gray-100 fill-none"
                            strokeWidth="3.5"
                          />
                          {/* Animated Foreground Circle */}
                          <motion.circle
                            cx="28"
                            cy="28"
                            r={radius}
                            className={cn("fill-none", trustColorClass)}
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </svg>
                        <span className={cn("text-xs font-black", trustColorClass)}>
                          {trustScore}%
                        </span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 mt-1">
                        Confianza
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <h4 className="text-brand-navy font-black text-sm uppercase border-b border-gray-100 pb-2">
                  Detalles de la Reserva
                </h4>
                <p className="text-brand-navy text-base font-black leading-tight">
                  {booking.listingTitle}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-4 py-3 rounded-2xl">
                    <Calendar className="text-brand-500 mr-2 h-4 w-4 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 uppercase font-bold">Fechas</span>
                      <span>
                        {booking.startDate && booking.endDate
                          ? `${format(new Date(booking.startDate), 'dd/MM')} - ${format(new Date(booking.endDate), 'dd/MM/yy')}`
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-4 py-3 rounded-2xl">
                    <Users className="text-brand-500 mr-2 h-4 w-4 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 uppercase font-bold">Huéspedes</span>
                      <span>{booking.guests} Viajeros</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Message Presentation */}
              {booking.guestMessage && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50/20 p-5 space-y-2">
                  <span className="text-[9px] font-black tracking-widest text-amber-700 uppercase flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Presentación del huésped
                  </span>
                  <p className="text-xs italic text-gray-600 font-semibold leading-relaxed">
                    "{booking.guestMessage}"
                  </p>
                </div>
              )}

              {/* UCP Earnings Breakdown */}
              <div className="space-y-4">
                <h4 className="text-brand-navy font-black text-sm uppercase border-b border-gray-100 pb-2">
                  Desglose Financiero (Protocolo UCP 20/80)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gold Circle: Anticipo (20%) */}
                  <div className="border border-brand-gold/20 bg-brand-gold/5 rounded-3xl p-4 flex flex-col justify-between h-28">
                    <div>
                      <span className="text-[9px] font-black tracking-wider text-brand-500 uppercase flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Anticipo Garantía (20%)
                      </span>
                      <p className="text-2xl font-black text-brand-navy mt-2">
                        ${commission.hostNetProfit ? (booking.totalAmount * 0.2).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <span className="text-[8px] font-bold text-gray-400">
                      Huésped lo transfiere hoy
                    </span>
                  </div>

                  {/* Navy Circle: Saldo Check-In (80%) */}
                  <div className="border border-brand-navy/10 bg-brand-navy/5 rounded-3xl p-4 flex flex-col justify-between h-28">
                    <div>
                      <span className="text-[9px] font-black tracking-wider text-brand-navy uppercase flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-navy" /> Saldo Check-in (80%)
                      </span>
                      <p className="text-2xl font-black text-brand-navy mt-2">
                        ${commission.ucpBalance ? commission.ucpBalance.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <span className="text-[8px] font-bold text-gray-400">
                      Pagas directamente al anfitrión
                    </span>
                  </div>
                </div>

                {/* Net Earnings Summary */}
                <div className="bg-brand-navy text-white rounded-3xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-widest text-brand-500 uppercase">
                      Ingreso Neto Neto
                    </span>
                    <h3 className="text-3xl font-black">
                      ${commission.hostNetProfit ? commission.hostNetProfit.toFixed(2) : '0.00'}
                    </h3>
                  </div>
                  <div className="text-right text-[10px] space-y-1 font-semibold text-gray-400">
                    <p>Total: ${booking.totalAmount}</p>
                    <p>Plataforma: -${(booking.totalAmount * (100 - tier) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              {/* Respuesta y Datos de Pago al Inquilino (Paso 2) */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                <label className="text-brand-navy block text-[9px] font-black tracking-widest uppercase">
                  Respuesta y Datos de Pago al Inquilino (Paso 2)
                </label>
                
                <textarea
                  value={hostNote}
                  onChange={(e) => setHostNote(e.target.value)}
                  placeholder="Ej: ¡Hola! Con gusto te recibimos en Lechería. Adjunto mis datos para completar la garantía..."
                  className="w-full h-20 rounded-2xl border border-gray-200 bg-white p-3 text-xs outline-none focus:ring-1 focus:ring-brand-gold"
                />

                <div className="space-y-2">
                  <label className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
                    Seleccionar Cuenta de Pago de la Propiedad
                  </label>
                  <select 
                    value={selectedPaymentDataIdx}
                    onChange={(e) => setSelectedPaymentDataIdx(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-bold focus:ring-1 focus:ring-brand-gold outline-none"
                  >
                    {listingPaymentMethods.map((method, idx) => (
                      <option key={idx} value={idx}>
                        {method.label} ({method.type})
                      </option>
                    ))}
                    {listingPaymentMethods.length === 0 && (
                      <option value="-1">Sin métodos registrados (Usar predeterminado)</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions Bar Footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-6 shrink-0 flex items-center gap-4">
              <button
                disabled={isSubmitting}
                onClick={() => onOpenChat(booking)}
                className="bg-white border border-gray-200 text-brand-navy hover:bg-gray-100 flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all shrink-0"
                aria-label="Iniciar chat de conversación"
              >
                <MessageSquare className="h-4 w-4" />
              </button>

              <button
                disabled={isSubmitting || !hostNote.trim()}
                onClick={handleApproveWithDetails}
                className="bg-emerald-500 hover:bg-emerald-600 text-white flex-grow flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl shadow-emerald-500/10 transition-all disabled:opacity-50"
                aria-label={`Aprobar solicitud de reserva`}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Aprobar y Enviar Datos
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => setShowRejectDialog(true)}
                className="bg-white border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all"
                aria-label={`Rechazar solicitud`}
              >
                Rechazar
              </button>
            </div>

            {/* Inline Reject Dialog Modal */}
            <AnimatePresence>
              {showRejectDialog && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-brand-navy/80 p-4 backdrop-blur-md">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-black text-brand-navy">Rechazar Solicitud</h3>
                      <p className="text-xs text-gray-500 mt-2 font-medium">
                        Por favor, proporciona el motivo del rechazo para que el huésped esté debidamente informado:
                      </p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Escribe el motivo del rechazo (mín. 10 caracteres)..."
                        className="w-full h-24 rounded-2xl border border-gray-200 p-3 text-xs focus:ring-1 focus:ring-brand-gold outline-none font-medium resize-none"
                      />
                      {rejectionError && (
                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {rejectionError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowRejectDialog(false);
                          setRejectionReason('');
                          setRejectionError('');
                        }}
                        className="flex-grow py-3.5 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleReject}
                        className="flex-grow py-3.5 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                      >
                        Confirmar Rechazo
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GuestRequestVerificationDrawer;
