import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  Scale,
  Users,
  CheckCircle2,
} from 'lucide-react';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-500 selection:text-brand-navy">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <button
            onClick={() => navigate('/')}
            className="text-brand-navy hover:text-brand-500 flex items-center text-xs font-black tracking-widest uppercase transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
            aria-label="Volver a la página principal de VeneStay"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Volver a Explorar
          </button>
          <Link
            to="/"
            className="flex items-center space-x-2 focus:outline-hidden focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
            aria-label="VeneStay Inicio"
          >
            <div className="bg-brand-navy text-brand-500 flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black italic shadow-md">
              V
            </div>
            <span className="text-brand-navy text-lg font-black tracking-tighter">
              VeneStay
            </span>
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-brand-navy text-white py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true" />
        <div className="mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-black tracking-widest uppercase mb-6">
            <Scale className="w-4 h-4" aria-hidden="true" />
            Marco Legal · Contratación P2P
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
            Términos de <span className="text-brand-500">Servicio</span> y Uso
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto">
            Bienvenido a VeneStay. Al utilizar nuestra plataforma, aceptas operar bajo reglas claras de transparencia, respeto mutuo y nuestra política oficial unificada de cobros y cancelaciones en Lechería.
          </p>
          <div className="mt-8 text-xs font-bold tracking-widest text-gray-400 uppercase">
            Vigente desde: Julio de 2026 · Versión 2.3 (Beta Lechería)
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <div className="space-y-12">
          {/* 1. Naturaleza P2P de la Plataforma */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-brand-navy">
                  1. Naturaleza del Servicio y Rol P2P
                </h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                  Conectando huéspedes y anfitriones verificados
                </p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed font-medium mb-4">
              VeneStay actúa exclusivamente como una plataforma tecnológica de intermediación y comunidad P2P (Peer-to-Peer) que permite a propietarios o administradores de inmuebles vacacionales en Lechería (&quot;Anfitriones&quot;) publicar sus alojamientos para ser contratados por viajeros verificados (&quot;Huéspedes&quot;).
            </p>
            <p className="text-gray-600 leading-relaxed font-medium">
              VeneStay no es propietaria de los bienes inmuebles publicados ni actúa como arrendador directo. El contrato de alojamiento temporal se celebra directamente entre el Anfitrión y el Huésped en el momento en que se confirma la reserva en la plataforma.
            </p>
          </section>

          {/* 2. Política Unificada de Pago y Cancelación (20%/80%) */}
          <section className="bg-brand-navy rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-500 text-brand-navy flex items-center justify-center font-black shrink-0 shadow-lg">
                <DollarSign className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-brand-500/20 text-brand-500 font-black text-[10px] tracking-widest uppercase mb-1">
                  Cláusula Fundamental · UCP 20/80
                </span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  2. Política Única de Depósito (20%) y Saldo (80%)
                </h2>
              </div>
            </div>

            <div className="space-y-6 text-sm md:text-base font-medium text-gray-200 relative z-10">
              <p className="leading-relaxed">
                Todas las transacciones y reservas realizadas en VeneStay se rigen de forma automática y vinculante por nuestro protocolo financiero unificado de dos etapas (UCP 20%/80%):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-brand-500 font-black text-lg mb-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Etapa 1: Depósito en Plataforma (20%)</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    Al solicitar una reserva, el Huésped abona un depósito del <strong>20% del monto total</strong> a través de los canales oficiales de VeneStay. Este monto asegura las fechas en el calendario y formaliza el acuerdo entre ambas partes.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-brand-500 font-black text-lg mb-2">
                    <CalendarCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Etapa 2: Saldo Directo (80%)</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    El <strong>80% restante</strong> se liquida directamente entre el Huésped y el Anfitrión al momento del check-in, utilizando los métodos de pago pactados (Zelle, Pago Móvil, Efectivo, Binance o Transferencia).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-brand-500/15 border border-brand-500/30 rounded-2xl">
                <h4 className="text-brand-500 font-black text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  Política Oficial: No Reembolsable · Reprogramable
                </h4>
                <p className="text-xs text-gray-200 leading-relaxed">
                  El depósito de seguridad del <strong>20% es estrictamente NO REEMBOLSABLE</strong> en caso de cancelación unilateral por parte del Huésped. Sin embargo, en beneficio de la flexibilidad turística, el depósito es <strong>REPROGRAMABLE</strong> para futuras fechas en la misma propiedad, siempre y cuando se solicite con un mínimo de antelación y bajo mutuo acuerdo con el Anfitrión a través de nuestro chat oficial.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Requisitos del Pasaporte y Soft KYC */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black tracking-tight text-brand-navy mb-4">
              3. Pasaporte VeneStay y Verificación de Usuarios
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium mb-4">
              Para garantizar la seguridad de la comunidad y prevenir estafas, todos los usuarios aceptan someterse a nuestro proceso de verificación progresiva (*Soft KYC - Fases 1 y 2*). El usuario declara bajo protesta de decir verdad que:
            </p>
            <ul className="space-y-3 text-sm font-medium text-gray-600 list-disc pl-5">
              <li>Es mayor de edad (<strong>18 años cumplidos</strong>) con plena capacidad legal para contratar.</li>
              <li>El número de WhatsApp registrado y verificado mediante código OTP es de su titularidad legítima.</li>
              <li>El nombre del titular en las cuentas utilizadas para transferir el depósito del 20% coincide razonablemente con su identidad o cuenta con autorización expresa verificable (*Payment Name Matching*).</li>
            </ul>
          </section>

          {/* 4. Normas de Convivencia y Respeto al Inmueble */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black tracking-tight text-brand-navy mb-4">
              4. Normas de Convivencia y Uso de la Propiedad
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium mb-4">
              El Huésped se compromete a respetar las normas específicas indicadas por el Anfitrión en la ficha del alojamiento (capacidad máxima de personas, políticas de ruido, horarios de piscina, aceptación de mascotas y cuidado de mobiliario).
            </p>
            <p className="text-gray-600 leading-relaxed font-medium">
              Cualquier daño material negligente ocasionado al inmueble durante la estadía será responsabilidad directa del Huésped contratante. VeneStay intercederá en la mediación de disputas aportando los registros de comunicación y estado de la reserva.
            </p>
          </section>

          {/* 5. Modificaciones y Ley Aplicable */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black tracking-tight text-brand-navy mb-4">
              5. Ley Aplicable y Jurisdicción
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium">
              Estos Términos de Servicio se interpretarán y regirán de conformidad con las leyes mercantiles y civiles de la República Bolivariana de Venezuela. Cualquier controversia legal derivada del uso de la plataforma o la ejecución de reservas en Lechería se someterá a la jurisdicción de los tribunales competentes en el Municipio Diego Bautista Urbaneja, Estado Anzoátegui.
            </p>
          </section>

          {/* Contacto */}
          <section className="bg-gray-100/80 rounded-3xl p-6 md:p-8 text-center border border-gray-200/60">
            <h3 className="text-lg font-black text-brand-navy mb-2">
              ¿Deseas consultar un detalle contractual o comercial?
            </h3>
            <p className="text-sm text-gray-600 font-medium max-w-xl mx-auto mb-6">
              Estamos comprometidos con contratos claros y justos para potenciar el turismo en Lechería.
            </p>
            <Link
              to="/privacidad"
              className="inline-flex items-center justify-center bg-brand-navy hover:bg-brand-500 hover:text-brand-navy text-white font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95"
            >
              Consultar Política de Privacidad
            </Link>
          </section>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-400">
          <p>© 2026 VeneStay S.A. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-6">
            <Link to="/terminos" className="text-brand-navy font-black underline">
              Términos de Servicio
            </Link>
            <Link to="/privacidad" className="hover:text-brand-navy transition-colors">
              Privacidad
            </Link>
            <Link to="/" className="hover:text-brand-navy transition-colors">
              Inicio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
