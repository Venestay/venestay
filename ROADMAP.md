# VeneStay - Roadmap Evolutivo 🗺️

Este documento define la visión a largo plazo y las fases de desarrollo del proyecto VeneStay, asegurando que cada incremento de valor nos acerque al lanzamiento de una plataforma premium.

---

## 🏗️ Fase 1: Cimientos y Arquitectura (COMPLETADO)
*El objetivo fue establecer un entorno de desarrollo moderno, seguro y escalable.*

- [x] **Core Tecnológico**: Migración a **React 19** y **Vite**.
- [x] **Sistema de Estilos**: Implementación de **Tailwind CSS v4** con variables CSS centralizadas.
- [x] **Refactorización FSD**: Reestructuración completa a **Feature-Sliced Design** (Shared, Features, Pages).
- [x] **Infraestructura Firebase**: Configuración de Auth, Firestore y Storage con reglas de seguridad endurecidas.
- [x] **Identidad Visual**: Definición del tema "Premium Dark" y componentes base.

---

## 🚧 Fase 2: Funcionalidad Core (EN PROGRESO)
*El objetivo es lograr un flujo de reserva y gestión de propiedades 100% operativo y libre de errores.*

- [/] **Tipado Estricto**: Eliminación de `any` en modelos críticos (Listings, Bookings, Timestamps).
- [/] **Validación de Datos**: Integración total de **Zod** en todos los formularios de entrada.
- [ ] **Flujo de Pago 20/80**: Integración completa en el Checkout para el manejo de anticipos y saldo pendiente en Firestore.
- [ ] **Gestión de Imágenes**: Implementación de subida real con optimización en cliente y manejo de errores CORS.
- [ ] **Dashboard de Anfitrión**: Herramientas de edición de propiedades y validación manual de pagos.

---

## ⏳ Fase 3: Optimización y Lanzamiento (PENDIENTE)
*El objetivo es pulir la experiencia de usuario y preparar el sistema para tráfico real.*

- [ ] **SEO Dinámico**: Implementación de Meta Tags dinámicos por propiedad para mejor posicionamiento.
- [ ] **PWA (Progressive Web App)**: Soporte para instalación en móviles y funcionamiento offline básico.
- [ ] **Auditoría de Performance**: Optimización de bundles, Lazy loading y reducción de CLS.
- [ ] **Testing**: Pruebas unitarias para lógica de negocio y pruebas E2E para el flujo de reserva.
- [ ] **Lanzamiento Beta**: Despliegue en entorno de producción para pruebas con usuarios reales.

---

## 🚀 Fase 4: Escalamiento y Valor Añadido (FUTURO)
*El objetivo es diferenciar a VeneStay mediante funcionalidades avanzadas e inteligencia de datos.*

- [ ] **Chat Avanzado**: Notificaciones push en tiempo real y envío de archivos/comprobantes.
- [ ] **Sistema de Reseñas**: Algoritmo de confianza y calificaciones verificadas.
- [ ] **Analíticas para el Host**: Dashboard con métricas de ocupación, ingresos y tendencias.
- [ ] **Integración IA**: Generación inteligente de descripciones y sugerencias de precios basadas en el mercado.

---
*Última actualización: 2026-05-03*
