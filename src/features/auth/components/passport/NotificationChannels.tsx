/**
 * NotificationChannels — Sprint 3: VFX Premium
 *
 * Animaciones:
 * - Toggle switch con transición suave de la perilla y cambio de color del track.
 * - Hover del canal: elevación sutil con shadow y borde.
 * - Ícono con transición de color al activar.
 * - WCAG AA: role="switch" + aria-checked + focus visible.
 *
 * skill: frontend-design → hover states that surprise, micro-interactions
 */
import React from 'react';
import { MessageSquare, Mail, Bell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/features/auth/types';
import { NotificationPreferences } from '../../hooks/usePassportForm';

interface NotificationChannelsProps {
  profile: UserProfile | null;
  notifications: NotificationPreferences;
  toggleNotification: (channel: keyof NotificationPreferences) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const CHANNELS = [
  {
    id: 'whatsapp' as keyof NotificationPreferences,
    label: 'WhatsApp Directo',
    desc: 'Notificaciones de llaves y check-in.',
    icon: MessageSquare,
    accentColor: 'text-emerald-600',
    bgActive: 'bg-emerald-50',
  },
  {
    id: 'email' as keyof NotificationPreferences,
    label: 'Correo Electrónico',
    desc: 'Confirmaciones y facturación oficial.',
    icon: Mail,
    accentColor: 'text-blue-600',
    bgActive: 'bg-blue-50',
  },
  {
    id: 'push' as keyof NotificationPreferences,
    label: 'Alertas Instantáneas',
    desc: 'Nuevas propiedades en Lechería.',
    icon: Bell,
    accentColor: 'text-brand-500',
    bgActive: 'bg-brand-50',
  },
] as const;

export const NotificationChannels: React.FC<NotificationChannelsProps> = ({
  profile,
  notifications,
  toggleNotification,
  updateProfile,
}) => {
  const isPhoneVerified = profile?.isPhoneVerified;
  const isEmailVerified = profile?.isEmailVerified;

  const getVerified = (id: string) => {
    if (id === 'whatsapp') return isPhoneVerified;
    if (id === 'email') return isEmailVerified;
    return true;
  };

  return (
    <div className="py-12 md:py-16 space-y-10">
      <div>
        <h3 className="text-2xl font-black tracking-tight text-brand-navy">Canales VIP</h3>
        <p className="text-xs text-gray-600 mt-1 font-medium">Gestión de alertas en tiempo real.</p>
      </div>

      <div className="grid gap-3">
        {CHANNELS.map((channel) => {
          const isActive = notifications[channel.id];
          const isVerified = getVerified(channel.id);
          const Icon = channel.icon;

          return (
            <div
              key={channel.id}
              className={cn(
                'group flex items-center justify-between rounded-2xl border bg-white px-6 py-5',
                'transition-all duration-300 ease-out',
                isActive
                  ? 'border-gray-200 shadow-sm'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm',
              )}
            >
              {/* Ícono + Info */}
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300',
                    isActive
                      ? `${channel.bgActive} ${channel.accentColor} scale-110 shadow-sm`
                      : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-brand-navy">{channel.label}</p>
                    {isVerified && (
                      <Check
                        className="h-3 w-3 text-emerald-500"
                        aria-label="canal verificado"
                      />
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500">{channel.desc}</p>

                  {/* Enlace de verificación de WhatsApp */}
                  {channel.id === 'whatsapp' && !isVerified && (
                    <button
                      type="button"
                      onClick={() => updateProfile({ isPhoneVerified: true })}
                      className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 hover:underline focus:outline-none focus:underline"
                    >
                      Verificar Número
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle switch accesible */}
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                aria-label={`${isActive ? 'Desactivar' : 'Activar'} notificaciones de ${channel.label}`}
                onClick={() => toggleNotification(channel.id)}
                className={cn(
                  'relative h-6 w-11 shrink-0 cursor-pointer rounded-full',
                  'transition-colors duration-300 ease-in-out',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:ring-offset-2 focus:ring-offset-white',
                  isActive
                    ? 'bg-brand-500 shadow-lg shadow-brand-500/25'
                    : 'bg-gray-200 hover:bg-gray-300',
                )}
              >
                {/* Perilla */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute top-1 h-4 w-4 rounded-full bg-white shadow-md',
                    'transition-all duration-300 ease-in-out',
                    isActive ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
