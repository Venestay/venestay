# VeneStay - Alquileres Vacacionales Premium en Venezuela 🇻🇪

VeneStay es una plataforma moderna y sofisticada diseñada para transformar la experiencia de alquileres vacacionales en Venezuela. El sistema conecta a anfitriones de propiedades exclusivas con viajeros que buscan estancias seguras, verificadas y de alta calidad en los destinos más icónicos del país.

---

## 🚀 ¿Qué hace VeneStay?

La plataforma ofrece un ecosistema completo para la gestión de alquileres temporales, adaptado específicamente a las realidades financieras y logísticas del mercado venezolano.

### 🏠 Descubrimiento de Propiedades
- **Exploración Fluida**: Interfaz intuitiva con filtros por ciudades (Caracas, Margarita, Lechería, etc.) y categorías especiales.
- **Detalle de Propiedades**: Galería de imágenes en alta resolución, descripción detallada, amenidades interactivas y visualización en mapa (Google Maps).
- **Reseñas y Calificaciones**: Sistema de confianza basado en experiencias reales de la comunidad.

### 📅 Gestión de Reservas
- **Flujo Directo**: Proceso simplificado para seleccionar fechas, número de huéspedes y confirmación instantánea.
- **Estado en Tiempo Real**: Seguimiento detallado desde la solicitud de reserva hasta el checkout final.

### 💳 Sistema P2P de Pagos y Anticipos (Protocolo UCP)
- **Protocolo UCP (Universal Commerce Protocol)**: Transacciones estandarizadas y verificables para una seguridad total entre humanos e IA.
- **Anticipo del 20%**: Para asegurar la estancia, el inquilino solo paga un avance del 20% mediante canales validados. El 80% restante se liquida directamente con el anfitrión.
- **Checkout Multi-Moneda**: Integración de pagos mediante **Zelle, Binance Pay y Pago Móvil**.
- **Conversión BCV**: Cálculo automático del monto del anticipo en Bolívares basado en la tasa oficial del día.
- **Protección VeneStay**: Aseguramos la transaccionalidad sin arriesgar el importe total del viajero.

### 💬 Comunicación Directa
- **Chat en Vivo**: Canal dedicado entre huésped y anfitrión para coordinar detalles y verificar pagos sin salir de la plataforma.

---

## 🤖 Ecosistema de Inteligencia Agente

VeneStay opera mediante un equipo de **Agentes Especializados (Skills)** que aseguran que cada píxel y cada byte cumplan con el estándar premium:
- **Marketing Psychology**: Conversión optimizada mediante modelos mentales avanzados.
- **Behavioral Nudge Engine**: Reducción de carga cognitiva y guía fluida del usuario.
- **Trust & Identity Architect**: Seguridad Zero-Trust para la tranquilidad de anfitriones y huéspedes.
- **Reality Auditor**: Control de calidad implacable basado en evidencia visual inmutable.

---

## 🏗️ Fase Actual: Confianza, Identidad & Ecosistema de Anfitriones (v2.3.0)

Nos encontramos en la fase de **madurez funcional y optimización premium**. El sistema ha sido blindado para condiciones de uso reales en Venezuela (redes móviles y latencia variable), integrando una capa estricta de seguridad y lógica de negocio avanzada.

### Hitos Recientes:
- **Reserva Asíncrona & Soft-Block**: Lógica robusta de reservas con bloqueo suave de fechas en el lado del huésped para evitar el "double-booking" y optimizar la conversión.
- **Optimización de Checkout Pro (v2.2)**: Rediseño visual minimalista en desktop, soporte de pago expandido ("Otro" / PayPal), y reparación de layout de botones (VFX Fix).
- **Dashboard de Anfitrión Modular (Pro v2.3)**: Stepper UI completo para creación de alojamientos con validación Zod estricta para métodos de pago bancarios.
- **Sistema de Comisiones Host Loyalty (12/10/8%)**: Cálculo de rentabilidad escalonada centralizado en `commission.ts` para motivar el onboarding de anfitriones.
- **Pasaporte VeneStay v2.1**: Trust Score animado con efectos visuales premium (glow) y tarjeta VIP unificada.
- **Micro-interacciones y UI Adaptativa**: Panel de reserva colapsable mediante Drawer lateral, modal interactivo `ConfirmExitModal`, distintivos visuales de novedad ("Nuevo") y evolución de comodidades premium.
- **Gobernanza de Agentes (Tiered Memory)**: Arquitectura de memoria dividida en tres capas (`MEMORY_HOT.md`, `MEMORY_WARM.md`, `MEMORY_ARCHIVE/`) que incrementa la eficiencia de tokens y la precisión técnica en Spec-Driven Development.

### Próximos Pasos:
- **Panel de Verificación de Huéspedes (Guest Verification Dashboard)**: Implementación de la vista administrativa para anfitriones con el drawer interactivo `GuestRequestVerificationDrawer` para aprobar, rechazar y resolver conflictos de fechas de reservas pendientes en tiempo real.
- **Authenticator v2.0**: Rediseño completo del flujo de autenticación al estándar "Premium Dark" con validación robusta Zod y manejo de rutas protegidas.
- **PWA (Mobile Experience)**: Empaquetado offline para instalación móvil y mejora en la experiencia de aplicación nativa.

---

## 🛠️ Stack Tecnológico (State-of-the-art)

- **Frontend**: React 19 + TypeScript.
- **Arquitectura**: Feature-Sliced Design (FSD).
- **Estilos**: Tailwind CSS v4 + Motion (framer-motion).
- **Backend**: Firebase (Auth, Firestore, Storage).
- **AI**: Gemini API para análisis de contenido.
- **Mapas**: Google Maps API (Places, Geometry).

---

## 🔧 Solución de Problemas

### Google Maps (ApiProjectMapError)
Si el mapa no carga, verifica:
1. Que la **"Maps JavaScript API"** esté habilitada en Google Cloud Console.
2. Que la API Key incluya este servicio y no tenga restricciones de dominio incompatibles.

### Carga de Imágenes
- **CORS**: Si las imágenes fallan al subir, asegúrate de haber configurado el bucket de Storage con el archivo `cors.json` (ver `docs/TECHNICAL_DOC.md`).
- **Seguridad**: El acceso está restringido por `storage.rules`. Solo usuarios autenticados pueden subir contenido a sus respectivos directorios.

---

Desarrollado con pasión para elevar el estándar de hospedaje en Venezuela. 🇻🇪
