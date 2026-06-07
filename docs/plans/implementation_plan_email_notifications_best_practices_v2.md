# Plan de Implementación: Refactorización y Desacoplamiento de Notificaciones por Email v2.0

> **Versión:** 2.0 — Limpieza del Backend, Desacoplamiento de Plantillas HTML y Layout Común
> **Fecha:** 2026-06-07
> **Contexto:** Beta de Lechería (Julio 2026)

---

## 0. Análisis de Fase y Necesidad de Mejora

En la primera fase de implementación, se integraron con éxito los triggers de Cloud Functions y las alertas por correo electrónico, logrando pasar todas las quality gates (10/10 PASS). Sin embargo, toda la maquetación HTML y el CSS inline de las 6 plantillas de correo quedaron hardcodeadas dentro de `booking.functions.ts` y `kyc.functions.ts`. 

Esto resulta en **más de 700 líneas de maquetación HTML/CSS** mezcladas con lógica de base de datos.

### El Enfoque de Buenas Prácticas (Clean Architecture)
Para cumplir con los principios de desarrollo premium y mantenibilidad de VeneStay, se propone:
1.  **Desacoplar Diseño y Lógica:** Mover las plantillas HTML a una subcarpeta exclusiva `functions/src/templates/`.
2.  **Layout Compartido (Layout Wrapper):** Unificar los estilos CSS comunes, la tipografía, la cabecera (header) y el pie de página (footer) de VeneStay en una única función contenedora. Esto reduce la duplicidad de estilos en un 80% y previene errores de diseño futuros.
3.  **Hacer las Cloud Functions Legibles:** Reducir la lógica de triggers a puras escrituras de transacciones y llamadas simples de renderizado, disminuyendo la complejidad cognitiva de `booking.functions.ts` y `kyc.functions.ts`.

---

## 1. Arquitectura de Cambios (Estructura de Directorios)

Crearemos y modificaremos los siguientes archivos para modularizar las plantillas de correo:

```
functions/src/
  ├── templates/
  │     ├── email-layout.ts      # Contenedor común y CSS del sistema de diseño
  │     ├── booking-emails.ts    # Plantillas HTML específicas de Reservas (E-01, E-02, E-03, E-05, Confirmación)
  │     └── kyc-emails.ts        # Plantillas HTML específicas de KYC (Aprobado/Rechazado)
  ├── booking.functions.ts       # Triggers de Firestore bookings (Lógica pura, importa de templates/)
  └── kyc.functions.ts           # Triggers de Firestore users (Lógica pura, importa de templates/)
```

---

## 2. Cambios Propuestos por Archivo

### [Componente: Templates de Correo y Layout]

#### [NEW] [email-layout.ts](file:///c:/VeneStay/functions/src/templates/email-layout.ts)
*   Define la función `buildEmailWrapper(title: string, contentHtml: string): string` que contiene:
    *   Estilos CSS unificados (Navy `#0B1120`, Gold `#C5A059`, etc.).
    *   Estructura base HTML responsiva (`<!DOCTYPE html>`, `head`, `body`, `.container`).
    *   Cabecera común y Pie de página con enlaces y textos oficiales de VeneStay.

#### [NEW] [booking-emails.ts](file:///c:/VeneStay/functions/src/templates/booking-emails.ts)
*   Agrupa las interfaces y funciones de renderizado específicas de reservas:
    *   Reutiliza e importa las interfaces `EmailBooking`, `EmailGuest`, y `EmailListing`.
    *   Contiene las funciones `buildConfirmationEmailHTML`, `buildBookingRequestEmailHTML`, `buildPaymentInstructionsEmailHTML`, `buildPaymentSubmittedEmailHTML`, y `buildRejectionEmailHTML`.
    *   Cada función genera el HTML específico de su contenido y lo retorna envuelto en `buildEmailWrapper()`.

#### [NEW] [kyc-emails.ts](file:///c:/VeneStay/functions/src/templates/kyc-emails.ts)
*   Agrupa las funciones específicas de KYC:
    *   Importa la interfaz `KYCUserData`.
    *   Contiene `buildKYCApprovedEmailHTML` y `buildKYCRejectedEmailHTML`, retornando el contenido envuelto en `buildEmailWrapper()`.

---

### [Componente: Cloud Functions - Triggers Backend]

#### [MODIFY] [booking.functions.ts](file:///c:/VeneStay/functions/src/booking.functions.ts)
*   **[ELIMINAR]** Todos los constructores HTML de correos (`buildConfirmationEmailHTML`, `buildBookingRequestEmailHTML`, etc.).
*   **[AÑADIR]** Imports correspondientes de `./templates/booking-emails`.
*   La lógica del trigger `onBookingStateChanged` y `onBookingCreated` permanece idéntica pero consumiendo las plantillas externas.

#### [MODIFY] [kyc.functions.ts](file:///c:/VeneStay/functions/src/kyc.functions.ts)
*   **[ELIMINAR]** Las funciones `buildKYCApprovedEmailHTML` y `buildKYCRejectedEmailHTML`.
*   **[AÑADIR]** Imports de `./templates/kyc-emails`.
*   El trigger `onKYCStatusChanged` permanece idéntico pero importando las plantillas externas.

---

## 3. Criterios de Aceptación (QA Gate Checklist)

- [ ] **CA-1:** Los triggers de Cloud Functions consumen las plantillas importadas y no contienen código HTML/CSS crudo en su interior.
- [ ] **CA-2:** El layout wrapper encapsula correctamente la estructura común (header y footer) y el CSS inline de los correos.
- [ ] **CA-3:** Las Cloud Functions de KYC y Reservas se compilan con TypeScript sin errores (`npx tsc --noEmit` en directorio `functions/` da exit code 0).
- [ ] **CA-4:** ESLint pasa perfectamente sin errores severos (`npm run lint` pasa en el proyecto).
- [ ] **CA-5:** Se mantiene el control de idempotencia (`*SentAt`) en los documentos de Firestore.
- [ ] **CA-6:** La estructura del correo final enviado se renderiza idéntica y de forma responsiva.

---

## 4. Plan de Verificación

### Pruebas Automatizadas
*   Correr la compilación de TypeScript de Cloud Functions.
*   Correr ESLint del proyecto.

### Pruebas Manuales
*   Simular el cambio de estado de una reserva (ej: de `PENDING_APPROVAL` a `PENDING_PAYMENT`) y validar que el documento insertado en la colección `mail` contiene el HTML completo estructurado por el layout común.
