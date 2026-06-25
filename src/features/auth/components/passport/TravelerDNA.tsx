/**
 * TravelerDNA — Sprint 3: VFX Premium
 *
 * Animaciones:
 * - Intereses: scale + shadow al seleccionar (transform 3D sutil).
 * - Idiomas: Transición de color e ícono con delay.
 * - Ripple CSS en click de interest chip.
 * - Focus rings WCAG AA (4.5:1 ratio mínimo).
 *
 * skill: frontend-design → micro-interacciones, hover states that surprise
 */
import React from 'react';
import { Languages, Check, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TravelInterest } from '@/features/auth/types';

interface TravelerDNAProps {
  allInterests: TravelInterest[];
  selectedInterests: TravelInterest[];
  toggleInterest: (interest: TravelInterest) => void;
  languages: string[];
  toggleLanguage: (lang: string) => void;
  birthDate: string;
  setBirthDate: (val: string) => void;
}

export const TravelerDNA: React.FC<TravelerDNAProps> = ({
  allInterests,
  selectedInterests,
  toggleInterest,
  languages,
  toggleLanguage,
  birthDate,
  setBirthDate,
}) => {
  const maxDate = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }, []);
  return (
    <div className="py-12 md:py-16 space-y-10">
      <div>
        <h3 className="text-2xl font-black tracking-tight text-brand-navy">ADN de Viajero</h3>
        <p className="text-xs text-gray-600 mt-1 font-medium">Filtra el ecosistema según tu estilo de vida.</p>
      </div>

      <div className="space-y-8">
        {/* ─── Fecha de nacimiento ─── */}
        <div className="space-y-4">
          <label htmlFor="birthDateInput" className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-brand-500" />
            Fecha de Nacimiento (Requerido para reservar)
          </label>
          <div className="relative max-w-sm">
            <input
              id="birthDateInput"
              type="date"
              max={maxDate}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-3.5 text-xs font-bold text-brand-navy shadow-sm transition-all duration-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60 hover:border-brand-300"
            />
          </div>
        </div>

        {/* ─── Intereses ─── */}
        <div className="space-y-4">
          <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">
            Tus Intereses VIP
          </label>
          <div
            className="flex flex-wrap gap-3"
            role="group"
            aria-label="Intereses de viaje"
          >
            {allInterests.map((interest, i) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleInterest(interest)}
                  style={{ animationDelay: `${i * 35}ms` }}
                  className={cn(
                    // Base
                    'relative overflow-hidden rounded-xl border px-6 py-3 text-[10px] font-black tracking-widest uppercase',
                    // Transición
                    'transition-all duration-300 ease-out',
                    // Focus — WCAG AA
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
                    // Estado activo
                    isSelected
                      ? [
                          'bg-brand-500 border-brand-500 text-white',
                          'scale-105 shadow-xl shadow-brand-500/25',
                          'hover:bg-brand-600 hover:border-brand-600',
                          'active:scale-100',
                        ]
                      : [
                          'bg-white border-gray-200 text-gray-600',
                          'hover:border-brand-500/40 hover:text-brand-navy hover:shadow-sm',
                          'hover:scale-[1.03]',
                          'active:scale-[0.97]',
                        ]
                  )}
                >
                  {/* Ripple decorativo al seleccionar */}
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl bg-white/15 opacity-0 transition-opacity duration-700"
                    />
                  )}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Idiomas ─── */}
        <div className="space-y-4">
          <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">
            Idiomas de Preferencia
          </label>
          <div className="flex gap-3">
            {['Español', 'Inglés'].map((lang) => {
              const isActive = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  aria-pressed={isActive}
                  className={cn(
                    'group flex-1 flex items-center justify-between rounded-2xl border-2 bg-white px-6 py-4',
                    'transition-all duration-300 ease-out',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:ring-offset-2',
                    isActive
                      ? 'border-brand-500 bg-brand-50/70 shadow-md shadow-brand-500/10'
                      : 'border-gray-200 hover:border-brand-300/50 hover:bg-gray-50/80 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Ícono con transición de fondo */}
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-brand-500 text-white shadow-sm scale-110'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200',
                      )}
                    >
                      <Languages className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-black transition-colors duration-300',
                        isActive ? 'text-brand-navy' : 'text-gray-500 group-hover:text-gray-700',
                      )}
                    >
                      {lang}
                    </span>
                  </div>
                  {/* Check con fade-in */}
                  <div
                    className={cn(
                      'transition-all duration-300',
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                    )}
                    aria-hidden={!isActive}
                  >
                    <Check className="h-3.5 w-3.5 text-brand-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
