import React, { useState } from 'react';
import { Mail, Check, Info, User, Loader2 } from 'lucide-react';
import { UserProfile } from '@/features/auth/types';
import { sendEmailVerification } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { WhatsAppVerificationCard } from './WhatsAppVerificationCard';
import { sendVerificationEmail } from '@/services/auth-service';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface SecuritySectionProps {
  profile: UserProfile | null;
  onOpenVerificationModal: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  profile,
  onOpenVerificationModal
}) => {
  const { user, refreshProfile } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleSendVerification = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast.success('Correo de verificación enviado. Revisa tu bandeja de entrada o spam.');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar correo. Puede que hayas excedido el límite, intenta más tarde.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    setIsChecking(true);
    try {
      await user.reload();
      const syncFn = httpsCallable(functions, 'syncEmailVerification');
      const result = await syncFn();
      const data = result.data as { verified: boolean };
      
      if (data.verified) {
        toast.success('¡Correo verificado exitosamente!');
        await refreshProfile();
      } else {
        toast.error('El correo aún no ha sido verificado. Asegúrate de hacer clic en el enlace enviado.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al sincronizar verificación.');
    } finally {
      setIsChecking(false);
    }
  };

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
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-1.5 text-brand-500 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
                <Info className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Pendiente</span>
              </div>
            </div>
          )}
        </div>

        {!profile?.isEmailVerified && (
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 mt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">
              Por seguridad, necesitamos confirmar que este correo te pertenece.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSendVerification}
                disabled={isSending}
                className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-[10px] font-black tracking-widest text-gray-700 uppercase transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                Enviar enlace
              </button>
              <button
                onClick={handleCheckVerification}
                disabled={isChecking}
                className="flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-[10px] font-black tracking-widest text-brand-navy uppercase transition-colors hover:bg-brand-400 disabled:opacity-50"
              >
                {isChecking ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                Ya lo verifiqué
              </button>
            </div>
          </div>
        )}

        <WhatsAppVerificationCard profile={profile} />

      </div>
    </div>
  );
};
