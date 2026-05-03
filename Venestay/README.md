# VeneStay - Alquileres Vacacionales Premium en Venezuela

VeneStay es una plataforma moderna y sofisticada diseñada para transformar la experiencia de alquileres vacacionales en Venezuela. El sistema conecta a anfitriones de propiedades exclusivas con viajeros que buscan estancias seguras, verificadas y de alta calidad en los destinos más icónicos del país.

---

## 🚀 ¿Qué hace VeneStay?

La plataforma ofrece un ecosistema completo para la gestión de alquileres temporales, adaptado específicamente a las realidades financieras y logísticas del mercado venezolano.

### 🏠 Descubrimiento de Propiedades

- **Exploración Fluida**: Interfaz intuitiva con filtros por ciudades (Caracas, Margarita, Lechería, etc.) y categorías especiales (Pet-friendly).
- **Detalle de Propiedades**: Galería de imágenes en alta resolución, descripción detallada, amenidades interactivas y visualización en mapa (Google Maps).
- **Reseñas y Calificaciones**: Sistema de confianza basado en experiencias reales.

### 📅 Gestión de Reservas

- **Flujo de Reserva Directo**: Proceso simplificado para seleccionar fechas, número de huéspedes y confirmación instantánea de disponibilidad.
- **Estado en Tiempo Real**: Seguimiento detallado desde que se solicita la reserva hasta el checkout final.

### 💳 Sistema P2P de Pagos Dinámicos y Anticipos (Innovación Core)

- **Pago de Anticipo (20%)**: Para asegurar la estancia, el inquilino solo debe pagar un avance del 20% mediante nuestros canales validados. El 80% restante se liquida de manera directa con el anfitrión.
- **Checkout Multi-Moneda**: Integración del abono mediante **Zelle, Binance Pay y Pago Móvil**.
- **Conversión Automática (BCV)**: Cálculo en tiempo real del monto del anticipo en Bolívares basado en la tasa oficial.
- **Protección VeneStay "Skin in the game"**: Aseguramos las fechas sin arriesgar el importe entero, manteniendo la transaccionalidad sana.

### 💬 Comunicación Directa

- **Chat en Vivo**: Canal dedicado entre huésped y anfitrión para coordinar entregas de llaves y verificar pagos sin salir de la aplicación.

### 🛠️ Dashboard del Propietario (Anfitrión)

- **Gestión de Listings**: Herramientas para crear, editar y pausar anuncios con carga de imágenes optimizada.
- **Configuración de Pagos**: Panel para registrar datos bancarios de forma segura, visibles solo para huéspedes con reservas activas.
- **Administración de Reservas**: Control total sobre el calendario y la validación de pagos recibidos.

---

## 🏗️ Fase Actual: Pulido UX, Reglas Anti-Tampering & Optimización (v0.9.0)

Nos encontramos en la **fase de refinamiento final**. El sistema no solo es funcional, sino que ha sido optimizado para condiciones de uso reales en Venezuela (redes móviles y dispositivos de pulgar), sumando capas de ciberseguridad estrictas que aseguran la transaccionalidad.

### Hitos Recientes:

- **Optimización Móvil Total**: Modales full-screen, gestos de swiping en galerías y botones con áreas de contacto aumentadas (44px+) para una navegación sin fricciones.
- **Modelado Zero-Trust**: Se endurecieron las reglas de la BD en `firestore.rules`. Los perfiles limitan fuga de datos PII y se incorporaron candados relacionales y validación estricta de cambios (Ej: Cambios de huéspedes o fechas previas al pago).
- **UX de Transaccionalidad P2P**: Sistema "In-place" para confirmación de anticipo del 20%, con desglose financiero transparente al usuario.
- **Rendimiento Optimizada**: Implementación de **Skeleton Loaders** en Dashboard, Detalles y Checkout, reduciendo la percepción de espera en redes 4G/LTE.

### Próximos Pasos (Fase de Pulido):

- **Notificaciones Push**: Alertas inmediatas para nuevos mensajes y cambios de estado de reserva.
- **Optimización de Buscador**: Implementación de filtros avanzados por precio y número de habitaciones.
- **Estadísticas para Anfitriones**: Panel de ingresos y rendimiento de sus propiedades.

---

### 🛠️ Solución de Problemas Comunes

#### Google Maps (ApiTargetBlockedMapError)

Si el mapa no carga y ves este error, sigue estos pasos:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Asegúrate de tener habilitada la **"Maps JavaScript API"**.
3. Verifica que tu API Key en el Panel de Configuración de la App incluya este servicio.
4. Si tienes restricciones de Referrer, asegúrate de añadir el dominio de esta aplicación (ais-dev...).

#### Carga de Imágenes y Comprobantes

- **Modo de Prueba**: El sistema de almacenamiento (Firebase Storage) se encuentra actualmente en modo de prueba (lectura/escritura abierta temporalmente) para facilitar el testeo del flujo de reservas y fotos de propiedades.

---

## 🛠️ Tecnologías Principales

- **React 19 + TypeScript**: Robustez y velocidad en la interfaz.
- **Firebase**: Autenticación, Base de Datos en tiempo real y Almacenamiento.
- **Tailwind CSS**: Estética moderna y adaptabilidad móvil.
- **Gemini API**: Análisis inteligente de propiedades y soporte asistido.
- **Google Maps API**: Geocodificación y visualización espacial.

---

Desarrollado para elevar el estándar de hospedaje en Venezuela. 🇻🇪
