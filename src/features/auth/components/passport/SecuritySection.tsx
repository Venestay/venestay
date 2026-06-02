import React from 'react';
import { Mail, Check, Info, User } from 'lucide-react';
import { UserProfile } from '@/features/auth/types';

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
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm group transition-all hover:border-brand-500/20">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 group-hover:scale-110 transition-transform border border-brand-100">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-brand-navy">Identidad (KYC)</p>
              <p className="text-xs text-gray-600 font-medium">
                {profile?.kycStatus === 'PENDING_REVIEW' && 'Tu documento está siendo revisado (24-48h).'}
                {profile?.kycStatus === 'REJECTED' && (profile.kycRejectionNote || 'El documento no pudo ser verificado.')}
                {profile?.kycStatus === 'VERIFIED' && 'Identidad verificada exitosamente.'}
                {(!profile?.kycStatus || profile?.kycStatus === 'NOT_SUBMITTED' || profile?.kycStatus === 'UNVERIFIED') && 'Cédula o Pasaporte de identidad vigente.'}
              </p>
            </div>
          </div>
          {(() => {
            const status = profile?.kycStatus || 'NOT_SUBMITTED';
            if (profile?.isIdentityVerified || status === 'VERIFIED') {
              return (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <Check className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Validado</span>
                </div>
              );
            }
            if (status === 'PENDING_REVIEW') {
              return (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <Info className="h-3 w-3 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">En revisión</span>
                </div>
              );
            }
            if (status === 'REJECTED') {
              return (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    <Info className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Rechazado</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={onOpenVerificationModal}
                    className="text-[10px] font-bold text-brand-500 hover:underline"
                  >
                    Volver a intentar
                  </button>
                </div>
              );
            }
            return (
              <button 
                type="button" 
                onClick={onOpenVerificationModal}
                className="rounded-xl border-2 border-brand-500/30 text-brand-500 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-500 hover:text-white transition-all focus:ring-1 focus:ring-brand-500"
              >
                Verificar
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
