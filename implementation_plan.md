# Plan de Implementación: Flujo Híbrido "Solicitar Reserva" (Request to Book)

Este plan de implementación detalla la ruta de desarrollo para la funcionalidad híbrida de reserva opcional **Instant Book vs. Request to Book** en VeneStay v2.3.0, estructurando los entregables según la hoja de ruta oficial y aplicando estrictas medidas de seguridad y calidad en la compilación.

---

## 1. Hoja de Ruta de Implementación (Hitos y Sprints)

### Sprint S-RB-01: Modelo de Datos + Validación
* **Entregables:**
  - Agregar `bookingMode?: 'instant' | 'request'` a la interfaz `Listing` en `src/features/listings/types/index.ts`.
  - Agregar `bookingMode` con validación `z.enum(['instant', 'request']).default('instant')` en `src/features/dashboard/types/dashboard.schema.ts`.

### Sprint S-RB-02: Dashboard del Anfitrión — Configuración
* **Entregables:**
  - Integrar en el formulario de creación/edición de propiedades (`StepGeneral.tsx`) el switch selectivo premium con las opciones: **Reserva Inmediata (Instant Book)** y **Solicitar Reserva (Request to Book)** usando iconos interactivos `Zap` y `MessageSquare`.

### Sprint S-RB-03: Detalle de Alojamiento — CTAs Dinámicos
* **Entregables:**
  - Condicionar el botón principal en `ListingDetail.tsx` según `currentListing.bookingMode`.
  - Si el modo es `request`, renderizar *"Solicitar Reserva"* con estilo transparente y borde dorado en lugar del relleno sólido, agregando la etiqueta informativa de que el anfitrión responderá en un plazo máximo de 24 horas.

### Sprint S-RB-04: Checkout Adaptativo — Modo Request
* **Entregables:**
  - Condicionar la renderización de la pantalla de checkout en `CheckoutPage.tsx` según `listing.bookingMode`.
  - Si es `'request'`, ocultar las secciones de método de pago y comprobante. En su lugar, mostrar el panel de presentación premium con un `textarea` editable pre-llenado para presentarse al anfitrión.
  - Modificar `handleSubmitPayment` para que en modo de solicitud no exija comprobante ni referencia bancaria al cargar. Crear la reserva en estado `PENDING_APPROVAL` e inyectar el mensaje de presentación en la subcolección de chat de la reserva en Firestore (`bookings/{id}/messages`), abriendo el chat flotante lateral automáticamente.

---

## 2. Modificaciones Propuestas a los Archivos

### 2.1 Ecosistema de Modelos y Tipos
#### [MODIFY] [types/index.ts](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/listings/types/index.ts)
* Añadir `bookingMode?: 'instant' | 'request'` a la interfaz `Listing`.

#### [MODIFY] [dashboard.schema.ts](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/types/dashboard.schema.ts)
* Actualizar el validador Zod `listingSchema` para incluir `bookingMode`.

### 2.2 Dashboard del Anfitrión
#### [MODIFY] [StepGeneral.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/components/form-steps/StepGeneral.tsx)
* Añadir el selector interactivo premium para elegir el modo de reserva.

### 2.3 Detalle de Alojamiento
#### [MODIFY] [ListingDetail.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/listings/components/ListingDetail.tsx)
* Adaptar el botón de reserva principal en desktop, tarjetas colapsadas y mobile.

### 2.4 Checkout de Reserva
#### [MODIFY] [CheckoutPage.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/bookings/components/checkout/CheckoutPage.tsx)
* Ocultar validación obligatoria de comprobante/referencia en modo de solicitud y renderizar el panel de mensaje.

---

## 3. Plan de Verificación y Quality Gates
- **Compilación de Tipos (`tsc --noEmit`):** Validar tipado robusto.
- **ESLint:** Asegurar que el linter pase con 0 errores.
