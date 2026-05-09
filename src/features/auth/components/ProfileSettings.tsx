import React, { useState } from 'react';
import { User, Camera, ShieldCheck, Mail, Info, Loader2, Globe, CreditCard, Landmark, Smartphone, Sparkles, ChevronRight, Check, Bell, MessageSquare, Heart, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Currency = 'USD' | 'VES';
type PaymentType = 'Zelle' | 'Binance' | 'PagoMovil';
type Interest = 'Playa' | 'Mascotas' | 'Trabajo' | 'Lujo' | 'Aventura' | 'Ciudad';

interface SavedPaymentMethod {
  id: string;
  type: PaymentType;
  label: string;
  lastUsed?: boolean;
}

const ProfileSettings: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(['Playa', 'Lujo']);
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    push: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string }>({});

  const allInterests: Interest[] = ['Playa', 'Mascotas', 'Trabajo', 'Lujo', 'Aventura', 'Ciudad'];

  // Cálculo de Confianza Dinámico (Trust Architect Strategy)
  const calculateTrustScore = () => {
    let score = 20; // Base por tener correo
    if (displayName.length >= 3) score += 20;
    if (bio.length >= 10) score += 20;
    if (selectedInterests.length >= 2) score += 20;
    if (notifications.whatsapp) score += 20;
    return score;
  };

  const trustScore = calculateTrustScore();

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const [savedMethods] = useState<SavedPaymentMethod[]>([
    { id: '1', type: 'Zelle', label: 'zala***@gmail.com', lastUsed: true },
    { id: '2', type: 'Binance', label: 'ID: 582***92' },
  ]);

  const validate = () => {
    const newErrors: { displayName?: string } = {};
    if (displayName.length > 0 && displayName.length < 3) {
      newErrors.displayName = 'Tu nombre público debe ser descriptivo (min. 3 caracteres)';
    }
    if (displayName.length > 50) {
      newErrors.displayName = 'El nombre es demasiado largo';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Revisa los campos marcados en rojo');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Sincronizando Pasaporte:', { displayName, bio, currency, selectedInterests, notifications });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Pasaporte VeneStay sincronizado con éxito');
    } catch (error) {
      toast.error('Fallo en la sincronización de confianza');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy p-6 text-white md:p-12 selection:bg-brand-500/30">
      <div className="mx-auto max-w-2xl space-y-2">
        {/* Header con Indicador de Confianza (Trust Architect) */}
        <div className="pb-10 md:pb-12 border-b border-gray-100/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter">Tu Pasaporte VeneStay</h2>
            <p className="text-sm font-medium text-gray-400">Nivel de confianza en el ecosistema exclusivo.</p>
          </div>
          
          <div className="space-y-2 w-full md:w-48">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-500">
              <span>Nivel de Confianza</span>
              <span>{trustScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(197,160,89,0.5)]" 
                style={{ width: `${trustScore}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-gray-100/10">
          {/* Sección 1: Identidad Visual - Minimalista */}
          <div className="group relative py-12 md:py-16">
            <div className="flex flex-col items-center gap-10 md:flex-row">
              <div className="relative">
                <div 
                  aria-label="Avatar del usuario"
                  className="h-36 w-36 overflow-hidden rounded-[40px] border-2 border-gray-100/20 bg-white/5 transition-all group-hover:border-brand-500/50"
                >
                  <div className="flex h-full w-full items-center justify-center text-gray-600">
                    <User className="h-14 w-14 opacity-20" />
                  </div>
                </div>
                <button 
                  type="button"
                  aria-label="Cambiar foto de perfil"
                  className="absolute -right-2 -bottom-2 rounded-2xl bg-brand-500 p-3 text-brand-navy transition-transform hover:scale-110 active:scale-95 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-navy"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-grow space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <ShieldCheck className="text-brand-500 h-5 w-5" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-brand-500 uppercase">Perfil Verificado</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Estatus: Miembro Preferente</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500 max-w-sm">
                    Has completado el <span className="text-white">{trustScore}%</span> de tu validación de identidad. 
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Preferencias Financieras */}
          <div className="py-12 md:py-16 space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Motor Transaccional</h3>
                <p className="text-xs text-gray-500 mt-1">Configura cómo interactúas con el modelo P2P 20/80.</p>
              </div>
              <Landmark className="text-brand-500 h-6 w-6 opacity-20" aria-hidden="true" />
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Preferencia de Moneda</label>
                <div 
                  role="radiogroup" 
                  aria-label="Moneda de visualización"
                  className="flex gap-2 rounded-2xl bg-white/5 p-1.5 border border-gray-100/5"
                >
                  {(['USD', 'VES'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      role="radio"
                      aria-checked={currency === curr}
                      onClick={() => setCurrency(curr)}
                      className={cn(
                        "flex-1 rounded-xl py-3 text-xs font-black tracking-widest transition-all focus:outline-none focus:ring-1 focus:ring-brand-500",
                        currency === curr 
                          ? "bg-brand-500 text-brand-navy" 
                          : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                      )}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Métodos de Pago VIP</label>
                <div className="space-y-3" role="list">
                  {savedMethods.map((method) => (
                    <div 
                      key={method.id} 
                      role="listitem"
                      className="flex items-center justify-between rounded-2xl bg-white/5 border border-gray-100/5 px-5 py-4 hover:bg-white/10 transition-all cursor-pointer group focus-within:ring-1 focus-within:ring-brand-500"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/5 p-2">
                          {method.type === 'Zelle' && <Globe className="h-4 w-4 text-purple-400" />}
                          {method.type === 'Binance' && <Sparkles className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <span className="text-xs font-bold text-gray-300">{method.label}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-700 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="w-full rounded-2xl border border-dashed border-gray-100/10 py-4 text-[10px] font-black tracking-[0.2em] text-brand-500 uppercase hover:bg-brand-500/5 transition-all focus:ring-1 focus:ring-brand-500"
                  >
                    + Vincular Nuevo Método
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Seguridad de Cuenta */}
          <div className="py-12 md:py-16 space-y-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight">Seguridad y Respaldo</h3>
              <p className="text-xs text-gray-500 mt-1">Tu identidad está protegida bajo estándares de cifrado bancario.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-gray-100/5 bg-white/5 px-6 py-5">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-500/10 text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Correo Electrónico</p>
                    <p className="text-xs text-gray-500">carlos***@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <Check className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Verificado</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-100/5 bg-white/5 px-6 py-5 group transition-all hover:border-brand-500/20">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 group-hover:scale-110 transition-transform">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Identidad (KYC)</p>
                    <p className="text-xs text-gray-500">Cédula o Pasaporte vigente</p>
                  </div>
                </div>
                <button type="button" className="rounded-xl border border-brand-500/30 text-brand-500 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-500 hover:text-brand-navy transition-all focus:ring-1 focus:ring-brand-500">
                  Verificar
                </button>
              </div>
            </div>
          </div>

          {/* Sección 4: Sobre Ti */}
          <div className="py-12 md:py-16 space-y-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight">Perfil Público</h3>
              <p className="text-xs text-gray-500 mt-1">Cómo te ven los demás miembros de la comunidad.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Nombre de Pantalla</label>
                <div className="relative">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Carlos Zabala"
                    className={cn(
                      "w-full rounded-2xl border border-gray-100/10 bg-white/5 p-5 text-sm font-medium transition-all focus:border-brand-500 focus:outline-none focus:ring-0",
                      errors.displayName && "border-red-500/50"
                    )}
                  />
                  {errors.displayName && (
                    <span className="mt-2 block text-[10px] font-bold text-red-400" role="alert">{errors.displayName}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Tu Biografía (Presentación)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Cuéntale al mundo quién eres..."
                  className="w-full resize-none rounded-2xl border border-gray-100/10 bg-white/5 p-5 text-sm font-medium transition-all focus:border-brand-500 focus:outline-none focus:ring-0"
                />
                <div className="flex items-start gap-2 text-gray-500 bg-white/5 p-4 rounded-xl border border-dashed border-gray-100/10">
                  <Info className="mt-0.5 h-3 w-3 text-brand-500" aria-hidden="true" />
                  <p className="text-[10px] font-medium leading-relaxed italic">
                    Un perfil completo aumenta tu tasa de aceptación en un <span className="text-brand-500 font-bold">40%</span>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-2xl bg-brand-500 py-5 text-xs font-black tracking-[0.3em] text-brand-navy uppercase transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-navy"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Sincronizando Confianza...
                </>
              ) : (
                'Actualizar Pasaporte'
              )}
            </button>
          </div>

          {/* Sección 5: ADN de Viajero */}
          <div className="py-12 md:py-16 space-y-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight">ADN de Viajero</h3>
              <p className="text-xs text-gray-500 mt-1">Filtra el ecosistema según tu estilo de vida.</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Tus Intereses VIP</label>
                <div className="flex flex-wrap gap-3" role="group" aria-label="Intereses de viaje">
                  {allInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={selectedInterests.includes(interest)}
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        "rounded-xl border px-6 py-3 text-[10px] font-black tracking-widest uppercase transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-brand-500",
                        selectedInterests.includes(interest)
                          ? "bg-brand-500 border-brand-500 text-brand-navy scale-105 shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                          : "bg-white/5 border-gray-100/10 text-gray-500 hover:border-brand-500/30 hover:text-gray-300 hover:scale-[1.02]"
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Idiomas de Preferencia</label>
                <button 
                  type="button"
                  className="group w-full flex items-center justify-between rounded-2xl border border-gray-100/5 bg-white/5 px-6 py-6 hover:bg-white/10 hover:border-brand-500/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-all duration-500">
                      <Languages className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black group-hover:text-white transition-colors text-left">Español e Inglés</p>
                      <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400 transition-colors text-left">Configuración de comunicación global.</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-700 group-hover:translate-x-1 group-hover:text-brand-500 transition-all" />
                </button>
              </div>
            </div>
          </div>

          {/* Sección 6: Canales de Notificación */}
          <div className="py-12 md:py-16 space-y-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight">Canales VIP</h3>
              <p className="text-xs text-gray-500 mt-1">Gestión de alertas en tiempo real.</p>
            </div>

            <div className="grid gap-4">
              {[
                { id: 'whatsapp', label: 'WhatsApp Directo', icon: MessageSquare, desc: 'Notificaciones de llaves y check-in.' },
                { id: 'email', label: 'Correo Electrónico', icon: Mail, desc: 'Confirmaciones y facturación oficial.' },
                { id: 'push', label: 'Alertas Instantáneas', icon: Bell, desc: 'Nuevas propiedades en Lechería.' },
              ].map((channel) => (
                <div 
                  key={channel.id} 
                  className="flex items-center justify-between rounded-2xl border border-gray-100/5 bg-white/5 px-6 py-6 hover:border-gray-100/10 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-all duration-500">
                      <channel.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black group-hover:text-white transition-colors">{channel.label}</p>
                      <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400 transition-colors">{channel.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[channel.id as keyof typeof notifications]}
                    onClick={() => setNotifications(prev => ({ ...prev, [channel.id]: !prev[channel.id as keyof typeof prev] }))}
                    className={cn(
                      "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-brand-navy",
                      notifications[channel.id as keyof typeof notifications] 
                        ? "bg-brand-500 shadow-[0_0_12px_rgba(197,160,89,0.4)]" 
                        : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        notifications[channel.id as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
