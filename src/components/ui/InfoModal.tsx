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
import { CONTACT_CONFIG } from '@/shared/config/contact';

export type InfoKey =
  | 'zones'
  | 'investment'
  | 'ucp'
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
                Caracas (Este) <span className="text-[10px] text-brand-500 ml-1">(Pronto)</span>
              </h4>
              <p className="text-xs leading-relaxed font-medium text-gray-500">
                Zonas como Altamira, Los Palos Grandes y La Castellana, con
                vistas al Ávila y cercanía a centros corporativos.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-brand-navy mb-2 text-sm font-black uppercase">
                Isla de Margarita <span className="text-[10px] text-brand-500 ml-1">(Pronto)</span>
              </h4>
              <p className="text-xs leading-relaxed font-medium text-gray-500">
                Playa El Agua y Pampatar, combinando gastronomía de autor con
                resorts de playa de alto nivel.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h4 className="text-brand-navy mb-2 text-sm font-black uppercase">
                Los Roques <span className="text-[10px] text-brand-500 ml-1">(Pronto)</span>
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
            raíces turísticos con alta rentabilidad, gestionada de forma segura a través de VeneStay.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-sm font-medium">
                <span className="text-brand-navy font-black">
                  Rentabilidad Superior:
                </span>{' '}
                Retornos atractivos mediante el alquiler de corta estancia de propiedades premium.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-sm font-medium">
                <span className="text-brand-navy font-black">
                  Gestión Segura:
                </span>{' '}
                Nosotros validamos a los huéspedes (KYC), filtramos las reservas y aseguramos el flujo de pago directo 20/80.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="text-sm font-medium">
                <span className="text-brand-navy font-black">
                  Control Total:
                </span>{' '}
                El anfitrión mantiene el control de su propiedad y recibe sus pagos directamente al momento del check-in.
              </span>
            </li>
          </ul>
        </div>
      ),
    },

    ucp: {
      title: 'UCP 20/80',
      icon: <CreditCard className="text-brand-500 h-8 w-8" />,
      body: (
        <div className="space-y-4">
          <div className="bg-brand-50 border-brand-100 rounded-2xl border p-4">
            <h4 className="text-brand-navy mb-2 text-xs font-black uppercase">
              ¿Cómo funciona el proceso 20/80?
            </h4>
            <p className="text-sm leading-relaxed font-medium text-gray-600">
              Para garantizar el compromiso y la seguridad de ambas partes, el pago se divide en dos fases:
            </p>
          </div>
          <ul className="space-y-3 text-sm font-medium text-gray-600">
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span>
                <strong className="text-brand-navy">20% para Reservar:</strong>{' '}
                El huésped abona el 20% del total a VeneStay para bloquear las fechas de forma garantizada.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <div className="bg-brand-500 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span>
                <strong className="text-brand-navy">80% al Check-in:</strong>{' '}
                El 80% restante se paga directamente al anfitrión de forma segura y presencial al momento de llegar a la propiedad.
              </span>
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
            Tu tranquilidad es nuestra prioridad. VeneStay protege tanto al huésped como al anfitrión:
          </p>
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-100 p-3">
              <span className="text-brand-navy mb-1 block text-xs font-black">
                Validación de Identidad (KYC)
              </span>
              <p className="text-[10px] text-gray-400">
                Todo huésped pasa por un sistema de verificación por fases antes de poder confirmar una reserva.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3">
              <span className="text-brand-navy mb-1 block text-xs font-black">
                Reserva Protegida 20/80
              </span>
              <p className="text-[10px] text-gray-400">
                El depósito inicial protege al anfitrión contra cancelaciones, y el pago final al check-in protege al huésped.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3">
              <span className="text-brand-navy mb-1 block text-xs font-black">
                Escrutinio de Propiedades
              </span>
              <p className="text-[10px] text-gray-400">
                Verificamos la operatividad y calidad de cada alojamiento premium antes de listarlo en nuestra plataforma.
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
                info@venestay.com
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Teléfono / WhatsApp
              </span>
              <p className="text-brand-navy text-sm font-bold">
                <a
                  href={CONTACT_CONFIG.whatsapp.support.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={CONTACT_CONFIG.whatsapp.support.ariaLabel}
                  data-analytics="footer_whatsapp_support"
                  className="hover:text-brand-500 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {CONTACT_CONFIG.whatsapp.support.display}
                </a>
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
        <div className="space-y-6" role="region" aria-labelledby="cancellation-policy-title">
          <p id="cancellation-policy-title" className="text-sm leading-relaxed font-medium">
            <strong>POLÍTICA OFICIAL: NO REEMBOLSABLE · REPROGRAMABLE</strong><br />
            <span className="text-gray-500">Vigente desde: {CONTACT_CONFIG.policy.effectiveDate}</span>
          </p>

          <div className="space-y-4 text-xs leading-relaxed text-gray-700">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-2">
              <h4 className="text-brand-navy font-black uppercase">─── RESERVA PROTEGIDA 20/80 ───────────────────────</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>Al confirmar una reserva, el 20% del monto total se retiene como depósito de reserva no reembolsable.</li>
                <li>El 80% restante se libera al anfitrión tras el check-in.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-2">
              <h4 className="text-brand-navy font-black uppercase">─── REPROGRAMACIÓN ────────────────────────────────</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>El huésped puede solicitar reprogramación hasta 7 días antes del check-in.</li>
                <li>La reprogramación requiere aprobación del anfitrión y disponibilidad en las nuevas fechas.</li>
                <li>Solo se permite una reprogramación por reserva.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-2">
              <h4 className="text-brand-navy font-black uppercase">─── CANCELACIÓN ───────────────────────────────────</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>Cancelaciones confirmadas: el depósito del 20% no es reembolsable bajo ninguna circunstancia.</li>
                <li>En caso de fuerza mayor documentada (desastre natural, emergencia médica certificada), el equipo de VeneStay evaluará cada caso de forma individual.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-2">
              <h4 className="text-brand-navy font-black uppercase">─── DISPUTAS ──────────────────────────────────────</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>El huésped dispone de 24 horas tras el check-in para reportar inconformidades al equipo de VeneStay.</li>
                <li>Pasado ese plazo, la reserva se considera completada satisfactoriamente.</li>
              </ul>
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
    <div className="bg-brand-navy/60 animate-fade-in fixed inset-0 z-70 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md">
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






