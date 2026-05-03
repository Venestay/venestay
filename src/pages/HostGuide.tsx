import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ShieldCheck,
  UploadCloud,
  DollarSign,
  ChevronRight,
  Star,
  MapPin,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import AuthModal from '@/features/auth/components/AuthModal';

const steps = [
  {
    title: 'Registro Express',
    desc: 'Crea tu perfil en segundos. Solo necesitamos tu información básica para comenzar.',
    icon: <UserPlus className="h-8 w-8" />,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Validación de Calidad',
    desc: 'Nuestro equipo verifica la autenticidad de tu propiedad para mantener el estándar VeneStay.',
    icon: <ShieldCheck className="h-8 w-8" />,
    color: 'bg-brand-500/10 text-brand-500',
  },
  {
    title: 'Carga de Detalles',
    desc: 'Sube fotos profesionales y describe las mejores características de tu espacio.',
    icon: <UploadCloud className="h-8 w-8" />,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    title: 'Cobros sin Fricción',
    desc: 'Recibe tus pagos de forma segura en USDT o moneda local, garantizando liquidez inmediata.',
    icon: <DollarSign className="h-8 w-8" />,
    color: 'bg-green-500/10 text-green-500',
  },
];

const HostGuide: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleStartFlow = () => {
    if (user) {
      navigate('/admin/mis-propiedades');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Space */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="text-brand-navy hover:text-brand-500 flex items-center text-xs font-black tracking-widest uppercase transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Explorar
        </button>
        <div className="flex items-center space-x-2">
          <div className="bg-brand-navy text-brand-500 flex h-10 w-10 items-center justify-center rounded-xl text-xl font-black italic shadow-xl">
            V
          </div>
          <span className="text-brand-navy text-xl font-black tracking-tighter">
            VeneStay
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-brand-navy mb-8 text-5xl leading-none font-black tracking-tighter md:text-8xl">
            TU PROPIEDAD, <br /> UNA{' '}
            <span className="text-brand-500">INVERSIÓN</span> ELITE
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-xl font-medium text-gray-400 md:text-2xl">
            Únete a la red premium de anfitriones en Venezuela. Gestionamos la
            seguridad y los pagos para que tú solo te preocupes por la
            hospitalidad.
          </p>
          <button
            onClick={handleStartFlow}
            className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy animate-pulse-slow transform rounded-[32px] px-12 py-6 text-sm font-black tracking-[0.2em] text-white uppercase shadow-2xl transition-all active:scale-95"
          >
            Comenzar mi Anuncio
          </button>
        </motion.div>
      </section>

      {/* Steps Grid */}
      <section className="bg-gray-50 px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-[40px] border border-white bg-white p-10 shadow-xl shadow-gray-200/50"
              >
                <div
                  className={`h-16 w-16 ${step.color} mb-8 flex items-center justify-center rounded-2xl shadow-inner`}
                >
                  {step.icon}
                </div>
                <h3 className="text-brand-navy mb-4 text-2xl font-black tracking-tight">
                  {step.title}
                </h3>
                <p className="leading-relaxed font-medium text-gray-500">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspiration Preview */}
      <section className="overflow-hidden px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-20 lg:flex-row">
            <div className="lg:w-1/2">
              <div className="text-brand-500 mb-6 flex items-center space-x-2 text-xs font-black tracking-[0.4em] uppercase">
                <Sparkles className="fill-brand-500 h-4 w-4" />
                <span>Casos de Éxito</span>
              </div>
              <h2 className="text-brand-navy mb-8 text-4xl leading-tight font-black tracking-tighter md:text-6xl">
                EL ANUNCIO <br />{' '}
                <span className="text-brand-500 text-outline-gold">
                  ASPIRACIONAL
                </span>
              </h2>
              <p className="mb-10 text-lg leading-relaxed font-medium text-gray-500">
                Aprende qué hace que un anuncio sea irresistible. Títulos
                descriptivos, fotografía de alto impacto y transparencia en los
                servicios.
              </p>
              <ul className="mb-12 space-y-6">
                {[
                  'Títulos que evocan emociones',
                  'Fotos con luz natural',
                  'Reglas de casa claras',
                  'Precios competitivos',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="text-brand-navy flex items-center space-x-3 text-sm font-black tracking-widest uppercase"
                  >
                    <div className="bg-brand-500 h-2 w-2 rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative lg:w-1/2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative z-10 rounded-[48px] border-8 border-gray-50 bg-white p-6 shadow-2xl"
              >
                <div className="relative mb-6 h-80 overflow-hidden rounded-[32px]">
                  <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
                    className="h-full w-full object-cover"
                    alt="Success Case"
                  />
                  <div className="bg-brand-navy/90 absolute top-4 right-4 flex items-center rounded-xl border border-white/20 px-4 py-2 backdrop-blur-md">
                    <ShieldCheck className="text-brand-500 mr-2 h-4 w-4" />
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">
                      Premium
                    </span>
                  </div>
                </div>
                <div className="px-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-brand-navy text-2xl font-black tracking-tight">
                      Villa Mar Azul
                    </h3>
                    <div className="flex items-center space-x-1">
                      <Star className="text-brand-500 fill-brand-500 h-4 w-4" />
                      <span className="text-brand-navy font-black">5.0</span>
                    </div>
                  </div>
                  <div className="mb-4 flex items-center text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    <MapPin className="text-brand-500 mr-1 h-3 w-3" />
                    Lechería, Anzoátegui
                  </div>
                  <p className="mb-6 text-sm leading-relaxed font-medium text-gray-500 italic">
                    "Muelle privado, 4 habitaciones de lujo y vista infinita al
                    Caribe. El refugio perfecto."
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <div className="text-brand-navy text-2xl font-black">
                      $450{' '}
                      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                        / noche
                      </span>
                    </div>
                    <div className="bg-brand-navy text-brand-500 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase">
                      Reservado 12 veces
                    </div>
                  </div>
                </div>
              </motion.div>
              {/* Decorative Blur */}
              <div className="bg-brand-500/20 absolute -right-10 -bottom-10 -z-0 h-64 w-64 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-navy px-4 py-32 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-4xl leading-tight font-black tracking-tighter text-white md:text-6xl">
            ¿LISTO PARA <span className="text-brand-500">MONETIZAR</span> TU
            PROPIEDAD?
          </h2>
          <button
            onClick={handleStartFlow}
            className="group bg-brand-navy border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-brand-navy mx-auto flex transform items-center justify-center rounded-[32px] border-2 px-12 py-6 text-sm font-black tracking-[0.2em] uppercase shadow-2xl transition-all active:scale-95"
          >
            Empezar ahora
            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView="register"
      />
    </div>
  );
};

export default HostGuide;






