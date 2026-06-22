import React from 'react';
import { ShieldCheck, Mail, Phone, CreditCard } from 'lucide-react';
import { UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface TravelerDNAWidgetProps {
  userProfile: UserProfile;
}

const TravelerDNAWidget: React.FC<TravelerDNAWidgetProps> = ({ userProfile }) => {
  const trustScore = userProfile.trustScore || 0;
  // Fallback to older flags if trustSignals is not populated yet
  const signals = userProfile.trustSignals || { 
    emailVerified: userProfile.isEmailVerified || false, 
    phoneVerified: userProfile.isPhoneVerified || false, 
    paymentNameMatchStatus: 'NOT_ATTEMPTED' 
  };
  
  const getScoreColor = () => {
    if (trustScore >= 45) return 'bg-emerald-500 text-emerald-600 bg-emerald-50';
    if (trustScore >= 25) return 'bg-brand-500 text-brand-600 bg-brand-50';
    return 'bg-amber-500 text-amber-600 bg-amber-50';
  };

  const getScoreLabel = () => {
    if (trustScore >= 45) return 'Huésped Verificado';
    if (trustScore >= 25) return 'Nivel Básico (Apto para reservas)';
    return 'Perfil Nuevo';
  };

  const colors = getScoreColor().split(' ');
  const bgFill = colors[0];
  const textColor = colors[1];
  const bgLight = colors[2];

  return (
    <div className="rounded-[40px] border border-gray-100 bg-white p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", bgLight)}>
          <ShieldCheck className={cn("h-6 w-6", textColor)} />
        </div>
        <div>
          <h3 className="text-brand-navy text-xl font-black">Traveler DNA</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Trust Score: {trustScore}% - {getScoreLabel()}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(trustScore, 100)}%` }}
            className={cn("h-full rounded-full transition-all duration-1000 relative overflow-hidden", bgFill)}
          >
             <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse" />
          </motion.div>
        </div>

        {/* Signals Checklist */}
        <div className="grid gap-3 pt-2">
          <div className={cn("flex items-center gap-3 rounded-2xl p-4 text-xs font-bold transition-colors", signals.emailVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-50 text-gray-400 border border-gray-100")}>
            <Mail className="h-5 w-5" />
            <span className="grow">Verificación de Email (+10%)</span>
            {signals.emailVerified ? <ShieldCheck className="h-5 w-5" /> : <span className="text-[9px] uppercase tracking-widest text-brand-500">Pendiente</span>}
          </div>
          
          <div className={cn("flex items-center gap-3 rounded-2xl p-4 text-xs font-bold transition-colors", signals.phoneVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-50 text-gray-400 border border-gray-100")}>
            <Phone className="h-5 w-5" />
            <span className="grow">Verificación de Teléfono (+15%)</span>
            {signals.phoneVerified ? <ShieldCheck className="h-5 w-5" /> : <span className="text-[9px] uppercase tracking-widest text-brand-500">Requerido</span>}
          </div>
          
          <div className={cn("flex items-center gap-3 rounded-2xl p-4 text-xs font-bold transition-colors", signals.paymentNameMatchStatus === 'MATCHED' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : signals.paymentNameMatchStatus === 'FAILED' ? "bg-red-50 text-red-700 border border-red-100" : "bg-gray-50 text-gray-400 border border-gray-100")}>
            <CreditCard className="h-5 w-5" />
            <span className="grow">Verificación de Pago (+20%)</span>
            {signals.paymentNameMatchStatus === 'MATCHED' ? <ShieldCheck className="h-5 w-5" /> : signals.paymentNameMatchStatus === 'FAILED' ? <span className="text-[9px] uppercase tracking-widest text-red-500">Fallido</span> : <span className="text-[9px] uppercase tracking-widest text-gray-400">Automático al Reservar</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerDNAWidget;
