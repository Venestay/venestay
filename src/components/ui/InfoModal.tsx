import React from 'react';
import {
  X,
  ShieldCheck,
  Globe,
  Info,
  CreditCard,
  MessageSquare,
  Briefcase,
  Zap,
  CheckCircle2,
  StepForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type InfoKey =
  | 'zones'
  | 'investment'
  | 'blog'
  | 'p2p'
  | 'security'
  | 'support'
  | 'contact'
  | 'how_to_publish'
  | 'cancellation';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab: InfoKey;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, tab }) => {
  if (!isOpen) return null;

  const content: Record<
    InfoKey,
    { title: string; icon: React.ReactNode; body: React.ReactNode }
  > = {
    how_to_publish: {
      title: '¿Cómo publicar?',
      icon: <StepForward className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed font-medium">
            Publicar tu espacio en VeneStay es un proceso sencillo diseñado para
            garantizar la mejor experiencia tanto para anfitriones como para
            huéspedes.
          </p>

          <div className="space-y-4">
            <div className="hover:border-brand-200 flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all">
              <div className="bg-brand-navy flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <span className="text-brand-500 font-black">1</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-navy text-sm font-black uppercase">
                  Inicia Sesión / Regístrate
                </h4>
                <p className="text-xs leading-relaxed text-gray-500">
                  Crea tu cuenta de socio VeneStay utilizando tu correo
                  electrónico o tu cuenta de Google para comenzar.
                </p>
              </div>
            </div>

            <div className="hover:border-brand-200 flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all">
              <div className="bg-brand-navy flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <span className="text-brand-500 font-black">2</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-navy text-sm font-black uppercase">
                  Accede a "Publicar Espacio"
                </h4>
                <p className="text-xs leading-relaxed text-gray-500">
                  Haz clic en el botón superior "Publicar Espacio". Si eres un
                  nuevo socio, nuestro equipo validará tu perfil para habilitar
                  estas herramientas.
                </p>
              </div>
            </div>

            <div className="hover:border-brand-200 flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all">
              <div className="bg-brand-navy flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <span className="text-brand-500 font-black">3</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-navy text-sm font-black uppercase">
                  Completa los Detalles
                </h4>
                <p className="text-xs leading-relaxed text-gray-500">
                  Sube fotos de alta calidad, describe tu propiedad, establece
                  el precio por noche y especifica los servicios disponibles
                  (piscina, WiFi, planta eléctrica, etc.).
                </p>
              </div>
            </div>

            <div className="hover:border-brand-200 flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all">
              <div className="bg-brand-navy flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <span className="text-brand-500 font-black">4</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-brand-navy text-sm font-black uppercase">
                  Recibe Reservas Seguras
                </h4>
                <p className="text-xs leading-relaxed text-gray-500">
                  Una vez aprobado, tu espacio será visible para miles de
                  viajeros premium. Recibe pagos directos y seguros a través de
                  nuestro sistema integrado.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-brand-navy rounded-2xl p-4 text-center">
            <p className="text-brand-500 mb-1 text-xs font-black tracking-widest uppercase italic">
              VeneStay Host Guarantee
            </p>
            <p className="text-[10px] text-white/60">
              Soporte dedicado al anfitrión las 24 horas del día.
            </p>
          </div>
        </div>
      ),
    },
    zones: {
      title: 'Zonas Premium',
      icon: <Globe className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-4">
          <p>
            En VeneStay seleccionamos las ubicaciones más exclusivas y seguras
            de Venezuela para garantizar una experiencia de clase mundial.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-brand-navy mb-2 text-sm font-black uppercase">
                Lechería
              </h4>
              <p className="text-xs leading-relaxed font-medium text-gray-500">
                El Complejo Turístico El Morro y los Canales ofrecen lujo
                náutico y la mejor vida nocturna del oriente del país.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-brand-navy mb-2 text-sm font-black uppercase">
                Caracas (Este)
              </h4>
              <p className="text-xs leading-relaxed font-medium text-gray-500">
                Zonas como Altamira, Los Palos Grandes y La Castellana, con
                vistas al Ávila y cercanía a centros corporativos.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-brand-navy mb-2 text-sm font-black uppercase">
                Isla de Margarita
              </h4>
              <p className="text-xs leading-relaxed font-medium text-gray-500">
                Playa El Agua y Pampatar, combinando gastronomía de autor con
                resorts de playa de alto nivel.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-brand-navy mb-2 text-sm font-black uppercase">
                Los Roques
              </h4>
              <p className="text-xs leading-relaxed font-medium text-gray-500">
                El archipiélago virgen más exclusivo, con posadas de primera
                categoría y aguas cristalinas.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    investment: {
      title: 'Guía de Inversión',
      icon: <Briefcase className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-4">
          <p>
            Venezuela presenta una oportunidad única de inversión en bienes
            raíces turísticos con alta rentabilidad en divisas.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-sm font-medium">
                <span className="text-brand-navy font-black">
                  Rentabilidad:
                </span>{' '}
                Retornos anuales atractivos en alquileres de corta estancia.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-sm font-medium">
                <span className="text-brand-navy font-black">
                  Seguridad Patrimonial:
                </span>{' '}
                Propiedades con planta eléctrica, pozo de agua y seguridad
                privada que mantienen su valor.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-sm font-medium">
                <span className="text-brand-navy font-black">
                  Gestión VeneStay:
                </span>{' '}
                Nosotros nos encargamos de la curaduría y visibilidad para
                atraer al público P2P de Binance.
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    blog: {
      title: 'VeneStay Blog',
      icon: <Zap className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-6">
          <div className="flex space-x-4 border-b border-gray-100 pb-4">
            <div className="bg-brand-navy h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=150&q=80"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-brand-navy leading-tight font-black">
                5 Razones para usar USDT en tus viajes por Venezuela
              </h4>
              <p className="mt-1 text-xs text-gray-400">
                Publicado el 15 Abr 2024
              </p>
              <button className="text-brand-500 mt-2 text-[10px] font-black tracking-widest uppercase">
                Leer más
              </button>
            </div>
          </div>
          <div className="flex space-x-4 border-b border-gray-100 pb-4">
            <div className="bg-brand-navy h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=150&q=80"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-brand-navy leading-tight font-black">
                Margarita: La guía definitiva de posadas boutique
              </h4>
              <p className="mt-1 text-xs text-gray-400">
                Publicado el 10 Abr 2024
              </p>
              <button className="text-brand-500 mt-2 text-[10px] font-black tracking-widest uppercase">
                Leer más
              </button>
            </div>
          </div>
        </div>
      ),
    },
    p2p: {
      title: 'Ayuda P2P',
      icon: <CreditCard className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-4">
          <div className="bg-brand-50 border-brand-100 rounded-2xl border p-4">
            <h4 className="text-brand-navy mb-2 text-xs font-black uppercase">
              ¿Cómo funciona el pago directo?
            </h4>
            <p className="text-sm leading-relaxed font-medium text-gray-600">
              VeneStay facilita la conexión entre huéspedes y anfitriones. Al
              elegir USDT, utilizas la plataforma P2P (como Binance) para
              transferir fondos de manera segura.
            </p>
          </div>
          <p className="text-sm font-medium">Beneficios del sistema P2P:</p>
          <ul className="space-y-2 text-xs font-bold text-gray-500">
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-3 w-3 text-emerald-500" /> Sin
              comisiones bancarias locales.
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-3 w-3 text-emerald-500" />{' '}
              Protección contra la inflación diaria.
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="mr-2 h-3 w-3 text-emerald-500" />{' '}
              Confirmación instantánea en la blockchain.
            </li>
          </ul>
        </div>
      ),
    },
    security: {
      title: 'Seguridad Legal y Física',
      icon: <ShieldCheck className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-4">
          <p className="text-sm leading-loose font-medium">
            Tu tranquilidad es nuestra prioridad. VeneStay implementa un triple
            filtro de seguridad:
          </p>
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-100 p-3">
              <span className="text-brand-navy mb-1 block text-xs font-black">
                Verificación de Identidad
              </span>
              <p className="text-[10px] text-gray-400">
                Anfitriones y huéspedes deben validar su identidad oficial antes
                de cualquier transacción.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3">
              <span className="text-brand-navy mb-1 block text-xs font-black">
                Escrutinio de Propiedad
              </span>
              <p className="text-[10px] text-gray-400">
                Verificamos la operatividad de servicios básicos (luz/agua) en
                cada alojamiento premium.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3">
              <span className="text-brand-navy mb-1 block text-xs font-black">
                Protección de Datos
              </span>
              <p className="text-[10px] text-gray-400">
                Tus datos bancarios y personales nunca son expuestos a terceros.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    support: {
      title: 'Centro de Soporte 24/7',
      icon: <MessageSquare className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-6">
          <p className="text-sm font-medium">
            Nuestro equipo de conserjería digital está listo para ayudarte con:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button className="hover:bg-brand-50 group rounded-2xl bg-gray-50 p-4 text-left transition">
              <span className="text-brand-navy group-hover:text-brand-500 decoration-brand-500/20 block text-[10px] font-black underline">
                Pagos fallidos
              </span>
            </button>
            <button className="hover:bg-brand-50 group rounded-2xl bg-gray-50 p-4 text-left transition">
              <span className="text-brand-navy group-hover:text-brand-500 decoration-brand-500/20 block text-[10px] font-black underline">
                Cambio de fechas
              </span>
            </button>
            <button className="hover:bg-brand-50 group rounded-2xl bg-gray-50 p-4 text-left transition">
              <span className="text-brand-navy group-hover:text-brand-500 decoration-brand-500/20 block text-[10px] font-black underline">
                Reporte de daños
              </span>
            </button>
            <button className="hover:bg-brand-50 group rounded-2xl bg-gray-50 p-4 text-left transition">
              <span className="text-brand-navy group-hover:text-brand-500 decoration-brand-500/20 block text-[10px] font-black underline">
                Acceso a USDT
              </span>
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4 text-center">
            <p className="mb-2 text-xs font-bold text-gray-400">
              ¿Duda urgente?
            </p>
            <button className="bg-brand-navy rounded-xl px-6 py-2 text-[10px] font-black tracking-widest text-white uppercase">
              Abrir Ticket Chat
            </button>
          </div>
        </div>
      ),
    },
    contact: {
      title: 'Contacto Premium',
      icon: <Info className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-8">
          <div className="space-y-1">
            <h4 className="text-brand-500 text-[10px] font-black tracking-widest uppercase">
              Corporativo
            </h4>
            <p className="text-brand-navy text-xl font-black">
              VeneStay Luxury Accommodations LLC.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Correo Eléctrónico
              </span>
              <p className="text-brand-navy decoration-brand-500 text-sm font-bold underline underline-offset-4">
                premium@venestay.com
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Teléfono / WhatsApp
              </span>
              <p className="text-brand-navy text-sm font-bold">
                +58 212-VENE-STAY
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Sede Administrativa
              </span>
              <p className="text-brand-navy text-sm font-bold">
                Torre Financiera, Av. Francisco de Miranda, Caracas, Venezuela.
              </p>
            </div>
          </div>
          <div className="flex justify-center space-x-6 border-t border-gray-100 pt-4">
            <div className="text-center">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                <Globe className="text-brand-navy h-4 w-4" />
              </div>
              <span className="text-[8px] font-black uppercase">Web</span>
            </div>
            <div className="text-center">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                <Zap className="text-brand-navy h-4 w-4" />
              </div>
              <span className="text-[8px] font-black uppercase">Instant</span>
            </div>
          </div>
        </div>
      ),
    },
    cancellation: {
      title: 'Políticas de Cancelación (Reserva Protegida 20/80)',
      icon: <Info className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed font-medium">
            En VeneStay operamos bajo la <strong>Garantía de Reserva Protegida 20/80</strong>. Esto significa que nuestras políticas rigen exclusivamente sobre el <strong>depósito del 20%</strong> abonado hoy a la plataforma. El 80% restante lo abonas directamente a tu anfitrión al momento del check-in.
          </p>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h4 className="text-emerald-950 text-xs font-black uppercase">Cancelación Flexible</h4>
              </div>
              <p className="text-xs leading-relaxed text-emerald-800 font-bold">
                Reembolso completo del depósito del 20% si cancelas hasta <strong>48 horas antes</strong> del check-in. Posterior a este plazo, el depósito no es reembolsable.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <h4 className="text-amber-950 text-xs font-black uppercase">Cancelación Moderada</h4>
              </div>
              <p className="text-xs leading-relaxed text-amber-800 font-bold">
                Reembolso completo del depósito del 20% si cancelas hasta <strong>7 días antes</strong> de la fecha de llegada. Posterior a este plazo, el depósito no es reembolsable.
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <h4 className="text-red-950 text-xs font-black uppercase">Cancelación Estricta</h4>
              </div>
              <p className="text-xs leading-relaxed text-red-800 font-bold">
                Reembolso completo del depósito del 20% hasta <strong>30 días antes</strong> del check-in. Reembolso del 50% del depósito si cancelas entre <strong>30 y 14 días antes</strong>. Sin reembolso en los últimos 14 días.
              </p>
            </div>
          </div>

          <div className="bg-brand-navy rounded-2xl p-4 text-center">
            <p className="text-brand-500 mb-1 text-xs font-black tracking-widest uppercase italic select-none">
              Seguridad en tu Reserva
            </p>
            <p className="text-[10px] text-white/60">
              Todas las retenciones o reembolsos se gestionan de manera rápida mediante soporte de conserjería 24/7.
            </p>
          </div>
        </div>
      ),
    },
  };

  const activeContent = content[tab];

  return (
    <div className="bg-brand-navy/60 animate-fade-in fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md">
      <div className="animate-slide-up relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-8">
          <div className="flex items-center space-x-4">
            <div className="bg-brand-navy rounded-2xl p-3">
              {activeContent.icon}
            </div>
            <div>
              <h2 className="text-brand-navy text-2xl font-black tracking-tight">
                {activeContent.title}
              </h2>
              <p className="text-brand-500 mt-0.5 text-[10px] font-black tracking-[0.2em] uppercase">
                VeneStay Information Center
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-brand-50 text-brand-navy rounded-2xl bg-gray-50 p-3 transition-all hover:rotate-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar max-h-[60vh] overflow-y-auto p-8 leading-relaxed font-medium text-gray-600">
          {activeContent.body}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-8">
          <button
            onClick={onClose}
            className="bg-brand-navy w-full rounded-2xl py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;






