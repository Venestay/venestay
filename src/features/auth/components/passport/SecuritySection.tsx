import React from 'react';
import { Mail, Check, Info, User } from 'lucide-react';
import { UserProfile } from '@/features/auth/types';
import { WhatsAppVerificationCard } from './WhatsAppVerificationCard';

interface SecuritySectionProps {
  profile: UserProfile | null;
  onOpenVerificationModal: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  profile,
  onOpenVerificationModal
}) => {
  return (
    <div className="py-12 md:py-16 space-y-10">
      <div>
        <h3 className="text-2xl font-black tracking-tight text-brand-navy">Seguridad y Respaldo</h3>
        <p className="text-xs text-gray-600 mt-1 font-medium">Tu identidad está protegida bajo estándares de cifrado bancario.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-brand-navy">Correo Electrónico</p>
              <p className="text-xs text-gray-600 font-medium">{profile?.email || 'No vinculado'}</p>
            </div>
          </div>
          {profile?.isEmailVerified ? (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <Check className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Verificado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-brand-500 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
              <Info className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Pendiente</span>
            </div>
          )}
        </div>

        <WhatsAppVerificationCard profile={profile} />

      </div>
    </div>
  );
};
