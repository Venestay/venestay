# Plan de Implementación v2.0: Botón de Limpieza de Calendario (Admin)
## SPEC-LISTINGS-ADMIN-CALENDAR · Sprint S04 · VeneStay v2.3.0

> **Versión:** v2.0 — Reemplaza `implementation_plan.md` original
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Junio 2026

---

## Correcciones respecto a la spec original

**Corrección 1 — Verificación de admin en Firestore rules, no solo en el cliente.**
`user?.role === 'admin'` es un check de UI que puede ser manipulado desde el estado local del navegador. La verificación real debe estar en `firestore.rules` usando Custom Claims (`request.auth.token.admin == true`), siguiendo el patrón ya establecido en la arquitectura de VeneStay.

**Corrección 2 — Limpieza selectiva, no total.**
Setear `blockedDates: []` borra también los hard-blocks de reservas `CONFIRMED` y `AWAITING_VERIFICATION`, creando inconsistencia entre el calendario y la colección `bookings`. La limpieza debe preservar los bloqueos de reservas activas.

---

## SPEC ATÓMICA — 2026-06-09
**ID:** SPEC-LISTINGS-ADMIN-CALENDAR
**Sprint:** S04
**Prioridad:** P1

---

### Contexto
El equipo de administración necesita una forma rápida desde la interfaz para limpiar el calendario de una propiedad individual durante soporte y pruebas de QA, sin depender de scripts globales ni acceso directo a Firebase Console.

---

### Prerequisito: verificar estructura de `blockedDates`

Antes de implementar, confirmar en Firestore la estructura actual del campo `blockedDates` en el documento de un listing real:

```typescript
// Confirmar cuál de estas dos estructuras usa el proyecto:

// Opción A — Array de strings (fechas ISO):
blockedDates: string[]
// Ejemplo: ["2026-06-10", "2026-06-11", "2026-06-12"]

// Opción B — Mapa indexado por bookingId:
blockedDates: Record<string, { start: string; end: string; type: 'soft' | 'hard' }>
// Ejemplo: { "abc123": { start: "2026-06-10", end: "2026-06-12", type: "hard" } }
```

El tipo correcto debe añadirse a `src/types/listing.types.ts` antes de implementar. La lógica de limpieza selectiva varía según la estructura.

**Para el resto de esta spec se asume Opción B (mapa por bookingId)** por ser la estructura que permite preservar hard-blocks. Si el proyecto usa Opción A, la limpieza selectiva requiere una Cloud Function que cruce con la colección `bookings`.

---

### Alcance

| Campo | Valor |
|:---|:---|
| Capa FSD | `services`, `features/listings` |
| Archivo 1 | `src/types/listing.types.ts` — MODIFICAR |
| Archivo 2 | `src/services/listing-service.ts` — CREAR función |
| Archivo 3 | `src/features/listings/components/ListingDetail.tsx` — MODIFICAR |
| Archivo 4 | `firestore.rules` — MODIFICAR |

---

### Qué debe hacer

#### 1. Tipos en `src/types/listing.types.ts`

```typescript
// Añadir al tipo Listing:

export type BlockedDateType = 'soft' | 'hard';

export interface BlockedDateEntry {
  start: string;        // ISO 8601
  end: string;          // ISO 8601
  type: BlockedDateType; // soft = pendiente/temporal, hard = confirmado
  bookingId: string;    // referencia a /bookings/{id}
}

// Modificar en Listing:
blockedDates: Record<string, BlockedDateEntry>; // key = bookingId
```

#### 2. Función `adminClearListingCalendar` en `src/services/listing-service.ts`

La función limpia **solo** los soft-blocks. Los hard-blocks (reservas confirmadas o en verificación) se preservan para evitar double-booking.

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlockedDateEntry } from '@/types/listing.types';

export interface ClearCalendarResult {
  removedCount: number;   // cantidad de soft-blocks eliminados
  preservedCount: number; // cantidad de hard-blocks preservados
}

export async function adminClearListingCalendar(
  listingId: string,
  currentBlockedDates: Record<string, BlockedDateEntry>
): Promise<ClearCalendarResult> {

  // Separar soft-blocks (eliminables) de hard-blocks (preservar)
  const hardBlocks: Record<string, BlockedDateEntry> = {};
  let removedCount = 0;

  for (const [bookingId, entry] of Object.entries(currentBlockedDates)) {
    if (entry.type === 'hard') {
      hardBlocks[bookingId] = entry;
    } else {
      removedCount++;
    }
  }

  const preservedCount = Object.keys(hardBlocks).length;

  // Actualizar Firestore con solo los hard-blocks
  const listingRef = doc(db, 'listings', listingId);
  await updateDoc(listingRef, {
    blockedDates: hardBlocks,
  });

  // Registrar la acción en el audit trail
  await logAdminAction({
    action: 'CLEAR_LISTING_CALENDAR',
    listingId,
    removedCount,
    preservedCount,
  });

  return { removedCount, preservedCount };
}

// Audit trail — escribe en /adminActions/{id}
async function logAdminAction(payload: {
  action: string;
  listingId: string;
  removedCount: number;
  preservedCount: number;
}) {
  const { addDoc, collection, serverTimestamp, getAuth } = await import('firebase/firestore');
  const auth = getAuth();
  await addDoc(collection(db, 'adminActions'), {
    ...payload,
    adminUid: auth.currentUser?.uid ?? 'unknown',
    timestamp: serverTimestamp(),
  });
}
```

#### 3. Reglas de Firestore — `firestore.rules`

Añadir permiso de escritura para admins (Custom Claims) sobre el campo `blockedDates` del listing. El resto de los campos del listing mantienen sus reglas actuales:

```javascript
// firestore.rules — sección de /listings/{listingId}

match /listings/{listingId} {
  // Regla existente para el host (no modificar)
  allow update: if request.auth.uid == resource.data.hostId
    && !request.resource.data.diff(resource.data)
       .affectedKeys().hasAny(['hostId', 'createdAt']);

  // NUEVA REGLA: admin puede limpiar blockedDates
  allow update: if request.auth.token.admin == true
    && request.resource.data.diff(resource.data)
       .affectedKeys().hasOnly(['blockedDates']);
}

// Audit trail: solo admins pueden escribir en adminActions
match /adminActions/{actionId} {
  allow create: if request.auth.token.admin == true;
  allow read: if request.auth.token.admin == true;
  allow update, delete: if false;
}
```

#### 4. Modificación en `ListingDetail.tsx`

El botón vive en la sección de metadatos del listing (junto al estado de publicación y el rating), visible solo para admins autenticados con Custom Claim.

```tsx
// src/features/listings/components/ListingDetail.tsx

import { useState } from 'react';
import { toast } from 'sonner';                           // usar sonner, no react-hot-toast
import { adminClearListingCalendar } from '@/services/listing-service';
import type { ClearCalendarResult } from '@/services/listing-service';

// Dentro del componente ListingDetail:

const { claims } = await user.getIdTokenResult();        // leer Custom Claims
const isAdmin = claims?.admin === true;                   // verificación correcta

const [isClearing, setIsClearing] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);

const handleClearCalendar = async () => {
  setIsClearing(true);
  try {
    const result: ClearCalendarResult = await adminClearListingCalendar(
      listing.id,
      listing.blockedDates ?? {}
    );

    const message = result.preservedCount > 0
      ? `Calendario limpiado. Se eliminaron ${result.removedCount} bloqueo(s). Se preservaron ${result.preservedCount} reserva(s) confirmada(s).`
      : `Calendario limpiado. Se eliminaron ${result.removedCount} bloqueo(s).`;

    toast.success(message);
    setShowConfirm(false);
  } catch (err) {
    toast.error('Error al limpiar el calendario. Verifica los permisos.');
  } finally {
    setIsClearing(false);
  }
};

// JSX — colocar en la sección de metadatos del listing,
// DESPUÉS del badge de estado de publicación:

{isAdmin && (
  <div className="mt-4 border-t border-dashed border-red-200 pt-4">
    <p className="mb-2 text-[10px] font-black tracking-widest text-red-400 uppercase">
      Panel de administración
    </p>

    {!showConfirm ? (
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 rounded-xl border border-red-200
                   bg-red-50 px-4 py-2 text-xs font-semibold text-red-700
                   transition-all hover:bg-red-100"
      >
        <CalendarX className="h-3.5 w-3.5" aria-hidden="true" />
        Limpiar calendario
      </button>
    ) : (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-xs font-medium text-red-800">
          ¿Confirmas? Esta acción eliminará todos los bloqueos temporales.
          Las reservas confirmadas no serán afectadas.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleClearCalendar}
            disabled={isClearing}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold
                       text-white disabled:opacity-50 hover:bg-red-700"
            aria-label="Confirmar limpieza del calendario"
          >
            {isClearing ? 'Limpiando...' : 'Confirmar limpieza'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs
                       font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

---

### Qué NO debe hacer (límites — sin cambios respecto al original)

- NO cancelar, modificar ni borrar documentos en la colección `bookings`.
- NO ser visible para usuarios con rol `host`, ni para huéspedes.
- NO limpiar bloqueos de reservas en estado `CONFIRMED` o `AWAITING_VERIFICATION`.

---

### Criterios de aceptación (actualizados)

- [ ] CA-1: El botón es visible únicamente para usuarios con Custom Claim `admin: true`. Un usuario con `user.role === 'admin'` en Firestore pero sin el Custom Claim **no** ve el botón.
- [ ] CA-2: Al intentar la operación sin Custom Claim `admin`, Firestore retorna `permission-denied`.
- [ ] CA-3: Al confirmar la limpieza, los soft-blocks son eliminados de `blockedDates` en Firestore.
- [ ] CA-4: Los hard-blocks (reservas `CONFIRMED` o `AWAITING_VERIFICATION`) permanecen en `blockedDates` después de la limpieza.
- [ ] CA-5: Se crea un documento en `/adminActions/` con `action`, `listingId`, `removedCount`, `preservedCount`, `adminUid` y `timestamp`.
- [ ] CA-6: El botón muestra un estado de carga (`"Limpiando..."`) y se deshabilita durante la operación.
- [ ] CA-7: El `toast` de resultado usa `sonner` (no `react-hot-toast`) e informa cuántos bloqueos fueron eliminados y cuántos preservados.
- [ ] CA-8: Si no hay soft-blocks que limpiar, el toast lo indica: `"No hay bloqueos temporales que limpiar."` sin llamar a Firestore.
- [ ] CA-9: `tsc --noEmit` sin errores en `src/` y en los tipos nuevos.
- [ ] CA-10: `eslint .` sin errores severos.

---

### Plan de verificación

#### Automatizado
```powershell
npm run lint
npx tsc --noEmit
```

#### Manual
1. Iniciar sesión con cuenta sin Custom Claim `admin` → verificar que el botón no aparece.
2. Iniciar sesión con cuenta con Custom Claim `admin` → verificar que el botón aparece en la sección de metadatos con borde de administración.
3. Hacer clic en "Limpiar calendario" → verificar que aparece el diálogo de confirmación, no ejecución inmediata.
4. Confirmar → verificar que los soft-blocks desaparecen de `blockedDates` en Firestore Console.
5. Verificar que los hard-blocks (de reservas confirmadas) permanecen en `blockedDates`.
6. Verificar que existe un nuevo documento en `/adminActions/` con los datos correctos.
7. Verificar que el toast muestra los contadores correctos.
8. Intentar la operación vía DevTools con una cuenta sin Custom Claim → Firestore debe retornar `permission-denied`.

---

*División de Ingeniería de IA — Antigravity · Junio 2026*
*v2.0 — Reemplaza el plan original*
