import React, { useState, useEffect } from 'react';
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

import { useUserProfile } from '../hooks/useUserProfile';
import VerificationModal from './VerificationModal';
import PaymentMethodModal from './PaymentMethodModal';

const ProfileSettings: React.FC = () => {
  const { profile, loading, saving, updateProfile } = useUserProfile();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Local form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [languages, setLanguages] = useState<string[]>(['Español']);
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    push: false
  });
  const [errors, setErrors] = useState<{ displayName?: string }>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);


  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setCurrency(profile.currency || 'USD');
      setSelectedInterests((profile.selectedInterests as Interest[]) || []);
      setLanguages(profile.languages || ['Español']);
      if (profile.notifications) {
        setNotifications(profile.notifications);
      }
    }
  }, [profile]);


  const allInterests: Interest[] = ['Playa', 'Mascotas', 'Trabajo', 'Lujo', 'Aventura', 'Ciudad'];

  const trustScore = profile?.trustScore || 0;

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleAddPaymentMethod = (newMethod: any) => {
    const currentMethods = profile?.paymentMethods || [];
    updateProfile({
      paymentMethods: [...currentMethods, newMethod]
    });
  };


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

    await updateProfile({
      displayName,
      bio,
      currency,
      selectedInterests: selectedInterests as any,
      languages,
      notifications
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white p-6 text-brand-navy md:p-12 selection:bg-brand-500/30">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Cabecera de Pasaporte VIP (Passport Cover) */}
        <div className="relative overflow-hidden rounded-[40px] bg-brand-navy p-10 text-white shadow-2xl shadow-brand-navy/20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
          
          <div className="relative space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black tracking-tighter text-white">Tu Pasaporte VeneStay</h2>
                  <button 
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                      isPreviewMode 
                        ? "bg-brand-500 text-white border-brand-500" 
                        : "border-white/20 text-gray-400 hover:text-white"
                    )}
                  >
                    {isPreviewMode ? 'Vista Edición' : 'Vista Pública'}
                  </button>
                </div>
                <p className="text-sm font-medium text-gray-400">Nivel de confianza en el ecosistema exclusivo.</p>
              </div>
              
              <div className="space-y-2 w-full md:w-48">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-500">
                  <span>Trust Score</span>
                  <span>{trustScore}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(197,160,89,0.4)]" 
                    style={{ width: `${trustScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sección de Identidad Visual dentro del Pasaporte */}
            <div className="flex flex-col items-center gap-10 md:flex-row">
              <div className="relative group/avatar">
                <div 
                  aria-label="Avatar del usuario"
                  className="h-36 w-36 overflow-hidden rounded-[40px] border-2 border-brand-500/30 bg-white/5 transition-all group-hover/avatar:border-brand-500"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-600">
                      <User className="h-14 w-14 opacity-20" />
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  className="absolute -right-2 -bottom-2 rounded-2xl bg-brand-500 p-3 text-brand-navy shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-grow space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  {profile?.isIdentityVerified ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="text-emerald-500 h-3.5 w-3.5" />
                      <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">Verificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <ShieldCheck className="text-gray-500 h-3.5 w-3.5" />
                      <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase">Sin Verificar</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    {profile?.role === 'host' ? 'Miembro Host VIP' : 'Miembro Preferente'}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400 max-w-sm font-medium">
                    Tu identidad digital garantiza el acceso a propiedades exclusivas y transacciones seguras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Sección 2: Preferencias Financieras */}
          <div className="py-12 md:py-16 space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-brand-navy">Motor Transaccional</h3>
                <p className="text-xs text-gray-600 mt-1 font-medium">Configura cómo interactúas con el modelo P2P 20/80.</p>
              </div>
              <Landmark className="text-brand-500 h-6 w-6 opacity-40" aria-hidden="true" />
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-600 uppercase">Preferencia de Moneda</label>
                <div 
                  role="radiogroup" 
                  aria-label="Moneda de visualización"
                  className="flex gap-2 rounded-2xl bg-gray-50 p-1.5 border border-gray-200"
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
                          ? "bg-brand-500 text-white shadow-lg" 
                          : "text-gray-500 hover:bg-white hover:text-brand-navy"
                      )}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">Métodos de Pago VIP</label>
                <div className="space-y-3" role="list">
                  {profile?.paymentMethods && profile.paymentMethods.length > 0 ? (
                    profile.paymentMethods.map((method: any) => (
                      <div 
                        key={method.id} 
                        role="listitem"
                        className="flex items-center justify-between rounded-2xl bg-white border border-gray-200 px-5 py-4 hover:border-brand-500/30 hover:bg-gray-50 transition-all cursor-pointer group focus-within:ring-1 focus-within:ring-brand-500 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-gray-100 p-2">
                            {method.type === 'Zelle' && <Globe className="h-4 w-4 text-purple-700" />}
                            {method.type === 'Binance' && <Sparkles className="h-4 w-4 text-yellow-700" />}
                            {method.type === 'PagoMovil' && <Landmark className="h-4 w-4 text-emerald-700" />}
                          </div>
                          <span className="text-xs font-bold text-brand-navy">{method.label}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-500 font-bold italic py-2">No has vinculado métodos de pago aún.</p>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full rounded-2xl border-2 border-dashed border-gray-200 py-4 text-[10px] font-black tracking-[0.2em] text-brand-500 uppercase hover:border-brand-500/50 hover:bg-brand-50/50 transition-all focus:ring-1 focus:ring-brand-500"
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
                    <p className="text-xs text-gray-600 font-medium">Cédula o Pasaporte vigente</p>
                  </div>
                </div>
                {profile?.isIdentityVerified ? (
                  <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <Check className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Validado</span>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="rounded-xl border-2 border-brand-500/30 text-brand-500 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-500 hover:text-white transition-all focus:ring-1 focus:ring-brand-500"
                  >
                    Verificar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <VerificationModal
            isOpen={isVerificationModalOpen}
            onClose={() => setIsVerificationModalOpen(false)}
            userId={profile?.uid || ''}
            onVerified={() => updateProfile({ isIdentityVerified: true })}
          />

          <PaymentMethodModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onAdd={handleAddPaymentMethod}
          />

          {/* Sección 4: Sobre Ti */}
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

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center rounded-2xl bg-brand-navy py-5 text-xs font-black tracking-[0.4em] text-brand-500 uppercase border border-brand-500/30 transition-all hover:bg-brand-navy/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-xl shadow-brand-navy/20"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Actualizar Pasaporte'
              )}
            </button>
          </div>

          {/* Sección 5: ADN de Viajero */}
          <div className="py-12 md:py-16 space-y-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-brand-navy">ADN de Viajero</h3>
              <p className="text-xs text-gray-600 mt-1 font-medium">Filtra el ecosistema según tu estilo de vida.</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">Tus Intereses VIP</label>
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
                          ? "bg-brand-500 border-brand-500 text-white scale-105 shadow-xl"
                          : "bg-white border-gray-200 text-gray-500 hover:border-brand-500/50 hover:text-brand-navy"
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">Idiomas de Preferencia</label>
                <div className="flex gap-3">
                  {['Español', 'Inglés'].map((lang) => (
                    <button 
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLanguages(prev => 
                          prev.includes(lang) 
                            ? prev.filter(l => l !== lang) 
                            : [...prev, lang]
                        );
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-between rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                        languages.includes(lang) && "border-brand-500 bg-brand-50 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-all",
                          languages.includes(lang) && "bg-brand-500 text-white"
                        )}>
                          <Languages className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "text-xs font-black transition-colors",
                          languages.includes(lang) ? "text-brand-navy" : "text-gray-500"
                        )}>{lang}</span>
                      </div>
                      {languages.includes(lang) && <Check className="h-3 w-3 text-brand-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sección 6: Canales de Notificación */}
          <div className="py-12 md:py-16 space-y-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-brand-navy">Canales VIP</h3>
              <p className="text-xs text-gray-600 mt-1 font-medium">Gestión de alertas en tiempo real.</p>
            </div>

            <div className="grid gap-4">
              {[
                { id: 'whatsapp', label: 'WhatsApp Directo', icon: MessageSquare, desc: 'Notificaciones de llaves y check-in.', isVerified: profile?.isPhoneVerified },
                { id: 'email', label: 'Correo Electrónico', icon: Mail, desc: 'Confirmaciones y facturación oficial.', isVerified: profile?.isEmailVerified },
                { id: 'push', label: 'Alertas Instantáneas', icon: Bell, desc: 'Nuevas propiedades en Lechería.', isVerified: true },
              ].map((channel) => (
                <div 
                  key={channel.id} 
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-6 hover:border-gray-200 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-all duration-500">
                      <channel.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-brand-navy group-hover:text-black transition-colors">{channel.label}</p>
                        {channel.isVerified && <Check className="h-3 w-3 text-emerald-600" />}
                      </div>
                      <p className="text-[10px] font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">{channel.desc}</p>
                      {channel.id === 'whatsapp' && !channel.isVerified && (
                        <button 
                          type="button"
                          onClick={() => updateProfile({ isPhoneVerified: true })}
                          className="mt-1 text-[9px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 hover:underline"
                        >
                          Verificar Número
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[channel.id as keyof typeof notifications]}
                    onClick={() => setNotifications(prev => ({ ...prev, [channel.id]: !prev[channel.id as keyof typeof prev] }))}
                    className={cn(
                      "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-white",
                      notifications[channel.id as keyof typeof notifications] 
                        ? "bg-brand-500 shadow-lg shadow-brand-500/20" 
                        : "bg-gray-200"
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
