import React from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  MessageCircle,
  Calendar,
  CreditCard,
  UserCheck,
  Cloud,
} from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
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
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Transparencia & Seguridad · Beta Lechería
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
            Política de <span className="text-brand-500">Privacidad</span> y Tratamiento de Datos
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto">
            En VeneStay protegemos tu tranquilidad. Operamos bajo el modelo de <strong className="text-white">Verificación Suave (Soft KYC)</strong> para que puedas reservar con máxima confianza, sin requisitos burocráticos ni invasivos.
          </p>
          <div className="mt-8 text-xs font-bold tracking-widest text-gray-400 uppercase">
            Última actualización: Julio de 2026 · Versión 2.3 (Lanzamiento Lechería)
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <div className="space-y-12">
          {/* Introducción */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black tracking-tight text-brand-navy mb-4">
              1. Nuestro Compromiso con tu Privacidad
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium">
              VeneStay S.A. (en adelante, &quot;VeneStay&quot;, &quot;nosotros&quot; o &quot;la Plataforma&quot;) es un marketplace P2P de alquileres vacacionales premium enfocado en Lechería, Estado Anzoátegui, Venezuela. Creemos firmemente que la seguridad comunitaria no debe estar reñida con el respeto a tu privacidad personal. Esta Política de Privacidad describe qué datos recopilamos durante nuestro lanzamiento, para qué los utilizamos y cómo garantizamos su protección de grado militar.
            </p>
          </section>

          {/* Los 6 Pilares exactos acordados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6">
                  <UserCheck className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black text-brand-navy tracking-tight mb-3">
                  2. Qué información solicitamos al registrarte
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  Para crear tu cuenta en VeneStay y acceder a reservas, únicamente te solicitamos tu información básica de contacto: <strong>Nombre completo para mostrar, Correo electrónico, Número de WhatsApp y Fecha de nacimiento</strong>. 
                </p>
                <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs font-semibold text-blue-900 leading-relaxed">
                  ✨ <strong>Modelo Soft KYC:</strong> En esta fase de lanzamiento, <strong>no requerimos la subida de fotografías de tu cédula, pasaporte físico ni reconocimiento facial o biométrico</strong>.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center mb-6">
                  <MessageCircle className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black text-brand-navy tracking-tight mb-3">
                  3. Para qué usamos tu WhatsApp y Correo
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  Tu número de WhatsApp se utiliza exclusivamente para enviarte tu código de verificación único (OTP) al registrarte o iniciar sesión —procesado a través de nuestro proveedor seguro de mensajería (Twilio)— y para notificarte alertas sobre tus solicitudes de reserva.
                </p>
                <div className="mt-4 p-3 bg-green-50/60 rounded-xl border border-green-100 text-xs font-semibold text-green-900 leading-relaxed">
                  🔒 Tu número nunca se expone públicamente en la plataforma ni se vende a terceros. Solo se comparte con el anfitrión confirmado para coordinar el check-in.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black text-brand-navy tracking-tight mb-3">
                  4. Por qué pedimos tu Fecha de Nacimiento
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  La fecha de nacimiento se solicita con la finalidad única y exclusiva de validar legalmente que eres mayor de edad (<strong>18 años o más</strong>), requisito obligatorio para contraer compromisos contractuales de alquiler turístico vacacional según las regulaciones vigentes.
                </p>
                <div className="mt-4 p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs font-semibold text-purple-900 leading-relaxed">
                  🛡️ Tu fecha de nacimiento exacta se almacena confidencialmente y jamás es visible para los anfitriones ni otros usuarios.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6">
                  <CreditCard className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black text-brand-navy tracking-tight mb-3">
                  5. Seguridad en Pagos y Comprobantes (20%/80%)
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  Al abonar el depósito de seguridad del 20% en la plataforma, procesamos tu comprobante de pago (referencias bancarias, Zelle o Pago Móvil) y verificamos la coincidencia del nombre bancario con tu perfil para prevenir fraudes pecuniarios y proteger al anfitrión.
                </p>
                <div className="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs font-semibold text-amber-900 leading-relaxed">
                  💳 Los datos bancarios y recibos adjuntos son revisados bajo estrictos protocolos de confidencialidad por administración para validar la transacción.
                </div>
              </div>
            </motion.div>
          </div>

          {/* Almacenamiento en la nube y Seguridad */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <Cloud className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-brand-navy">
                  6. Infraestructura de Grado Militar y Subencargados
                </h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                  Protección integral con Google Cloud & Firebase
                </p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed font-medium mb-4">
              Tus datos de cuenta y comprobantes residen en servidores de última generación bajo la infraestructura cloud de <strong>Google Firebase (Firestore y Cloud Storage)</strong>, protegidos mediante cifrado TLS en tránsito y cifrado en reposo.
            </p>
            <p className="text-gray-600 leading-relaxed font-medium">
              Trabajamos únicamente con subencargados certificados internacionalmente para el funcionamiento de la plataforma: <strong>Twilio Inc.</strong> para el servicio de verificación de mensajes de texto/WhatsApp OTP, y proveedores de infraestructura financiera para la verificación y conversión referencial de tasas de cambio. En ningún caso comercializamos, alquilamos ni transferimos tu información a anunciantes o bases de datos de mercadeo externas.
            </p>
          </section>

          {/* Derechos ARCO */}
          <section className="bg-brand-navy rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-brand-500 flex items-center justify-center shrink-0 border border-white/10">
                <Lock className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  7. Tus Derechos sobre tu Información (Derechos ARCO)
                </h2>
                <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mt-0.5">
                  Acceso, Rectificación, Cancelación y Oposición
                </p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed font-medium mb-6 relative z-10">
              Eres el único titular de tus datos personales en VeneStay. Puedes ejercer tus derechos en cualquier momento:
            </p>
            <ul className="space-y-4 text-sm font-medium text-gray-200 relative z-10">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-brand-navy flex items-center justify-center font-black text-xs shrink-0 mt-0.5">✓</span>
                <div>
                  <strong className="text-white block">Acceso y Rectificación:</strong> Puedes consultar, modificar tu biografía, cambiar tu preferencia de moneda o actualizar tu número telefónico directamente desde la sección <Link to="/mi-pasaporte" className="underline text-brand-500 hover:text-white transition-colors">Mi Pasaporte</Link>.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-brand-navy flex items-center justify-center font-black text-xs shrink-0 mt-0.5">✓</span>
                <div>
                  <strong className="text-white block">Cancelación y Derecho al Olvido:</strong> Si deseas cerrar y eliminar tu cuenta de VeneStay, puedes enviarnos una solicitud formal a <a href="mailto:info@venestay.com" className="underline text-brand-500 hover:text-white transition-colors">info@venestay.com</a>. Procederemos a desvincular e inactivar tus datos personales de la plataforma, conservando únicamente los historiales financieros contables que exigen las leyes tributarias y comerciales vigentes.
                </div>
              </li>
            </ul>
          </section>

          {/* Sección de Cookies */}
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black tracking-tight text-brand-navy mb-4">
              8. Uso de Cookies y Sesiones Técnicas
            </h2>
            <p className="text-gray-600 leading-relaxed font-medium">
              VeneStay no utiliza cookies publicitarias invasivas de rastreo de terceros. Empleamos cookies técnicas esenciales y almacenamiento local del navegador (`localStorage`) con el único fin de mantener tu sesión iniciada de manera segura vía Firebase Authentication, recordar tu preferencia de moneda (USD/VES) y conservar los borradores locales de publicación de propiedades sin que pierdas tu progreso (`useDraftSync`).
            </p>
          </section>

          {/* Contacto Legal */}
          <section className="bg-gray-100/80 rounded-3xl p-6 md:p-8 text-center border border-gray-200/60">
            <h3 className="text-lg font-black text-brand-navy mb-2">
              ¿Tienes dudas sobre nuestra Política de Datos?
            </h3>
            <p className="text-sm text-gray-600 font-medium max-w-xl mx-auto mb-6">
              Nuestro equipo legal y de atención al usuario de Lechería está disponible para responder cualquier inquietud sobre la protección de tu información.
            </p>
            <a
              href="mailto:info@venestay.com"
              className="inline-flex items-center justify-center bg-brand-navy hover:bg-brand-500 hover:text-brand-navy text-white font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95"
            >
              Escribir a Soporte Legal
            </a>
          </section>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-400">
          <p>© 2026 VeneStay S.A. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-6">
            <Link to="/terminos" className="hover:text-brand-navy transition-colors">
              Términos de Servicio
            </Link>
            <Link to="/privacidad" className="text-brand-navy font-black underline">
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

export default PrivacyPolicyPage;
