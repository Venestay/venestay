# Especificaciones de Seguridad — Flujo RTB Acortado

## SPEC ATÓMICA — 2026-06-01
**ID:** SPEC-SECURITY-01
**Sprint:** S04
**Prioridad:** P0

### Contexto
Prevención del "Soft-Block Zombie". Las reservas pendientes de pago bloquean el calendario indefinidamente si el huésped abandona el proceso.

### Alcance
- **Capa FSD:** `types`, `services` (Cloud Functions)
- **Archivo afectado:** `src/features/bookings/types/index.ts`, `functions/src/index.ts` (o donde se alojen las Cloud Functions)
- **Función / Componente:** `Booking` interface, `cronCancelExpiredBookings` (Cloud Function)
- **Tipo de cambio:** CREAR / MODIFICAR

### Qué debe hacer
1. Agregar `paymentExpiresAt?: string;` a la interfaz `Booking`.
2. Crear un Cron Job (Pub/Sub) que se ejecute cada X minutos.
3. Buscar reservas con `status === 'PENDING_PAYMENT'` donde `paymentExpiresAt` sea menor a la hora actual.
4. Actualizar estado a `CANCELLED`, liberando las fechas en el listing.

### Qué NO debe hacer (límites)
- No debe ser ejecutado en el cliente (Frontend).
- No debe enviar correos de cancelación en esta fase (solo actualización en DB).

### Tipos requeridos
```typescript
export interface Booking {
  // ...otros campos
  paymentExpiresAt?: string; // Fecha límite en formato ISO
}
```

### Criterios de aceptación (QA Gate los verificará)
- [ ] CA-1: `Booking` incluye el campo opcional `paymentExpiresAt`.
- [ ] CA-2: El Cron Job encuentra y actualiza correctamente las reservas expiradas a `CANCELLED`.
- [ ] CA-3: TypeScript compila sin errores (`tsc --noEmit`).
- [ ] CA-4: ESLint sin errores severos.

---

## SPEC ATÓMICA — 2026-06-01
**ID:** SPEC-SECURITY-02
**Sprint:** S04
**Prioridad:** P0

### Contexto
Prevención de Colisión de Reservas (Condición de Carrera) durante el proceso de aprobación simultáneo de múltiples solicitudes para las mismas fechas.

### Alcance
- **Capa FSD:** `services` (Cloud Functions o Backend Service)
- **Archivo afectado:** Lógica de aprobación (`booking-request.service.ts` o Cloud Function equivalente)
- **Función / Componente:** `approveBookingRequest`
- **Tipo de cambio:** MODIFICAR

### Qué debe hacer
1. Implementar transacción atómica al momento de aprobar una reserva.
2. Rechazar automáticamente cualquier otra reserva en `PENDING_APPROVAL` que colisione con las fechas de la reserva recién aprobada.
3. Asegurar la atomicidad en Firestore para prevenir race conditions.

### Qué NO debe hacer (límites)
- No depender del cliente para rechazar colisiones, la lógica debe ser server-side o transaccional estricta en DB.

### Criterios de aceptación (QA Gate los verificará)
- [ ] CA-1: Al aprobar una reserva, cualquier solicitud conflictiva cambia su estado a `REJECTED`.
- [ ] CA-2: La lógica utiliza `runTransaction` de Firestore o corre en Cloud Function transaccional.
- [ ] CA-3: TypeScript compila sin errores.

---

## SPEC ATÓMICA — 2026-06-01
**ID:** SPEC-SECURITY-03
**Sprint:** S04
**Prioridad:** P1

### Contexto
Storage Shielding & UI Separation. Protección de `/payment-proofs/` contra accesos públicos no autorizados.

### Alcance
- **Capa FSD:** `infra` (Firestore Rules), `hooks`
- **Archivo afectado:** `storage.rules`, `src/features/listings/hooks/useListingPaymentMethods.ts`
- **Función / Componente:** Storage Rules, Custom Hook
- **Tipo de cambio:** MODIFICAR / CREAR

### Qué debe hacer
1. Actualizar `storage.rules` para limitar acceso a `/payment-proofs/` solo a usuarios autorizados (huésped creador o anfitrión del listing).
2. Crear hook `useListingPaymentMethods` para encapsular la obtención de métodos de pago, leyéndolos del perfil del anfitrión asociado al listing en lugar de depender de datos no seguros.

### Qué NO debe hacer (límites)
- No permitir lectura pública de recibos de pago bajo ninguna circunstancia.

### Criterios de aceptación (QA Gate los verificará)
- [ ] CA-1: `storage.rules` prohíbe lectura/escritura pública en `/payment-proofs/`.
- [ ] CA-2: Hook `useListingPaymentMethods` retorna los datos bancarios del anfitrión correctamente.
- [ ] CA-3: TypeScript compila sin errores.

---

## SPEC ATÓMICA — 2026-06-01
**ID:** SPEC-SECURITY-04
**Sprint:** S04
**Prioridad:** P0

### Contexto
Message Injection & Trust Gate. Eliminar vulnerabilidad del cliente al inyectar mensajes del sistema, y validar el Trust Score mínimo antes de reservar.

### Alcance
- **Capa FSD:** `services` (Cloud Functions / Triggers), `features`
- **Archivo afectado:** Cloud Functions, `src/features/bookings/components/checkout/CheckoutPage.tsx` o Formulario RTB.
- **Función / Componente:** Trigger `onDocumentUpdated` (Firestore), `DirectRequestForm.tsx`
- **Tipo de cambio:** MODIFICAR

### Qué debe hacer
1. Remover la inyección manual de mensajes del sistema en el frontend.
2. Crear un trigger `onDocumentUpdated` en la DB para la colección de reservas que genere el mensaje de sistema automáticamente en el chat ante cambios de estado.
3. Bloquear en el frontend (y respaldar en backend) la creación de nuevas reservas si el usuario tiene `trustScore < 40%`.

### Qué NO debe hacer (límites)
- No permitir en las reglas de Firestore que un usuario cliente escriba en la colección de mensajes con `sender: "SYSTEM"`.

### Criterios de aceptación (QA Gate los verificará)
- [ ] CA-1: Triggers backend generan los mensajes de sistema en el chat.
- [ ] CA-2: `firestore.rules` prohíben escrituras donde `sender == "SYSTEM"` por parte de usuarios.
- [ ] CA-3: Se verifica `trustScore >= 40%` antes de iniciar una solicitud.
- [ ] CA-4: TypeScript compila sin errores.
