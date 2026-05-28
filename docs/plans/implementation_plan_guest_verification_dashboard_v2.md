# Implementation Plan: Guest Request Verification Dashboard
## Sprint S03 — Reserva Async · Fase del Anfitrión

> **Sprint:** S03 — Loyalty System + Reserva Async + Authenticator v2.0
> **QA Gate previo:** OK (Fases 1–5 completadas — lado del huésped)
> **Bloqueante activo:** ninguno
> **Dependencia directa:** `informe_optimizacion_checkout.md` (implementado y validado)
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Mayo 2026

---

## Contexto

El flujo de Solicitar Reserva (`bookingMode === 'request'`) está implementado en su mitad del huésped: el checkout detecta el modo, oculta el paso de comprobante y permite enviar la solicitud sin bloqueos de validación falsos.

Esta fase completa la otra mitad: la experiencia del anfitrión para revisar, evaluar y responder solicitudes desde su dashboard. Sin esta implementación, las solicitudes enviadas por huéspedes no tienen una interfaz funcional de resolución.

---

## Máquina de estados — Decisión de negocio resuelta

Antes de escribir código, se define la máquina de estados completa. Toda implementación debe seguir este contrato.

```
SOLICITUD CREADA
      │
      ▼
 pending_host          ← estado inicial al enviar solicitud
      │
      ├─── Anfitrión aprueba (sin comprobante) ──────► pending_payment
      │                                                      │
      ├─── Anfitrión aprueba (con comprobante) ──────► awaiting_verification
      │                                                      │
      ├─── Anfitrión rechaza ─────────────────────────► rejected  (terminal)
      │                                                
      └─── 24h sin respuesta ─────────────────────────► expired   (terminal)

 pending_payment
      │
      └─── Huésped sube comprobante ──────────────────► awaiting_verification

 awaiting_verification
      │
      └─── Admin / Cloud Function valida pago ────────► confirmed (terminal)

 rejected / expired / confirmed → inmutables, no permiten más transiciones
```

**Regla de aprobación:**
- Si `bookingRequest.paymentProofUrl` existe al momento de aprobar → estado destino: `awaiting_verification`
- Si no existe → estado destino: `pending_payment`
- Esta lógica vive **exclusivamente en la Cloud Function** `approveBookingRequest`. El cliente nunca decide el estado destino.

---

## Tipos TypeScript — Definir antes de cualquier componente

```typescript
// src/types/booking-request.types.ts

export type BookingRequestStatus =
  | 'pending_host'
  | 'pending_payment'
  | 'awaiting_verification'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'cancelled_by_guest';

export interface BookingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  hostId: string;
  guestId: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  nights: number;
  guestCount: number;
  paymentMethod: 'ves' | 'usdt';
  totalAmount: number;
  anticipoAmount: number;
  remainingAmount: number;
  status: BookingRequestStatus;
  guestMessage: string;
  paymentProofUrl?: string;
  paymentReference?: string;
  hostResponse?: 'approved' | 'rejected';
  hostResponseNote?: string;
  hasDateConflict?: boolean;          // calculado al abrir el drawer
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingRequestAction {
  type: 'approve' | 'reject';
  requestId: string;
  hostNote?: string;
}
```

---

## Orden de implementación (resolución de dependencias primero)

```
FASE A — Contratos y servicios (sin UI)
  A1. BookingRequestStatus y BookingRequest en src/types/
  A2. subscribeToUserProfile en user-service.ts
  A3. Cloud Functions: approveBookingRequest + rejectBookingRequest
  A4. Reglas de Firestore para bookingRequests
      ↓
FASE B — Componente principal
  B1. GuestRequestVerificationDrawer.tsx (nuevo)
      ↓
FASE C — Integración en dashboard
  C1. BookingList.tsx (modificación)
  C2. AdminDashboard.tsx (modificación)
      ↓
FASE D — QA y verificación
  D1. Tests manuales del flujo completo
  D2. Verificación TypeScript + ESLint
  D3. Auditoría de reglas Firestore
```

---

## FASE A — Contratos y servicios

### A1. Tipos en `src/types/booking-request.types.ts`

Crear el archivo con los tipos definidos en la sección anterior. Este archivo es la única fuente de verdad para los estados. Ningún componente debe usar strings literales de estado — siempre importar `BookingRequestStatus`.

**Criterio de aceptación:** `tsc --noEmit` sin errores después de crear el archivo.

---

### A2. `user-service.ts` — Suscripción reactiva al perfil del huésped

```typescript
// MODIFICAR: src/services/user-service.ts

import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/user.types';

/**
 * Suscripción reactiva al perfil completo de un usuario.
 * Se usa en GuestRequestVerificationDrawer para mostrar el
 * Trust Score y estado KYC del huésped en tiempo real.
 *
 * @returns Unsubscribe — llamar al desmontar el componente
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  const ref = doc(db, 'users', uid);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}
```

**Uso en el drawer:**
```typescript
useEffect(() => {
  if (!request.guestId) return;
  const unsub = subscribeToUserProfile(request.guestId, setGuestProfile);
  return () => unsub();
}, [request.guestId]);
```

**Criterio de aceptación:** El perfil del huésped se actualiza en el drawer sin recargar la página si el Trust Score cambia en Firestore durante la sesión.

---

### A3. Cloud Functions

#### `approveBookingRequest`

```typescript
// functions/src/approveBookingRequest.ts

export const approveBookingRequest = functions.https.onCall(
  async (data: { requestId: string; hostNote?: string }, context) => {

    if (!context.auth) throw new functions.https.HttpsError(
      'unauthenticated', 'Autenticación requerida.'
    );

    const requestRef = db.collection('bookingRequests').doc(data.requestId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists) throw new functions.https.HttpsError(
        'not-found', 'Solicitud no encontrada.'
      );

      const request = snap.data() as BookingRequest;

      // Validar que el caller es el anfitrión del listing
      if (request.hostId !== context.auth!.uid) throw new functions.https.HttpsError(
        'permission-denied', 'Solo el anfitrión puede aprobar esta solicitud.'
      );

      // Validar que la solicitud sigue pendiente
      if (request.status !== 'pending_host') throw new functions.https.HttpsError(
        'failed-precondition', `No se puede aprobar una solicitud en estado ${request.status}.`
      );

      // Determinar estado destino según si hay comprobante
      const nextStatus: BookingRequestStatus = request.paymentProofUrl
        ? 'awaiting_verification'
        : 'pending_payment';

      tx.update(requestRef, {
        status: nextStatus,
        hostResponse: 'approved',
        hostResponseNote: data.hostNote ?? '',
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Notificación al huésped (fuera de la transacción)
    await notifyGuest(data.requestId, 'approved');
  }
);
```

#### `rejectBookingRequest`

```typescript
// functions/src/rejectBookingRequest.ts

export const rejectBookingRequest = functions.https.onCall(
  async (data: { requestId: string; hostNote: string }, context) => {

    if (!context.auth) throw new functions.https.HttpsError(
      'unauthenticated', 'Autenticación requerida.'
    );

    const requestRef = db.collection('bookingRequests').doc(data.requestId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists) throw new functions.https.HttpsError(
        'not-found', 'Solicitud no encontrada.'
      );

      const request = snap.data() as BookingRequest;

      if (request.hostId !== context.auth!.uid) throw new functions.https.HttpsError(
        'permission-denied', 'Solo el anfitrión puede rechazar esta solicitud.'
      );

      if (request.status !== 'pending_host') throw new functions.https.HttpsError(
        'failed-precondition', `No se puede rechazar una solicitud en estado ${request.status}.`
      );

      tx.update(requestRef, {
        status: 'rejected',
        hostResponse: 'rejected',
        hostResponseNote: data.hostNote,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Liberar soft-block de fechas en el mismo transaction
      const listingRef = db.collection('listings').doc(request.listingId);
      tx.update(listingRef, {
        [`blockedDates.${data.requestId}`]: FieldValue.delete(),
      });
    });

    await notifyGuest(data.requestId, 'rejected');
  }
);
```

**Criterio de aceptación de ambas functions:**
- El anfitrión no puede aprobar ni rechazar su propia solicitud como huésped.
- Un huésped no puede llamar a estas functions (validación de `hostId`).
- Una solicitud en estado terminal (`confirmed`, `rejected`, `expired`) no puede cambiar de estado.
- `tsc --noEmit` en la carpeta `functions/` sin errores.

---

### A4. Reglas de Firestore — `bookingRequests`

```javascript
// firestore.rules

match /bookingRequests/{requestId} {

  // Solo el huésped puede crear su solicitud
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.guestId
    && request.resource.data.status == 'pending_host'
    && request.resource.data.hostId != request.auth.uid; // no puede ser su propia prop

  // Huésped y anfitrión pueden leer
  allow read: if request.auth.uid == resource.data.guestId
           || request.auth.uid == resource.data.hostId;

  // El huésped puede subir su comprobante si la solicitud está pending_payment
  allow update: if request.auth.uid == resource.data.guestId
    && resource.data.status == 'pending_payment'
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['paymentProofUrl', 'paymentReference', 'updatedAt']);

  // Ningún cliente puede cambiar el status — solo Cloud Functions via Admin SDK
  // (las Cloud Functions no pasan por estas reglas, usan Admin SDK)

  // Nadie puede eliminar solicitudes — integridad de auditoría
  allow delete: if false;
}
```

---

## FASE B — Componente principal

### B1. `GuestRequestVerificationDrawer.tsx` (nuevo)

**Ruta:** `src/features/dashboard/components/GuestRequestVerificationDrawer.tsx`

#### Estructura visual

```
┌─── DRAWER LATERAL (480px, slide-in desde la derecha) ────────────┐
│                                                                    │
│  CABECERA                                                          │
│  [X]  Verificar solicitud · Ref #[ID corto]       ⏱ 18:42:30    │
│  [Título de la propiedad] · [fechas] · [N noches]                │
│  ──────────────────────────────────────────────────               │
│                                                                    │
│  PERFIL DEL HUÉSPED (Pasaporte VeneStay)                          │
│  [Avatar 56px]  Nombre completo                                   │
│                 Miembro desde [fecha]                             │
│                 [●●●●●●●●○○] Trust Score: 82/100                 │
│                 [✓ Identidad] [✓ Teléfono] [✓ Correo]            │
│                 [N reservas completadas]                          │
│  ──────────────────────────────────────────────────               │
│                                                                    │
│  DETALLE DEL VIAJE                                                │
│  Check-in    Check-out   Noches   Huéspedes                       │
│  30 may      31 may      1        2                               │
│  ⚠ [Alerta de solapamiento — si aplica]                          │
│  ──────────────────────────────────────────────────               │
│                                                                    │
│  MENSAJE DEL HUÉSPED                                              │
│  "Hola, viajamos en pareja desde Caracas..."                      │
│  ──────────────────────────────────────────────────               │
│                                                                    │
│  COMPROBANTE ADJUNTO (si existe)                                  │
│  [Miniatura] Ref: 4521-8833-XX                [Ver completo]      │
│  ──────────────────────────────────────────────────               │
│                                                                    │
│  DESGLOSE DE GANANCIAS (protocolo UCP 20/80)                      │
│  [20% círculo dorado]  Anticipo: 90 USDT  (huésped paga hoy)     │
│  [80% círculo navy]    Saldo:   360 USDT  (pagas al check-in)    │
│  Comisión plataforma: -45 USDT                                    │
│  Neto para ti: 405 USDT                                           │
│  ──────────────────────────────────────────────────               │
│                                                                    │
│  ACCIONES                                                          │
│  [💬 Enviar mensaje]                                              │
│  [✓ Aprobar reserva]              [✗ Rechazar]                   │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

#### Spec de componente

```typescript
// src/features/dashboard/components/GuestRequestVerificationDrawer.tsx

interface GuestRequestVerificationDrawerProps {
  request: BookingRequest | null;  // null = drawer cerrado
  onClose: () => void;
  onApproved: (requestId: string) => void;
  onRejected: (requestId: string) => void;
}
```

**Comportamientos requeridos:**

1. **Animación de entrada/salida:** `framer-motion` con `x: '100%'` → `x: 0`. Duración 280ms, ease `easeOut`. El overlay oscuro del fondo tiene opacidad 0.4 con transición de 200ms.

2. **Trust Score radial animado:** SVG circular con `strokeDasharray` calculado sobre el score. Color adaptativo: rojo si score < 40, dorado (`#C5A059`) si score 40–79, verde esmeralda si score ≥ 80. La animación del trazo se ejecuta al montar el componente con duración 600ms.

3. **Countdown de expiración:** Calculado como `expiresAt.toDate() - new Date()`. Se actualiza cada segundo con `setInterval`. Si quedan menos de 2 horas, el color cambia a rojo con un pulso sutil.

4. **Alerta de solapamiento:** Si `request.hasDateConflict === true`, mostrar un banner amarillo antes del detalle del viaje: *"Tienes otra reserva que se superpone con estas fechas. Verifica tu calendario antes de aprobar."*

5. **Botón de aprobación adaptativo:**
   - Sin comprobante: texto *"Aprobar y solicitar pago"*
   - Con comprobante: texto *"Aprobar solicitud"*
   - Ambos llaman a la Cloud Function `approveBookingRequest`

6. **Botón de rechazo:** Abre un `AlertDialog` interno que exige escribir el motivo (campo requerido, mínimo 10 caracteres). No se puede rechazar sin nota. El diálogo tiene dos acciones: "Cancelar" y "Confirmar rechazo".

7. **Estados de carga:** Los botones muestran spinner durante la llamada a la Cloud Function y se deshabilitan para evitar doble envío.

8. **Cierre tras acción:** Después de aprobar o rechazar, el drawer se cierra con animación y llama al callback correspondiente para que el padre actualice la lista.

---

## FASE C — Integración en el dashboard

### C1. `BookingList.tsx` — modificación

**Cambio:** En las tarjetas con estado `pending_host`, reemplazar los botones de aprobar/rechazar inline por un único botón que abre el drawer.

```tsx
// ANTES (botones inline — eliminar):
<button onClick={() => handleApprove(booking.id)}>Aprobar</button>
<button onClick={() => handleReject(booking.id)}>Rechazar</button>

// DESPUÉS (botón que abre el drawer):
{booking.status === 'pending_host' && (
  <button
    onClick={() => onVerifyRequest(booking)}
    className="flex items-center gap-2 rounded-xl border border-brand-gold
               px-4 py-2 text-xs font-semibold text-brand-navy
               transition-all hover:bg-brand-gold/10"
  >
    <Eye className="h-3.5 w-3.5" />
    Verificar solicitud
  </button>
)}
```

**Props nuevas a añadir:**
```typescript
interface BookingListProps {
  // ... props existentes ...
  onVerifyRequest: (booking: BookingRequest) => void;
}
```

### C2. `AdminDashboard.tsx` — integración del estado

```tsx
// AÑADIR al componente AdminDashboard:

const [selectedRequest, setSelectedRequest] =
  useState<BookingRequest | null>(null);

const handleRequestApproved = (requestId: string) => {
  setSelectedRequest(null);
  // El onSnapshot de la lista se actualiza automáticamente via Firestore
};

const handleRequestRejected = (requestId: string) => {
  setSelectedRequest(null);
};

// AÑADIR en el JSX:
<GuestRequestVerificationDrawer
  request={selectedRequest}
  onClose={() => setSelectedRequest(null)}
  onApproved={handleRequestApproved}
  onRejected={handleRequestRejected}
/>
```

---

## FASE D — Verificación y QA

### Tests manuales obligatorios

| # | Escenario | Pasos | Resultado esperado |
|:---|:---|:---|:---|
| T-01 | Drawer se abre correctamente | Crear solicitud como huésped → iniciar sesión como anfitrión → clic en "Verificar solicitud" | Drawer se desliza desde la derecha con todos los datos del huésped, Trust Score animado y countdown activo |
| T-02 | Trust Score en tiempo real | Con el drawer abierto, modificar el Trust Score del huésped en Firestore directamente | El valor en el drawer se actualiza sin cerrar ni recargar |
| T-03 | Aprobar sin comprobante | Solicitud sin comprobante → clic en "Aprobar y solicitar pago" | Estado en Firestore: `pending_payment`. Drawer se cierra. Huésped recibe notificación. |
| T-04 | Aprobar con comprobante | Solicitud con comprobante → clic en "Aprobar solicitud" | Estado en Firestore: `awaiting_verification`. Drawer se cierra. |
| T-05 | Rechazar con motivo | Clic en "Rechazar" → escribir motivo → confirmar | Estado: `rejected`. Fechas liberadas en el listing. Huésped notificado. |
| T-06 | Rechazar sin motivo | Clic en "Rechazar" → intentar confirmar sin escribir nada | El botón de confirmación permanece deshabilitado. No se puede rechazar. |
| T-07 | Expiración automática | Crear solicitud con `expiresAt = now + 2 min` → esperar | Estado pasa a `expired` automáticamente. Fechas del listing liberadas. |
| T-08 | Alerta de solapamiento | Crear solicitud cuyas fechas se superponen con una reserva confirmada | El drawer muestra el banner de advertencia amarillo. |
| T-09 | Flujo instant book intacto | Completar reserva normal en listing con `bookingMode === 'instant'` | El flujo funciona exactamente igual que antes. Sin regresión. |
| T-10 | Seguridad — anfitrión rechaza ajena | Llamar a `rejectBookingRequest` con un `requestId` de otra propiedad | Cloud Function devuelve `permission-denied`. Firestore no se modifica. |

### Verificación automatizada

```powershell
# Ejecutar en la raíz del proyecto
npm run lint
npx tsc --noEmit

# Ejecutar en la carpeta de functions
cd functions
npm run lint
npx tsc --noEmit
```

Los cuatro comandos deben retornar código de salida `0`.

### Verificación de accesibilidad (WCAG 2.2 AA)

- El countdown tiene `aria-live="polite"` para que los lectores de pantalla lo anuncien.
- Los botones "Aprobar" y "Rechazar" tienen `aria-label` descriptivo que incluye el nombre del huésped: `aria-label="Aprobar solicitud de Carlos M."`.
- El drawer tiene `role="dialog"` con `aria-labelledby` apuntando al título de la cabecera.
- El foco se mueve al interior del drawer al abrirse y regresa al botón "Verificar solicitud" al cerrarse.
- El Trust Score radial tiene `aria-label="Trust Score: 82 de 100"`.

---

## Criterio de aceptación global del sprint

El sprint S03 — Fase del Anfitrión se considera completo cuando:

- [ ] Los cuatro comandos de verificación retornan código `0`.
- [ ] Los diez tests manuales pasan sin errores.
- [ ] El drawer es funcional en Chrome móvil (390px) sin overflow ni scroll horizontal.
- [ ] Ninguna acción del anfitrión (aprobar / rechazar) puede ejecutarse desde el cliente sin pasar por la Cloud Function.
- [ ] El flujo de reserva instantánea (`bookingMode === 'instant'`) no presenta ninguna regresión.

---

*División de Ingeniería de IA — Antigravity · Mayo 2026*
*Versión: v2.0.0 — Reemplaza el plan original `implementation_plan_guest_verification_dashboard.md`*
