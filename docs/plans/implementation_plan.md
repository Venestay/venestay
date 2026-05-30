# Plan de Implementación Oficial: Flujo Híbrido "Solicitar Reserva" (Request to Book)
## Modelo Híbrido Instant Book vs. Request to Book — VeneStay v2.3.0

Este plan de implementación detalla el desglose técnico y la ruta de desarrollo para integrar la funcionalidad híbrida opcional **Instant Book vs. Request to Book** en VeneStay v2.3.0. Este documento ha sido actualizado y validado con las decisiones de arquitectura definitivas seleccionadas por el usuario para garantizar un flujo robusto, compatible y libre de bloqueantes en el entorno de desarrollo local.

---

## ┌─ CONTEXTO OPERATIVO ───────────────────────────────────────────┐
## │ Nodo Activo : Nodo 1 — Project Manager (Alex)                    │
│ Sprint      : S03 — Loyalty System + Reserva Async + Authenticator│
│ Módulo      : Flujo Híbrido "Solicitar Reserva" (Request to Book) │
│ QA Gate     : PENDIENTE                                          │
│ Bloqueante  : ninguno                                            │
└──────────────────────────────────────────────────────────────────┘

---

## Decisiones Técnicas Aprobadas (Gobernanza del Proyecto)

> [!NOTE]
> **a) Motor de Aprobación y Transacciones (Client-Side Robusto):**
> Se adopta un enfoque Client-Side sumamente seguro utilizando **Transacciones Atómicas de Firestore (`runTransaction`)** a través de `src/services/booking-request.service.ts`. Toda validación de disponibilidad y bloqueo de fechas se consolida en una sola operación atómica en el cliente, evitando la complejidad de configurar Cloud Functions y permitiendo una ejecución impecable en local.

> [!NOTE]
> **b) Persistencia y Suscripción del Chat (Heredada en `/bookings/`):**
> Para evitar la duplicación de código e infraestructura, las solicitudes se persisten directamente en la colección `/bookings/` con el estado inicial `status: 'PENDING_APPROVAL'`. Esto permite que el canal de chat (`bookings/{bookingId}/messages`) y los componentes visuales existentes (como `<Chat>`) se hereden de manera nativa sin modificar su lógica interna.

> [!NOTE]
> **c) Gestión del Countdown y Expiración (Lazy Expiry):**
> Se adopta la **Limpieza Pasiva (Lazy Expiry)** en el frontend. Al cargar componentes clave (como el Dashboard del Anfitrión o el Historial de Viajes del Huésped), el servicio identificará automáticamente aquellas reservas en estado `PENDING_APPROVAL` creadas hace más de 24 horas y las actualizará a `EXPIRED` en Firestore, liberando el soft-block de fechas al instante y de forma transparente para los usuarios.

---

## Priorización de Fases (Matriz RICE)

| Fase | Descripción | Alcance (R) | Impacto (I) | Confianza (C) | Esfuerzo (E) | Puntuación RICE | Prioridad |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Fase 1** | Modelo de Datos, Zod & Estructura Base | Alta | Alto (3.0) | 95% | Bajo (1.0) | **285** | **P0 (Crítica)** |
| **Fase 2** | Dashboard del Anfitrión: Configuración | Alta | Alto (3.0) | 95% | Bajo (1.5) | **190** | **P1 (Alta)** |
| **Fase 3** | Vista Detalle & Checkout Adaptativo | Alta | Alto (3.0) | 90% | Medio (2.5) | **108** | **P1 (Alta)** |
| **Fase 4** | Servicio Transaccional y Lógica de Negocio | Alta | Crítico (4.0) | 90% | Medio (3.0) | **120** | **P1 (Alta)** |
| **Fase 5** | Panel de Aprobación del Anfitrión & Lazy Expiry | Alta | Medio (2.0) | 85% | Medio (3.0) | **56** | **P2 (Media)** |

---

## Proposed Changes (Desglose por Fases)

### Fase 1: Ecosistema de Tipos, Validación Zod y Estructura Base (P0)
**Objetivo:** Extender los tipos del dominio de listings y bookings para dar soporte al flujo híbrido.

#### [MODIFY] [index.ts](file:///c:/VeneStay/src/features/listings/types/index.ts)
* Agregar `bookingMode: 'instant' | 'request'` a la interfaz `Listing`.

#### [MODIFY] [types/index.ts](file:///c:/VeneStay/src/types/index.ts) o archivo de tipos globales
* Extender el tipo `BookingStatus` en `src/types/` para incluir los estados:
  - `'PENDING_APPROVAL'` (Esperando respuesta del anfitrión)
  - `'REJECTED'` (Rechazada por el anfitrión)
  - `'EXPIRED'` (Expirada automáticamente a las 24h)
* Extender la interfaz `Booking` para incluir campos de control de solicitud:
  - `bookingMode: 'instant' | 'request'`
  - `guestMessage?: string` (Mensaje inicial de presentación)
  - `hostResponseNote?: string` (Nota explicativa del rechazo o aprobación)
  - `expiresAt: string` (ISO String de creación + 24 horas)

#### [MODIFY] [dashboard.schema.ts](file:///c:/VeneStay/src/features/dashboard/types/dashboard.schema.ts)
* Integrar `bookingMode: z.enum(['instant', 'request']).default('instant')` en el esquema de validación Zod global de listings (`listingSchema`).

---

### Fase 2: Dashboard del Anfitrión: Configuración Premium del Booking Mode (P1)
**Objetivo:** Permitir que los anfitriones controlen de forma granular por propiedad el modo de reserva en el formulario de creación/edición.

#### [MODIFY] [StepGeneral.tsx](file:///c:/VeneStay/src/features/dashboard/components/form-steps/StepGeneral.tsx)
* Integrar el selector visual premium e interactivo con opciones *"Reserva Inmediata"* y *"Solicitar Reserva"*.
* Utilizar los iconos `Zap` y `MessageSquare` de Lucide.
* Asegurar que el estado del formulario sincronice correctamente con `bookingMode` y persista en Firestore al guardar/publicar.

---

### Fase 3: Detalle de Alojamiento y Checkout Adaptativo (P1)
**Objetivo:** Adaptar el botón de reserva principal en `ListingDetail` y la pantalla de checkout para guiar al huésped a enviar una solicitud conversacional sin cargo inmediato.

#### [MODIFY] [ListingDetail.tsx](file:///c:/VeneStay/src/features/listings/components/ListingDetail.tsx)
* Dinamizar el botón principal de reserva.
* Si el listado tiene `bookingMode === 'request'`:
  - Botón: *"Solicitar Reserva"* con estilo transparente y borde dorado (`border-brand-gold`).
  - Leyenda informativa: *"El anfitrión tiene 24h para confirmar. No se realiza ningún cargo hasta su aprobación."*

#### [MODIFY] [CheckoutPage.tsx](file:///c:/VeneStay/src/features/bookings/components/checkout/CheckoutPage.tsx)
* Detectar el modo del listado.
* Si es `'request'`, Ocultar la obligatoriedad de comprobantes/referencias físicas en el paso inicial (haciéndolos opcionales).
* Renderizar el nuevo componente `RequestToBookPanel`.
* Permitir al usuario escribir un mensaje de presentación al anfitrión.
* Modificar la lógica de envío (`handleSubmitPayment`) para direccionar el flujo hacia la creación de la reserva en estado `'PENDING_APPROVAL'` y abrir el chat lateral de forma automática.

#### [NEW] [RequestToBookPanel.tsx](file:///c:/VeneStay/src/features/bookings/components/checkout/RequestToBookPanel.tsx)
* Componente modular para el flujo de checkout en modo Request.
* Muestra el desglose del anticipo estimado (20% según protocolo UCP).
* Área de texto editable pre-llenada para el mensaje de presentación al anfitrión.
* Subida opcional de comprobante y referencia bancaria en este mismo paso.

---

### Fase 4: Servicio Transaccional de Reservas (P1)
**Objetivo:** Crear el core lógico client-side para la gestión robusta y transaccional de las solicitudes en Firestore.

#### [NEW] [booking-request.service.ts](file:///c:/VeneStay/src/services/booking-request.service.ts)
* Implementar funciones transaccionales utilizando `runTransaction(db, ...)` para:
  - **`createBookingRequest`**: Verifica disponibilidad de fechas en tiempo real y crea la reserva en estado `'PENDING_APPROVAL'` con un Soft-Block implícito.
  - **`approveBooking`**: Transiciona atómicamente el estado a `'CONFIRMED'` (o `'AWAITING_VERIFICATION'` si requiere validación manual de comprobante), consolidando el Hard-Block de fechas.
  - **`rejectBooking`**: Actualiza el estado a `'REJECTED'` y libera las fechas en el calendario inmediatamente.

---

### Fase 5: Panel de Aprobación de Solicitudes y Expiración Pasiva (P2)
**Objetivo:** Proveer la interfaz del anfitrión para tomar decisiones y ejecutar el barrido pasivo de solicitudes expiradas.

#### [NEW] [HostRequestsPanel.tsx](file:///c:/VeneStay/src/features/dashboard/components/HostRequestsPanel.tsx)
* Consola interactiva del anfitrión para solicitudes pendientes.
* Integra:
  - Datos del Huésped, Pasaporte VeneStay y su **Trust Score** dinámico.
  - Countdown visual con el tiempo restante antes de la expiración (24 horas).
  - Visualizador del comprobante cargado.
  - Acciones: *Aprobar Reserva* y *Rechazar* con nota explicativa opcional.

#### [MODIFY] [booking-request.service.ts](file:///c:/VeneStay/src/services/booking-request.service.ts) (Extensión Lazy Expiry)
* Implementar **`cleanupExpiredBookings`**: Consulta y expira en lote las reservas en estado `'PENDING_APPROVAL'` cuyo `expiresAt` sea menor a la hora actual.
* Invocar esta limpieza de forma pasiva al montar el Dashboard del Anfitrión y el Historial de Viajes.

---

## Reglas de Seguridad & Validación en `firestore.rules`

Asegurar en las reglas de seguridad de Firestore que solo el propietario de la reserva o el anfitrión del listado puedan interactuar con el chat y los estados de la reserva, y que un huésped no pueda auto-aprobarse una reserva:

```javascript
match /bookings/{bookingId} {
  // El huésped puede crear en estado PENDING_APPROVAL
  allow create: if request.auth != null
                && request.auth.uid == request.resource.data.guestId
                && request.resource.data.status == 'PENDING_APPROVAL';

  // Solo el anfitrión asignado puede actualizar a CONFIRMED / REJECTED
  allow update: if request.auth != null
                && (request.auth.uid == resource.data.hostId || request.auth.uid == resource.data.guestId)
                && (
                  // Si el huésped actualiza, no puede cambiar el status a CONFIRMED
                  (request.auth.uid == resource.data.guestId && request.resource.data.status == resource.data.status)
                  ||
                  // Si el anfitrión actualiza, puede cambiar el status a CONFIRMED/REJECTED
                  (request.auth.uid == resource.data.hostId && request.resource.data.status in ['CONFIRMED', 'AWAITING_VERIFICATION', 'REJECTED'])
                );
}
```

---

## Verification Plan

### Automated Tests
* Ejecución del linter y de la compilación de TypeScript para asegurar estabilidad completa:
  ```powershell
  npm run lint
  npx tsc --noEmit
  ```

### Manual Verification
1. **Configuración del Anfitrión:** Modificar una propiedad a modo `request`, guardar y verificar en Firestore que persista `bookingMode: 'request'`.
2. **Checkout del Huésped:** Solicitar reserva, validar que el checkout no exija pago mandatorio, enviar y verificar la creación del documento `/bookings/{id}` en estado `'PENDING_APPROVAL'`.
3. **Consola del Anfitrión:** Validar la visualización de la solicitud, countdown y proceder a *Aprobar* o *Rechazar*, comprobando la consistencia del calendario y los estados de Firestore.
