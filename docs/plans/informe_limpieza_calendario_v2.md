# Plan de Implementación v2.0: Corrección de Limpieza de Calendario
## SPEC-LISTINGS-ADMIN-CALENDAR-FIX · Sprint S04 · VeneStay v2.3.0

> **Versión:** v2.0 — Reemplaza `informe_limpieza_calendario.md`
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Junio 2026
> **Severidad de la propuesta original:** CRÍTICA — no debe implementarse tal como está

---

## ⚠️ Por qué NO aplicar la solución del informe original

El diagnóstico de causa raíz es correcto: `getReservedDates()` combina dos fuentes
(`blockedDates` del listing + `bookings` activos), y `clearListingCalendar` solo
limpia la primera. **La solución propuesta — cancelar masivamente todas las
reservas activas del listing — es la corrección equivocada.**

Esto:
1. Contradice el límite explícito ya definido en `SPEC-LISTINGS-ADMIN-CALENDAR`:
   *"NO debe modificar, cancelar o borrar reservas existentes en la colección bookings"*.
2. En producción, cancela reservas `CONFIRMED` de huéspedes reales que ya pagaron
   su garantía del 20% — pérdida de datos financieros irreversible.
3. El propio informe lo admite y lo justifica como "comportamiento deseado",
   lo cual es inaceptable para una herramienta sin distinción entre entornos.

**La causa raíz correcta no es "hay reservas que bloquean el calendario"** —
es **"no existe forma de distinguir una reserva de prueba de una reserva real"**.
Esa es la pieza que falta, y resolverla no requiere cancelar nada.

---

## Solución correcta: marcador `isTestBooking` + dos herramientas separadas

### Principio de diseño

Una herramienta de limpieza de calendario (ya especificada, opera sobre
`blockedDates`, nunca toca `bookings`) y una herramienta separada de
**purga de datos de prueba** (nueva, opera solo sobre reservas marcadas
explícitamente como prueba). Nunca el mismo botón, nunca el mismo alcance.

```
┌─────────────────────────────┬──────────────────────────────────────┐
│ Limpiar Calendario           │ Purgar Datos de Prueba                │
│ (ya implementado, v2)        │ (nuevo en este plan)                  │
├─────────────────────────────┼──────────────────────────────────────┤
│ Opera sobre: blockedDates    │ Opera sobre: bookings con             │
│ Preserva: hard-blocks         │   isTestBooking === true             │
│ Nunca toca: bookings          │ Acción: status → CANCELLED_BY_ADMIN  │
│                               │ Requiere: preview + confirmación      │
└─────────────────────────────┴──────────────────────────────────────┘
```

---

## Cambio 1 — Marcador `isTestBooking` en el modelo de datos

### Tipos

```typescript
// src/types/booking.types.ts

interface Booking {
  // ... campos existentes ...
  isTestBooking?: boolean;  // true solo si fue creado en modo demo/QA
}
```

### Cómo se asigna el marcador (en el origen, no después)

El marcador se establece **al crear la reserva**, no se infiere después.
Dos fuentes posibles, ambas ya existentes en la arquitectura:

```typescript
// functions/src/createRequestBooking.ts y flujos equivalentes
// Determinar isTestBooking al momento de crear el documento:

const guestTokenResult = await admin.auth().getUser(data.guestId);
const isTestBooking =
  guestTokenResult.customClaims?.isDemo === true ||  // cuenta demo (ya existe)
  guestTokenResult.customClaims?.qa === true;         // cuenta QA (ya existe)

await db.collection('bookings').doc(bookingId).set({
  ...payload,
  isTestBooking,
  // ...
});
```

**No requiere backfill complejo:** las reservas creadas antes de este cambio
no tienen el campo `isTestBooking`. Para la herramienta de purga, ausencia
del campo se trata como `false` (no es de prueba, no se toca).

---

## Cambio 2 — Nueva herramienta: `adminPurgeTestBookings`

### Servicio: `src/services/admin-service.ts` (nuevo)

```typescript
// src/services/admin-service.ts

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface TestBookingPreview {
  bookingId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface PurgePreviewResult {
  testBookings: TestBookingPreview[];
  count: number;
}

export interface PurgeResult {
  cancelledCount: number;
  releasedDates: number;
}

// Paso 1: obtener preview ANTES de ejecutar nada
export async function previewTestBookings(
  listingId: string
): Promise<PurgePreviewResult> {
  const fn = httpsCallable(functions, 'previewTestBookings');
  const result = await fn({ listingId });
  return result.data as PurgePreviewResult;
}

// Paso 2: ejecutar la purga solo de los IDs confirmados
export async function purgeTestBookings(
  listingId: string,
  bookingIds: string[]
): Promise<PurgeResult> {
  const fn = httpsCallable(functions, 'purgeTestBookings');
  const result = await fn({ listingId, bookingIds });
  return result.data as PurgeResult;
}
```

### Cloud Function: `previewTestBookings`

```typescript
// functions/src/previewTestBookings.ts

export const previewTestBookings = functions.https.onCall(
  async (data: { listingId: string }, context) => {

    if (!context.auth?.token.admin) {
      throw new HttpsError('permission-denied', 'Solo administradores.');
    }

    const snap = await db.collection('bookings')
      .where('listingId', '==', data.listingId)
      .where('isTestBooking', '==', true)
      .where('status', 'in', [
        'PENDING_APPROVAL', 'PENDING_PAYMENT',
        'AWAITING_VERIFICATION', 'CONFIRMED'
      ])
      .get();

    const testBookings = snap.docs.map(doc => {
      const b = doc.data();
      return {
        bookingId: doc.id,
        guestName: b.guestName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
      };
    });

    return { testBookings, count: testBookings.length };
  }
);
```

### Cloud Function: `purgeTestBookings`

```typescript
// functions/src/purgeTestBookings.ts

export const purgeTestBookings = functions.https.onCall(
  async (data: { listingId: string; bookingIds: string[] }, context) => {

    if (!context.auth?.token.admin) {
      throw new HttpsError('permission-denied', 'Solo administradores.');
    }

    if (data.bookingIds.length === 0) {
      return { cancelledCount: 0, releasedDates: 0 };
    }

    const batch = db.batch();
    let releasedDates = 0;

    for (const bookingId of data.bookingIds) {
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingSnap = await bookingRef.get();
      const booking = bookingSnap.data();

      // GUARD: verificación final — nunca tocar algo sin el marcador
      if (!booking || booking.isTestBooking !== true) {
        throw new HttpsError(
          'failed-precondition',
          `Booking ${bookingId} no está marcado como prueba. Operación abortada.`
        );
      }
      if (booking.listingId !== data.listingId) {
        throw new HttpsError('failed-precondition', 'Booking no pertenece a este listing.');
      }

      // Marcar como cancelado por admin (no eliminar — preserva historial)
      batch.update(bookingRef, {
        status: 'CANCELLED_BY_ADMIN',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: context.auth!.uid,
      });

      // Liberar el hard-block correspondiente en el listing
      const listingRef = db.collection('listings').doc(data.listingId);
      batch.update(listingRef, {
        [`blockedDates.${bookingId}`]: FieldValue.delete(),
      });
      releasedDates++;
    }

    await batch.commit();

    // Audit trail
    await db.collection('adminActions').add({
      action: 'PURGE_TEST_BOOKINGS',
      listingId: data.listingId,
      bookingIds: data.bookingIds,
      cancelledCount: data.bookingIds.length,
      adminUid: context.auth!.uid,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { cancelledCount: data.bookingIds.length, releasedDates };
  }
);
```

---

## Cambio 3 — UI: confirmación con preview obligatorio

```tsx
// src/features/listings/components/ListingDetail.tsx
// Dentro del panel de administración, junto a "Limpiar calendario"

const [previewData, setPreviewData] = useState<TestBookingPreview[] | null>(null);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const handlePreview = async () => {
  const result = await previewTestBookings(listing.id);
  if (result.count === 0) {
    toast.info('No hay reservas de prueba asociadas a esta propiedad.');
    return;
  }
  setPreviewData(result.testBookings);
  setSelectedIds(new Set(result.testBookings.map(b => b.bookingId)));
};

const handlePurge = async () => {
  const result = await purgeTestBookings(listing.id, Array.from(selectedIds));
  toast.success(`${result.cancelledCount} reserva(s) de prueba canceladas. ${result.releasedDates} fecha(s) liberadas.`);
  setPreviewData(null);
};
```

```tsx
{previewData && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
    <p className="text-xs font-medium text-red-800">
      Se encontraron {previewData.length} reserva(s) marcadas como prueba.
      Selecciona cuáles cancelar:
    </p>

    {previewData.map(b => (
      <label key={b.bookingId} className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={selectedIds.has(b.bookingId)}
          onChange={(e) => {
            const next = new Set(selectedIds);
            e.target.checked ? next.add(b.bookingId) : next.delete(b.bookingId);
            setSelectedIds(next);
          }}
        />
        {b.guestName} · {b.checkIn} → {b.checkOut} · {b.status}
      </label>
    ))}

    <div className="flex gap-2">
      <button
        onClick={handlePurge}
        disabled={selectedIds.size === 0}
        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        Cancelar {selectedIds.size} reserva(s) seleccionada(s)
      </button>
      <button onClick={() => setPreviewData(null)} className="rounded-xl border px-4 py-2 text-xs">
        Cerrar
      </button>
    </div>
  </div>
)}
```

---

## Reglas de Firestore

```javascript
// firestore.rules

match /bookings/{bookingId} {
  // Permitir transición a CANCELLED_BY_ADMIN solo a admins,
  // y solo si el booking tiene isTestBooking == true
  allow update: if request.auth.token.admin == true
    && resource.data.isTestBooking == true
    && request.resource.data.status == 'CANCELLED_BY_ADMIN'
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['status', 'cancelledAt', 'cancelledBy']);
}

match /adminActions/{actionId} {
  allow create, read: if request.auth.token.admin == true;
  allow update, delete: if false;
}
```

---

## Por qué esta solución es segura por diseño

| Mecanismo | Qué previene |
|:---|:---|
| `isTestBooking` se asigna al crear, no se infiere después | Imposible marcar retroactivamente una reserva real como prueba |
| Cloud Function valida `isTestBooking === true` antes de tocar cualquier doc | Aunque el cliente envíe IDs arbitrarios, el servidor rechaza cualquier booking real |
| Preview obligatorio antes de cualquier cancelación | El admin ve exactamente qué se va a cancelar antes de confirmarlo |
| Selección granular (checkboxes) | El admin puede excluir bookings específicos del preview |
| `CANCELLED_BY_ADMIN` en lugar de borrado físico | El historial de chat y pagos permanece íntegro |
| Audit trail en `/adminActions/` | Cualquier purga queda registrada con admin, timestamp y IDs afectados |
| Reglas de Firestore como segunda barrera | Incluso si el cliente está comprometido, la regla bloquea la escritura |

---

## Plan de verificación

| # | Escenario | Resultado esperado |
|:---|:---|:---|
| P-01 | Crear reserva con cuenta demo (`isDemo: true`) | `isTestBooking: true` en el documento |
| P-02 | Crear reserva con cuenta real | `isTestBooking` ausente o `false` |
| P-03 | Admin pulsa "Purgar Datos de Prueba" en listing sin reservas de prueba | Toast: "No hay reservas de prueba" — sin llamada de cancelación |
| P-04 | Admin pulsa con 2 reservas de prueba existentes | Preview muestra las 2, ambas pre-seleccionadas |
| P-05 | Admin deselecciona 1 y confirma | Solo 1 reserva pasa a `CANCELLED_BY_ADMIN`, 1 permanece intacta |
| P-06 | Verificar `blockedDates` tras la purga | Solo se eliminó el hard-block de la reserva cancelada |
| P-07 | Intentar `purgeTestBookings` con un ID de reserva real (`isTestBooking` ausente) | Cloud Function lanza `failed-precondition`, batch abortado completo |
| P-08 | Verificar `/adminActions/` | Documento creado con `bookingIds`, `adminUid`, `timestamp` |
| P-09 | `tsc --noEmit` y `eslint .` | Sin errores |

---

*División de Ingeniería de IA — Antigravity · Junio 2026*
*v2.0 — Reemplaza `informe_limpieza_calendario.md`. No implementar la cancelación masiva propuesta originalmente.*
