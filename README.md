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

## 🏗️ Fase Actual: Agentic Intelligence & Optimization (v0.9.5)

Nos encontramos en la fase de **madurez funcional**. El sistema ha sido optimizado para condiciones de uso reales en Venezuela (redes móviles y latencia variable), incorporando capas de ciberseguridad estrictas.

### Hitos Recientes:
- **Arquitectura Robusta**: Migración completa a **Feature-Sliced Design (FSD)** para máxima escalabilidad y mantenibilidad.
- **Optimización Móvil Total**: Modales full-screen, gestos táctiles (swiping) y layouts adaptativos extremos.
- **Modelado Zero-Trust**: Reglas de base de datos endurecidas en Firestore y Storage, protegiendo datos sensibles (PII) y previniendo fugas relacionales.
- **UX de Transaccionalidad**: Sistema "In-place" para confirmación de pagos con "Tap-to-copy" y desgloses financieros transparentes.
- **Whimsy & Nudges**: Inyección de micro-interacciones de deleite y disparadores psicológicos para aumentar la retención.
- **Rendimiento**: Implementación de **Skeleton Loaders** para una experiencia fluida incluso en redes 4G/LTE.

### Próximos Pasos:
- **Notificaciones Push**: Alertas inmediatas para mensajes y cambios en el estado de reservas.
- **Buscador Avanzado**: Filtros granulares por precio, amenidades específicas y número de habitaciones.
- **Insights para Anfitriones**: Panel de estadísticas de ingresos y rendimiento de listings.

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
