import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PassportFormErrors } from '../../hooks/usePassportForm';

interface PublicProfileProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  errors: PassportFormErrors;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({
  displayName,
  setDisplayName,
  bio,
  setBio,
  errors
}) => {
  return (
    <div className="py-12 md:py-16 space-y-10">
      <div>
        <h3 className="text-2xl font-black tracking-tight text-brand-navy">Perfil Público</h3>
        <p className="text-xs text-gray-600 mt-1 font-medium">Cómo te ven los demás miembros de la comunidad.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">Nombre de Pantalla</label>
          <div className="relative">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Carlos Zabala"
              className={cn(
                "w-full rounded-2xl border border-gray-200 bg-white p-5 text-sm font-medium text-brand-navy transition-all focus:border-brand-500 focus:outline-none focus:ring-0",
                errors.displayName && "border-red-500"
              )}
            />
            {errors.displayName && (
              <span className="mt-2 block text-[10px] font-bold text-red-500" role="alert">{errors.displayName}</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">Tu Biografía (Presentación)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Cuéntale al mundo quién eres..."
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-5 text-sm font-medium text-brand-navy transition-all placeholder:text-gray-300 focus:border-brand-500 focus:outline-none focus:ring-0"
          />
          <div className="flex items-start gap-2 text-gray-700 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
            <Info className="mt-0.5 h-3 w-3 text-brand-500" aria-hidden="true" />
            <p className="text-[10px] font-semibold leading-relaxed italic">
              Un perfil completo aumenta tu tasa de aceptación en un <span className="text-brand-navy font-black">40%</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
