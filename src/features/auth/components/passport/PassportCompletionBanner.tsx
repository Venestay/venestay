import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { cn } from '@/lib/utils';

interface PassportCompletionBannerProps {
  profile: Partial<UserProfile> | null;
  onNavigate?: (section: string) => void;
  className?: string;
}

export const PassportCompletionBanner: React.FC<PassportCompletionBannerProps> = ({ profile, onNavigate, className }) => {
  if (!profile) return null;

  const requirements = [
    {
      id: 'email',
      label: 'Email verificado',
      isComplete: profile.trustSignals?.emailVerified || profile.isEmailVerified,
      section: 'security'
    },
    {
      id: 'whatsapp',
      label: 'Verificar Teléfono',
      isComplete: profile.trustSignals?.whatsappVerified || profile.isPhoneVerified,
      section: 'security'
    },
    {
      id: 'photo',
      label: 'Agregar foto de perfil',
      isComplete: !!profile.photoURL,
      section: 'public'
    },
    {
      id: 'name',
      label: 'Completar nombre completo',
      isComplete: !!profile.displayName && profile.displayName.trim().split(' ').length >= 2,
      section: 'public'
    },
    {
      id: 'birthDate',
      label: 'Agregar fecha de nacimiento',
      isComplete: !!profile.profile?.birthDate || profile.profile?.birthDateVerified === true,
      section: 'dna'
    },
    {
      id: 'bio',
      label: 'Escribir una descripción (mín. 20 caracteres)',
      isComplete: (profile.profile?.bio?.length ?? 0) >= 20 || (profile.bio?.length ?? 0) >= 20,
      section: 'public'
    }
  ];

  const allComplete = requirements.every(r => r.isComplete);

  if (allComplete) {
    return (
      <div className={cn("rounded-2xl border border-emerald-100 bg-emerald-50 p-4", className)}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">¡Perfil Listo para Reservar!</h4>
            <p className="mt-1 text-xs text-emerald-700">
              Has completado todos los requisitos de identidad básica. Ya puedes enviar solicitudes de reserva.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-blue-100 bg-blue-50/50 p-5", className)}>
      <div className="mb-4 flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <h4 className="text-sm font-bold text-brand-navy">Para reservar necesitas:</h4>
          <p className="mt-1 text-xs text-gray-500">
            Completa estos pasos para habilitar las reservas en VeneStay.
          </p>
        </div>
      </div>

      <div className="space-y-3 pl-8">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-center gap-3">
            {req.isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-gray-300" />
            )}
            <span className={cn(
              "text-xs font-medium",
              req.isComplete ? "text-gray-400 line-through" : "text-gray-700"
            )}>
              {req.label}
            </span>
            {!req.isComplete && onNavigate && (
              <button
                onClick={() => onNavigate(req.section)}
                className="ml-auto text-[10px] font-bold text-brand-500 hover:text-brand-600"
              >
                Completar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
