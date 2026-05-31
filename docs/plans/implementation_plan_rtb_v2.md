# Plan de Implementación v2.0: Flujo Conversacional "Request to Book"
## Zero-Step Checkout · Arquitectura Coexistente · VeneStay v2.3.0

> **Sprint:** S04 — Optimización Flujo Pago Fase 1 + QR Asistente
> **Nodo activo:** Nodo 2 — Planner (Spec Architect)
> **QA Gate previo:** OK
> **Bloqueante:** ninguno
> **Versión:** v2.0 — Reemplaza `implementation_plan.md` original
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Mayo 2026

---

## Contexto y alcance

Este plan implementa la bifurcación dinámica del flujo de reserva entre el modo **Instant Book** (flujo tradicional intacto) y el modo **Request to Book** (flujo conversacional sin checkout). Los cinco gaps identificados en el análisis comparativo con Airbnb y Booking.com están resueltos en esta versión.

---

## Máquina de estados completa (ambos modos)

```
INSTANT BOOK
  ListingDetail → CheckoutPage → AWAITING_VERIFICATION → CONFIRMED

REQUEST TO BOOK
  DirectRequestForm → PENDING_APPROVAL (soft-block) →

    ├── Anfitrión aprueba (sin comprobante) → PENDING_PAYMENT
    │     └── Huésped sube comprobante     → AWAITING_VERIFICATION → CONFIRMED
    │
    ├── Anfitrión aprueba (con comprobante) → AWAITING_VERIFICATION → CONFIRMED
    │
    ├── Anfitrión rechaza                  → REJECTED (terminal)
    │     └── Soft-block liberado inmediatamente
    │
    └── 24h sin respuesta                  → EXPIRED (terminal)
          └── Soft-block liberado + notificación al huésped
```

---

## Cambios por módulo — orden de implementación

Los módulos están ordenados por dependencia. No comenzar el siguiente sin completar el anterior.

---

### Módulo 1 — Tipos (`src/types/`)

**Objetivo:** Definir los contratos de datos antes de cualquier componente o servicio.

#### [MODIFY] `src/types/booking.types.ts`

```typescript
export type BookingStatus =
  | 'PENDING_APPROVAL'       // Request mode — esperando al anfitrión
  | 'PENDING_PAYMENT'        // Aprobado, esperando comprobante del huésped
  | 'AWAITING_VERIFICATION'  // Comprobante recibido, pendiente validación
  | 'CONFIRMED'              // Reserva activa
  | 'REJECTED'               // Anfitrión rechazó (terminal)
  | 'EXPIRED'                // 24h sin respuesta (terminal)
  | 'CANCELLED_BY_GUEST';    // Huésped canceló antes de aprobación (terminal)

export interface DirectBookingRequestPayload {
  listingId: string;
  listingTitle: string;
  startDate: string;            // ISO 8601
  endDate: string;              // ISO 8601
  guestMessage: string;         // mínimo 20 caracteres (validado en Zod)
  guestId: string;
  guestName: string;
  hostId: string;
  guestsCount: number;
  anticipoAmount: number;       // calculado en Cloud Function, no en cliente
  totalAmount: number;          // calculado en Cloud Function, no en cliente
  paymentMethod: 'ves' | 'usdt';
}
```

**Criterio de aceptación:** `tsc --noEmit` sin errores.

---

### Módulo 2 — Schema Zod (`src/features/listings/`)

**Objetivo:** Validar el formulario de solicitud antes de llamar al servicio.

#### [NEW] `src/features/listings/schemas/directRequest.schema.ts`

```typescript
import { z } from 'zod';

export const directRequestSchema = z.object({
  startDate: z.string().min(1, 'Selecciona la fecha de entrada'),
  endDate: z.string().min(1, 'Selecciona la fecha de salida'),
  guestMessage: z
    .string()
    .min(20, 'Tu mensaje debe tener al menos 20 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  guestsCount: z.coerce.number().min(1).max(20),
  paymentMethod: z.enum(['ves', 'usdt']),
});

export type DirectRequestFormData = z.infer<typeof directRequestSchema>;
```

---

### Módulo 3 — Servicio (`src/services/booking-service.ts`)

**Objetivo:** Implementar `requestBookingDirectly` con transacción atómica.

#### [MODIFY] `src/services/booking-service.ts`

```typescript
export const requestBookingDirectly = async (
  payload: DirectBookingRequestPayload
): Promise<{ bookingId: string; chatId: string }> => {

  // Llamada a Cloud Function — nunca calcular montos en cliente
  const fn = httpsCallable(functions, 'createRequestBooking');
  const result = await fn(payload);
  return result.data as { bookingId: string; chatId: string };
};
```

**Nota:** La transacción atómica (verificar disponibilidad + crear doc + soft-block + mensaje inicial en chat) vive en la Cloud Function `createRequestBooking`, no en el cliente.

---

### Módulo 4 — Cloud Function (`functions/src/createRequestBooking.ts`)

**Objetivo:** Crear la solicitud de forma atómica garantizando integridad de datos.

```typescript
export const createRequestBooking = functions.https.onCall(
  async (data: DirectBookingRequestPayload, context) => {

    if (!context.auth) throw new HttpsError('unauthenticated', '');
    if (context.auth.uid !== data.guestId) throw new HttpsError('permission-denied', '');
    if (data.guestId === data.hostId) throw new HttpsError(
      'failed-precondition', 'No puedes reservar tu propia propiedad.'
    );

    // Validar mensaje mínimo en servidor (no solo en cliente)
    if (!data.guestMessage || data.guestMessage.trim().length < 20) {
      throw new HttpsError('invalid-argument', 'Mensaje demasiado corto.');
    }

    // Calcular montos en servidor
    const pricing = await calculatePricing(
      data.listingId, data.startDate, data.endDate, data.guestsCount
    );

    const bookingId = db.collection('bookings').doc().id;
    const chatId = db.collection('chats').doc().id;
    const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

    await db.runTransaction(async (tx) => {

      // 1. Verificar que no hay solapamiento con reservas activas
      const conflicts = await tx.get(
        db.collection('bookings')
          .where('listingId', '==', data.listingId)
          .where('status', 'in', ['CONFIRMED', 'PENDING_APPROVAL', 'PENDING_PAYMENT', 'AWAITING_VERIFICATION'])
      );
      if (!conflicts.empty) throw new HttpsError(
        'already-exists', 'Las fechas seleccionadas no están disponibles.'
      );

      // 2. Crear el documento de booking
      tx.set(db.collection('bookings').doc(bookingId), {
        ...data,
        ...pricing,
        status: 'PENDING_APPROVAL',
        bookingMode: 'request',
        chatId,
        expiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 3. Crear el hilo de chat con mensaje de sistema
      tx.set(db.collection('chats').doc(chatId), {
        bookingId,
        participants: [data.guestId, data.hostId],
        createdAt: FieldValue.serverTimestamp(),
      });

      // 4. Mensaje inicial del sistema en el chat
      tx.set(
        db.collection('chats').doc(chatId).collection('messages').doc(),
        {
          type: 'system_booking_request',
          bookingId,
          checkIn: data.startDate,
          checkOut: data.endDate,
          anticipoAmount: pricing.anticipoAmount,
          status: 'PENDING_APPROVAL',
          expiresAt,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: 'system',
        }
      );

      // 5. Mensaje del huésped
      tx.set(
        db.collection('chats').doc(chatId).collection('messages').doc(),
        {
          type: 'text',
          content: data.guestMessage,
          senderId: data.guestId,
          senderName: data.guestName,
          createdAt: FieldValue.serverTimestamp(),
        }
      );
    });

    // 6. Notificación push al anfitrión (fuera de la transacción)
    await notifyHost(data.hostId, {
      title: `Nueva solicitud de reserva`,
      body: `${data.guestName} quiere reservar ${data.listingTitle} del ${data.startDate} al ${data.endDate}`,
      data: { type: 'new_booking_request', bookingId, chatId },
    });

    return { bookingId, chatId };
  }
);
```

---

### Módulo 5 — Componente `DirectRequestForm.tsx` (nuevo)

**Ruta:** `src/features/listings/components/DirectRequestForm.tsx`

#### Estructura visual

```
┌──────────────────────────────────────────────────────────────────┐
│  SOLICITAR RESERVA                                               │
│  El anfitrión tiene 24h para responder. Sin cargos hasta        │
│  que apruebe.                                                    │
│  ─────────────────────────────────────────────────────────────  │
│  FECHAS                                                          │
│  [📅 Entrada: 30 may]          [📅 Salida: 31 may]              │
│  ─────────────────────────────────────────────────────────────  │
│  HUÉSPEDES                                                       │
│  [- 2 Viajeros +]                                               │
│  ─────────────────────────────────────────────────────────────  │
│  MENSAJE AL ANFITRIÓN  (obligatorio, mín. 20 caracteres)        │
│  [Textarea: "Preséntate con el anfitrión..."]                   │
│  [240 / 500 caracteres]                                         │
│  ─────────────────────────────────────────────────────────────  │
│  DESGLOSE SI SE APRUEBA                       ← GAP 2 RESUELTO │
│  1 noche × $450                        $450.00                  │
│  Tarifa de limpieza                     $30.00                  │
│  Anticipo hoy si aprueba (20%)          $96.00 USDT             │
│  Saldo al llegar (80%)                 $384.00 USDT             │
│  ─────────────────────────────────────────────────────────────  │
│  [🔒 SOLICITAR RESERVA DE FORMA SEGURA]                         │
│  No se realizará ningún cargo hasta la aprobación.              │
└──────────────────────────────────────────────────────────────────┘
```

#### Spec del componente

```typescript
interface DirectRequestFormProps {
  listing: Listing;
  user: UserProfile;
  onSuccess: (bookingId: string, chatId: string) => void;
}
```

**Comportamientos requeridos:**

1. **Desglose financiero en tiempo real.** Al seleccionar fechas, el formulario calcula y muestra el anticipo estimado. Esto resuelve el Gap 2: el huésped sabe exactamente cuánto pagará si se aprueba. El cálculo usa los mismos datos que la Cloud Function pero solo como previsualización — el monto definitivo lo confirma la Cloud Function.

2. **Contador de caracteres en el textarea.** `[N / 500]` visible debajo del campo. Si `N < 20`, el botón de envío está deshabilitado y se muestra el error Zod.

3. **Botón de envío con estado de carga.** Spinner durante la llamada a `requestBookingDirectly`. Deshabilitado para evitar doble envío.

4. **Toast de éxito y redirección.** Al completar, mostrar toast de `sonner`: *"Solicitud enviada. El anfitrión tiene 24h para responder."* Luego redirigir a `/mis-viajes/[bookingId]` — no al chat directamente, para dar contexto del estado de la reserva.

5. **Método de pago seleccionable.** El desglose muestra el monto en VES o USDT según la selección del huésped. Este dato se envía en el payload para que el anfitrión sepa el método preferido.

---

### Módulo 6 — `ListingDetail.tsx` (modificación)

#### Cambio mínimo requerido

```tsx
// src/features/listings/components/ListingDetail.tsx

{listing.bookingMode === 'request' ? (
  <DirectRequestForm
    listing={listing}
    user={currentUser}
    onSuccess={(bookingId, chatId) => router.push(`/mis-viajes/${bookingId}`)}
  />
) : (
  <div className="flex flex-col gap-4">
    <p className="text-sm text-gray-500">
      Reserva instantánea y pago inmediato.
    </p>
    <button
      onClick={handleGoToCheckout}
      className="bg-brand-gold hover:bg-brand-navy w-full py-4 text-white
                 font-bold rounded-[32px] transition-all"
    >
      Reservar ahora
    </button>
  </div>
)}
```

**Nota:** Sin más cambios en este componente. La lógica vive en `DirectRequestForm`.

---

### Módulo 7 — Estado de espera en `/mis-viajes/[bookingId]` (Gap 3 resuelto)

**Objetivo:** El huésped sabe exactamente qué está pasando mientras espera.

#### Vista del huésped con estado `PENDING_APPROVAL`

```
┌──────────────────────────────────────────────────────────────────┐
│  🕐 SOLICITUD ENVIADA — ESPERANDO AL ANFITRIÓN                  │
│                                                                  │
│  [Nombre del anfitrión] tiene hasta las [hora] de mañana para   │
│  responder tu solicitud.                                         │
│                                                                  │
│  ⏱ [Countdown: 21:34:12]                                        │
│                                                                  │
│  Propiedad: [Nombre del listing]                                 │
│  Fechas:    30 may → 31 may · 1 noche                           │
│  Anticipo si se aprueba: $96.00 USDT                            │
│                                                                  │
│  [💬 Ver conversación]        [✕ Cancelar solicitud]            │
│                                                                  │
│  💡 El anfitrión fue notificado de tu solicitud.                │
└──────────────────────────────────────────────────────────────────┘
```

**Nuevo componente:** `BookingPendingApprovalCard.tsx`

```typescript
// src/features/bookings/components/BookingPendingApprovalCard.tsx

interface BookingPendingApprovalCardProps {
  booking: Booking;
  onCancel: (bookingId: string) => void;
  onOpenChat: (chatId: string) => void;
}
```

---

### Módulo 8 — Notificación de expiración al huésped (Gap 1 resuelto)

#### Cloud Function programada: `expireBookingRequests`

Extiende la función existente para incluir la notificación al huésped:

```typescript
// functions/src/expireBookingRequests.ts — añadir tras marcar como EXPIRED

// Para cada solicitud expirada:
await notifyGuest(booking.guestId, {
  title: 'Tu solicitud venció sin respuesta',
  body: `${booking.listingTitle} no respondió a tiempo. Las fechas están libres para que elijas otra opción.`,
  data: {
    type: 'booking_expired',
    bookingId,
    action: 'suggest_alternatives',   // la app puede sugerir listings similares
  },
});
```

**Vista en `BookingPendingApprovalCard` cuando el estado pasa a `EXPIRED`:**

```
┌──────────────────────────────────────────────────────────────────┐
│  ⏰ SOLICITUD VENCIDA                                            │
│                                                                  │
│  El anfitrión no respondió en 24 horas. Las fechas que          │
│  solicitaste están disponibles nuevamente.                       │
│                                                                  │
│  No se realizó ningún cargo.                                     │
│                                                                  │
│  [Buscar propiedades similares]                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Módulo 9 — Flujo de rechazo (Gap 4 resuelto)

El flujo de rechazo desde el `GuestRequestVerificationDrawer` (ya implementado) debe producir este resultado en la vista del huésped:

#### Vista en `BookingPendingApprovalCard` cuando el estado pasa a `REJECTED`

```
┌──────────────────────────────────────────────────────────────────┐
│  ✕ SOLICITUD NO ACEPTADA                                        │
│                                                                  │
│  El anfitrión no puede recibirte en estas fechas.               │
│  [Nota del anfitrión si existe: "Esas fechas ya están           │
│   comprometidas, lamentablemente."]                             │
│                                                                  │
│  No se realizó ningún cargo.                                     │
│                                                                  │
│  [Buscar otras propiedades]     [Volver a solicitar]            │
└──────────────────────────────────────────────────────────────────┘
```

**Regla de "Volver a solicitar":** Solo disponible si el listing sigue activo y las fechas rechazadas no fueron bloqueadas permanentemente. El huésped puede solicitar las mismas u otras fechas sin restricción.

---

### Módulo 10 — `firestore.rules` (modificación)

Extiende las reglas del plan original con dos adiciones:

```javascript
match /bookings/{bookingId} {

  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.guestId
    && request.auth.uid != request.resource.data.hostId  // no self-booking
    && (
      (request.resource.data.bookingMode == 'request'
       && request.resource.data.status == 'PENDING_APPROVAL')
      ||
      (request.resource.data.bookingMode == 'instant'
       && request.resource.data.status == 'AWAITING_VERIFICATION'
       && request.resource.data.proofUrl != null)
    );

  // Huésped puede cancelar su propia solicitud si aún está pendiente
  allow update: if request.auth.uid == resource.data.guestId
    && resource.data.status == 'PENDING_APPROVAL'
    && request.resource.data.status == 'CANCELLED_BY_GUEST'
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['status', 'updatedAt']);

  // Lectura: solo participantes
  allow read: if request.auth.uid == resource.data.guestId
           || request.auth.uid == resource.data.hostId;

  // Eliminación: nunca (integridad de auditoría)
  allow delete: if false;
}
```

---

## Plan de verificación (DoD)

### Pruebas automatizadas

```powershell
npm run lint
npx tsc --noEmit
cd functions && npx tsc --noEmit
npx vitest run tests/integration/request-booking.test.ts
```

### Escenarios manuales E2E

| # | Escenario | Resultado esperado |
|:---|:---|:---|
| E-01 | Anfitrión A publica listing `instant`. Huésped visita la ficha | Botón "Reservar ahora" → redirige a `/checkout`. Sin cambios. |
| E-02 | Anfitrión B publica listing `request`. Huésped visita la ficha | Muestra `DirectRequestForm` inline. Sin botón a `/checkout`. |
| E-03 | Huésped intenta enviar mensaje vacío | Botón deshabilitado. Error Zod visible: "mínimo 20 caracteres". |
| E-04 | Huésped completa el formulario y envía | Toast de éxito. Redirige a `/mis-viajes/[id]` con countdown 24h. |
| E-05 | Booking creado en Firestore | Status `PENDING_APPROVAL`, `bookingMode: 'request'`, `expiresAt` = ahora + 24h. |
| E-06 | Anfitrión recibe notificación push | Push llega en < 10s. Abre drawer de verificación al tocar. |
| E-07 | Anfitrión aprueba (sin comprobante) | Status → `PENDING_PAYMENT`. Huésped ve tarjeta de pago en `/mis-viajes`. |
| E-08 | Anfitrión rechaza con nota | Status → `REJECTED`. Huésped ve nota del anfitrión. Opción "Volver a solicitar" disponible. |
| E-09 | Solicitud no respondida en 24h | Status → `EXPIRED`. Huésped recibe push + ve pantalla de expiración. |
| E-10 | Huésped cancela antes de respuesta | Status → `CANCELLED_BY_GUEST`. Soft-block liberado. Sin cargos. |
| E-11 | Flujo instant book sin regresión | Checkout completo, comprobante requerido, sin elementos de modo request visibles. |
| E-12 | Self-booking bloqueado | Anfitrión intenta solicitar su propia propiedad → error `failed-precondition`. |

---

## Resumen de cambios por archivo

| Archivo | Tipo | Descripción |
|:---|:---|:---|
| `src/types/booking.types.ts` | Modify | Nuevos estados y `DirectBookingRequestPayload` |
| `src/features/listings/schemas/directRequest.schema.ts` | New | Schema Zod con validación de mensaje |
| `src/services/booking-service.ts` | Modify | Añadir `requestBookingDirectly` |
| `functions/src/createRequestBooking.ts` | New | Cloud Function principal del flujo |
| `functions/src/expireBookingRequests.ts` | Modify | Añadir notificación al huésped al expirar |
| `src/features/listings/components/DirectRequestForm.tsx` | New | Formulario inline con desglose financiero |
| `src/features/listings/components/ListingDetail.tsx` | Modify | Bifurcación ternaria por `bookingMode` |
| `src/features/bookings/components/BookingPendingApprovalCard.tsx` | New | Vista de espera, expiración y rechazo |
| `firestore.rules` | Modify | Reglas para ambos modos + cancelación del huésped |

---

*División de Ingeniería de IA — Antigravity · Mayo 2026*
*Versión v2.0 — Reemplaza `implementation_plan.md` original*
*Referencia: `informe_acortar_flujo_pago_request_to_book.md` (análisis base)*
