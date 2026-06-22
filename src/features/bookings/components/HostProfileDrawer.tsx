import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Mail, Phone, UserCheck, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useGuestProfile } from '@/features/dashboard/hooks/useGuestProfile';
import { Booking } from '@/types';

interface HostProfileDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (booking: Booking) => void;
}

const HostProfileDrawer: React.FC<HostProfileDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const { guestProfile: hostProfile, trustScore, isLoading } = useGuestProfile(booking?.ownerId);

  // Radial SVG Arc calculations for Trust Score
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;
  const trustColorClass = trustScore < 40 
    ? 'text-red-500 stroke-red-500' 
    : trustScore < 80 
      ? 'text-brand-500 stroke-brand-500' 
      : 'text-emerald-500 stroke-emerald-500';

  const formatJoinedDate = (createdAt: unknown) => {
    if (!createdAt) return 'Fecha desconocida';
    try {
      const ca = createdAt as { toDate?: () => Date };
      const d = ca.toDate 
        ? ca.toDate() 
        : new Date(createdAt as string | number | Date);
      return `Miembro desde ${format(d, 'MMMM yyyy', { locale: es })}`;
    } catch {
      return 'Fecha desconocida';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && booking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-120"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-130 flex flex-col no-scrollbar overflow-y-auto"
            role="dialog"
            aria-labelledby="host-profile-title"
          >
            {/* Header */}
            <div className="bg-brand-navy p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black tracking-widest text-brand-500 uppercase">
                  Perfil del Anfitrión
                </span>
                <h3 id="host-profile-title" className="text-lg font-black mt-1 leading-tight">
                  Sobre el Propietario
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-all active:scale-95"
                aria-label="Cerrar perfil de anfitrión"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="grow p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className="rounded-3xl border border-gray-100 bg-gray-50/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    Identidad VeneStay
                  </span>
                  {hostProfile?.isIdentityVerified && (
                    <span className="rounded-full bg-emerald-100/50 border border-emerald-200 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-600 uppercase flex items-center gap-1">
                      <UserCheck className="h-2.5 w-2.5" /> Verificado
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="h-14 w-14 rounded-full bg-gray-200" />
                    <div className="space-y-2 grow">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {hostProfile?.photoURL ? (
                        <img 
                          src={hostProfile.photoURL} 
                          alt={hostProfile.displayName || 'Anfitrión'}
                          className="h-14 w-14 rounded-full object-cover border-2 border-brand-gold/30 shadow-sm"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-brand-navy text-white flex items-center justify-center font-black text-xl border-2 border-brand-gold/30 shadow-sm">
                          {(hostProfile?.displayName || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-brand-navy font-black text-sm uppercase">
                          {hostProfile?.displayName || 'Anfitrión'}
                        </h4>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5 capitalize flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatJoinedDate(hostProfile?.createdAt)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span 
                            className={cn(
                              "p-1 rounded-lg border",
                              hostProfile?.isEmailVerified ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-400"
                            )} 
                            title={hostProfile?.isEmailVerified ? "Correo verificado" : "Correo sin verificar"}
                          >
                            <Mail className="h-3 w-3" />
                          </span>
                          <span 
                            className={cn(
                              "p-1 rounded-lg border",
                              hostProfile?.isPhoneVerified ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-400"
                            )}
                            title={hostProfile?.isPhoneVerified ? "Teléfono verificado" : "Teléfono sin verificar"}
                          >
                            <Phone className="h-3 w-3" />
                          </span>
                          <span 
                            className={cn(
                              "p-1 rounded-lg border",
                              hostProfile?.isIdentityVerified ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-white text-gray-400"
                            )}
                            title={hostProfile?.isIdentityVerified ? "Identidad verificada" : "Identidad sin verificar"}
                          >
                            <Shield className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trust Score */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <svg className="absolute transform -rotate-90 w-14 h-14">
                          <circle
                            cx="28"
                            cy="28"
                            r={radius}
                            className="stroke-gray-100 fill-none"
                            strokeWidth="3.5"
                          />
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

              {/* Bio/About Section */}
              {(hostProfile?.about || hostProfile?.bio) && (
                <div className="rounded-3xl border border-brand-navy/10 bg-brand-navy/5 p-5 space-y-2">
                  <span className="text-[9px] font-black tracking-widest text-brand-navy uppercase flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Acerca de mí
                  </span>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed whitespace-pre-wrap">
                    {hostProfile.about || hostProfile.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-6 shrink-0 flex items-center gap-4">
              <button
                onClick={() => {
                  onClose();
                  onOpenChat(booking);
                }}
                className="bg-brand-navy hover:bg-brand-800 text-white w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all"
                aria-label={`Escribir al anfitrión`}
              >
                <MessageSquare className="h-4 w-4" />
                Contactar al Anfitrión
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HostProfileDrawer;
