/**
 * PassportHeader — Sprint 3: VFX Premium
 *
 * Animaciones:
 * - Fade-slide-up al montar (CSS keyframe 'appear').
 * - Trust Score con counter animado (useCountUp) + barra de progreso fluida.
 * - Glow pulsante sobre la barra de Trust Score.
 * - Badge verificado/sin-verificar con micro-shimmer.
 * - Avatar con ring de color al hover.
 *
 * skill: frontend-design → staggered reveals, high-impact moments
 * AGENTS.md §5.1 — Componentes enfocados en presentación.
 */
import React, { useEffect, useState } from 'react';
import { User, Camera, ShieldCheck, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/features/auth/types';
import { useCountUp } from '../../hooks/usePassportAnimations';

interface PassportHeaderProps {
  profile: UserProfile | null;
  trustScore: number;
  isPreviewMode: boolean;
  setIsPreviewMode: (v: boolean) => void;
  isAvatarUploading?: boolean;
  onAvatarChange?: (file: File) => void;
  onRemoveAvatar?: () => Promise<void>;
  onGenerateQAProfile?: () => Promise<void>;
  isGeneratingQA?: boolean;
}

export const PassportHeader: React.FC<PassportHeaderProps> = ({
  profile,
  trustScore,
  isPreviewMode,
  setIsPreviewMode,
  isAvatarUploading,
  onAvatarChange,
  onRemoveAvatar,
  onGenerateQAProfile,
  isGeneratingQA,
}) => {
  const [mounted, setMounted] = useState(false);
  const animatedScore = useCountUp(trustScore, 1400, mounted);

  useEffect(() => {
    // Micro-delay para que el componente se pinte antes de disparar la animación
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[40px] bg-brand-navy p-10 text-white shadow-2xl shadow-brand-navy/30',
        'transition-all duration-700 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      {/* Orbes de fondo — profundidad y atmósfera */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-brand-500/6 blur-3xl animate-[pulse_8s_ease-in-out_2s_infinite]" />
      {/* Línea decorativa sutil en el borde superior */}
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="relative space-y-10">
        {/* ─── Cabecera: Título + Trust Score ─── */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-black tracking-tighter text-white">
                Tu Pasaporte VeneStay
              </h2>
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all duration-300',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:ring-offset-2 focus:ring-offset-brand-navy',
                  isPreviewMode
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
                )}
                aria-pressed={isPreviewMode}
              >
                {isPreviewMode ? 'Vista Edición' : 'Vista Pública'}
              </button>
              {onGenerateQAProfile && (
                <button
                  type="button"
                  onClick={onGenerateQAProfile}
                  disabled={isGeneratingQA}
                  className={cn(
                    'rounded-full border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500 hover:text-brand-navy px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 text-brand-500 font-bold',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:ring-offset-2 focus:ring-offset-brand-navy',
                    'disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-500/5 cursor-pointer'
                  )}
                >
                  <Sparkles className="h-3 w-3 animate-[pulse_2s_infinite]" />
                  {isGeneratingQA ? 'Generando...' : 'Generar 100% Score'}
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-gray-400">
              Nivel de confianza en el ecosistema exclusivo.
            </p>
          </div>

          {/* Trust Score — contador animado + barra de progreso */}
          <div className="w-full space-y-2 md:w-52">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">
                Trust Score
              </span>
              <span
                className="text-2xl font-black tabular-nums text-brand-500 transition-all"
                aria-live="polite"
                aria-atomic="true"
              >
                {animatedScore}
                <span className="text-sm">%</span>
              </span>
            </div>
            {/* Track */}
            <div
              role="progressbar"
              aria-valuenow={trustScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Trust Score: ${trustScore}%`}
              className="relative h-2 w-full overflow-hidden rounded-full bg-white/10"
            >
              {/* Fill con glow */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-all duration-1000 ease-out"
                style={{
                  width: mounted ? `${trustScore}%` : '0%',
                  boxShadow: '0 0 12px 2px rgba(197, 160, 89, 0.45)',
                }}
              />
              {/* Shimmer animado sobre el fill */}
              {mounted && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${trustScore}%`,
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s ease-in-out 1.2s 1 both',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── Identidad Visual ─── */}
        <div className="flex flex-col items-center gap-10 md:flex-row">
          {/* Avatar con ring animado al hover */}
          <div className="group/avatar relative shrink-0">
            <div
              className={cn(
                'relative h-36 w-36 overflow-hidden rounded-[32px] border-2 border-brand-500/30 bg-white/5',
                'transition-all duration-500 ease-out',
                'group-hover/avatar:border-brand-500 group-hover/avatar:shadow-[0_0_30px_rgba(197,160,89,0.25)]',
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              )}
              aria-label="Avatar del usuario"
            >
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'Avatar'}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover/avatar:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-14 w-14 text-white/10" />
                </div>
              )}

              {/* Overlay de carga */}
              {isAvatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/60 backdrop-blur-[2px]">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Input oculto */}
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onAvatarChange) onAvatarChange(file);
              }}
            />

            {/* Botón de cámara */}
            <label
              htmlFor="avatar-upload"
              className={cn(
                'absolute -bottom-2 -right-2 cursor-pointer rounded-2xl bg-brand-500 p-3 text-brand-navy shadow-xl',
                'transition-all duration-300 ease-out',
                'hover:scale-110 hover:shadow-[0_0_20px_rgba(197,160,89,0.5)] active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-brand-navy',
                isAvatarUploading && 'pointer-events-none opacity-50'
              )}
            >
              <Camera className="h-5 w-5" />
            </label>

            {/* Botón de eliminación (Solo si tiene foto y es admin/dueño autorizado) */}
            {profile?.photoURL && (profile.email === 'anfitrionvenesta@venestay.com' || profile.email === 'admin@venestay.com' || profile.role === 'admin') && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={isAvatarUploading}
                className={cn(
                  'absolute -left-2 -top-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white shadow-xl',
                  'transition-all duration-300 ease-out',
                  'hover:scale-110 hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-brand-navy',
                  isAvatarUploading && 'pointer-events-none opacity-50'
                )}
                title="Eliminar foto de perfil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Texto + Badge de verificación */}
          <div
            className={cn(
              'flex-grow space-y-4 text-center transition-all duration-700 delay-200 ease-out md:text-left',
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
            )}
          >
            {/* Badge verificado */}
            <div className="flex items-center justify-center gap-2 md:justify-start">
              {profile?.isIdentityVerified ? (
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 transition-all duration-300 hover:border-emerald-500/50">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    Verificado
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                    Sin Verificar
                  </span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                {profile?.role === 'host' ? 'Miembro Host VIP' : 'Miembro Preferente'}
              </h3>
              <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                Tu identidad digital garantiza el acceso a propiedades
                exclusivas y transacciones seguras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
