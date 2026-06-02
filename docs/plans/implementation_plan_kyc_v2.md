# Plan de Implementación v2.0: Pasaporte y Verificación de Identidad (KYC)
## VeneStay v2.3.0 · Arquitectura Segura · Cloud-First

> **Sprint:** S04 — KYC & Identity Verification
> **Nodo activo:** Nodo 2 — Planner (Spec Architect)
> **QA Gate previo:** OK
> **Versión:** v2.0 — Reemplaza `implementation_plan.md` original
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Mayo 2026

---

## Correcciones críticas respecto al plan original

El plan original contenía tres violaciones de arquitectura que bloquean el despliegue y deben resolverse antes de escribir cualquier componente:

**Violación 1 — Escritura directa de campos de seguridad desde el cliente.** Los campos `kycStatus`, `isIdentityVerified` y `trustScore` no pueden ser escritos por ningún cliente, incluso autenticado. Un usuario podría llamar a `updateDoc` y establecer `isIdentityVerified: true` sin haber subido ningún documento. Toda modificación de estos campos ocurre exclusivamente en Cloud Functions via Admin SDK.

**Violación 2 — Reglas de Storage diferidas a Fase 3.** Las reglas que protegen `/kyc/{uid}/` son un prerrequisito de Fase 1. Sin ellas, cualquier usuario autenticado puede leer el documento de identidad de otro usuario desde el momento en que el primer documento sea subido.

**Violación 3 — Trust Score calculado como operación cliente.** La lógica de +40% al `trustScore` al aprobar KYC debe ejecutarse en la Cloud Function `approveKYC`, no en el dashboard del admin.

---

## Máquina de estados completa (contrato de datos)

Definir antes de cualquier componente. Ningún técnico escribe código que produzca o consuma un estado sin esta referencia.

```
NOT_SUBMITTED  → (usuario sube documento)      → PENDING_REVIEW
PENDING_REVIEW → (admin aprueba, Cloud Fn)      → VERIFIED        (terminal positivo)
PENDING_REVIEW → (admin rechaza, Cloud Fn)      → REJECTED
REJECTED       → (usuario re-sube documento)    → PENDING_REVIEW
VERIFIED       → (solo admin puede revocar)     → REVOKED          (reservado para futuro)
```

**Reglas de transición:**
- Ningún cliente puede escribir `kycStatus` directamente. Solo Cloud Functions via Admin SDK.
- Un usuario en `PENDING_REVIEW` no puede subir un segundo documento. El botón queda deshabilitado.
- Un usuario `VERIFIED` no puede re-verificar. El panel muestra estado final.
- `REJECTED` → `PENDING_REVIEW` ocurre cuando el usuario sube un nuevo documento. El documento anterior ya fue borrado por la Cloud Function de rechazo.

---

## Tipos TypeScript (definir primero)

```typescript
// src/types/user.types.ts

export type KYCStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REVOKED';

export interface KYCStatusHistoryEntry {
  status: KYCStatus;
  timestamp: string;        // ISO 8601
  actorId: string;          // uid del admin o 'user' si fue el usuario
  actorRole: 'user' | 'admin';
  note?: string;            // obligatorio si status === 'REJECTED'
}

export interface UserKYCFields {
  kycStatus: KYCStatus;
  kycDocumentUrl?: string;   // solo presente en PENDING_REVIEW
  isIdentityVerified: boolean;
  kycStatusHistory: KYCStatusHistoryEntry[];
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  kycRejectionNote?: string;
}
```

**Nota de seguridad:** `kycDocumentUrl` existe en Firestore solo mientras el documento está en `PENDING_REVIEW`. Al aprobar: el URL se mantiene para referencia del admin. Al rechazar: el campo se elimina y el archivo de Storage se borra. Esta URL nunca debe exponerse al cliente directamente — el componente de revisión del admin usa una Cloud Function que genera una URL firmada con expiración de 30 minutos.

---

## Fase 1 — MVP KYC (2–3 días, P0)

### Objetivo
El usuario puede subir su cédula o pasaporte. El documento se persiste de forma segura en Firebase Storage bajo `/kyc/{uid}/`. El estado `kycStatus` cambia a `PENDING_REVIEW` via Cloud Function. El campo `kycDocumentUrl` es establecido por el servidor, no por el cliente.

### Prerrequisito obligatorio: Reglas de Storage (antes de cualquier upload)

```javascript
// storage.rules — DEBE estar en producción antes del primer upload de KYC

match /kyc/{userId}/{fileName} {
  // Solo el propietario puede subir su propio documento
  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.size < 5 * 1024 * 1024
    && (request.resource.contentType.matches('image/.*')
        || request.resource.contentType == 'application/pdf')
    // Solo permitir si el estado actual es NOT_SUBMITTED o REJECTED
    // (evita reemplazar documentos en PENDING_REVIEW)
    && firestore.get(/databases/(default)/documents/users/$(userId))
               .data.kycStatus in ['NOT_SUBMITTED', 'REJECTED'];

  // NADIE puede leer directamente — solo Cloud Functions via Admin SDK
  // o URLs firmadas generadas por funciones server-side
  allow read: if false;
}
```

### Schema Zod para el formulario

```typescript
// src/features/auth/schemas/kyc.schema.ts

import { z } from 'zod';

export const kycSubmissionSchema = z.object({
  documentType: z.enum(['cedula', 'pasaporte'], {
    required_error: 'Selecciona el tipo de documento',
  }),
  // El archivo se valida fuera de Zod (type="file" no es compatible con Zod directamente)
  // Se valida manualmente antes de llamar al servicio
});

export type KYCSubmissionData = z.infer<typeof kycSubmissionSchema>;

// Validación de archivo (helper function)
export function validateKYCFile(file: File): string | null {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (file.size > MAX_SIZE) {
    return 'El archivo no puede superar 5MB';
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se aceptan imágenes JPG, PNG, WebP o archivos PDF';
  }
  return null;
}
```

### Cloud Function: `submitKYCDocument`

Esta función reemplaza la escritura directa del cliente. Es el único actor que puede establecer `kycStatus: 'PENDING_REVIEW'` y `kycDocumentUrl`.

```typescript
// functions/src/submitKYCDocument.ts

export const submitKYCDocument = functions.https.onCall(
  async (data: { documentType: 'cedula' | 'pasaporte'; storageFileName: string }, context) => {

    if (!context.auth) throw new HttpsError('unauthenticated', '');

    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();

      // Verificar que el estado permite subir
      if (!['NOT_SUBMITTED', 'REJECTED'].includes(user?.kycStatus)) {
        throw new HttpsError(
          'failed-precondition',
          `No se puede subir un documento en estado ${user?.kycStatus}.`
        );
      }

      // Verificar que el archivo existe en Storage antes de registrarlo
      const storagePath = `kyc/${uid}/${data.storageFileName}`;
      try {
        await admin.storage().bucket().file(storagePath).getMetadata();
      } catch {
        throw new HttpsError('not-found', 'El archivo no se encontró en Storage.');
      }

      const historyEntry: KYCStatusHistoryEntry = {
        status: 'PENDING_REVIEW',
        timestamp: new Date().toISOString(),
        actorId: uid,
        actorRole: 'user',
      };

      tx.update(userRef, {
        kycStatus: 'PENDING_REVIEW',
        kycDocumentUrl: storagePath,  // path relativo, no URL pública
        kycDocumentType: data.documentType,
        isIdentityVerified: false,
        kycSubmittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        kycStatusHistory: FieldValue.arrayUnion(historyEntry),
      });
    });

    // Notificar a admins de nueva solicitud pendiente
    await notifyAdmins({
      title: 'Nueva verificación KYC pendiente',
      body: `Un usuario acaba de subir su documento de identidad.`,
      data: { type: 'kyc_pending', uid },
    });

    return { success: true };
  }
);
```

### Servicio cliente: `kyc-service.ts` (nuevo)

```typescript
// src/services/kyc-service.ts

import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';

export async function uploadAndSubmitKYCDocument(
  userId: string,
  file: File,
  documentType: 'cedula' | 'pasaporte'
): Promise<void> {

  // 1. Subir el archivo a Storage
  const fileName = `${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
  const storageRef = ref(storage, `kyc/${userId}/${fileName}`);
  await uploadBytes(storageRef, file);

  // 2. Llamar a la Cloud Function para registrar en Firestore
  // (el cliente NUNCA escribe kycStatus directamente)
  const submitFn = httpsCallable(functions, 'submitKYCDocument');
  await submitFn({ documentType, storageFileName: fileName });
}
```

### Modificaciones de componentes (Fase 1)

#### `VerificationModal.tsx`

```typescript
// CAMBIO PRINCIPAL: reemplazar escritura directa de Firestore por kyc-service.ts

const handleSubmit = async () => {
  if (!file || !documentType) return;

  const error = validateKYCFile(file);
  if (error) { setFileError(error); return; }

  setIsLoading(true);
  try {
    await uploadAndSubmitKYCDocument(currentUser.uid, file, documentType);
    onSuccess(); // cierra el modal
  } catch (err) {
    setError('Error al enviar el documento. Inténtalo de nuevo.');
  } finally {
    setIsLoading(false);
  }
};
```

#### `SecuritySection.tsx`

Mostrar los cuatro estados posibles con feedback claro:

```tsx
const kycStatusConfig = {
  NOT_SUBMITTED: {
    label: 'Sin verificar',
    description: 'Sube tu cédula o pasaporte para aumentar tu Trust Score.',
    action: 'Verificar identidad',
    color: 'text-gray-500',
  },
  PENDING_REVIEW: {
    label: 'En revisión',
    description: 'Tu documento fue recibido y está siendo revisado. Tiempo estimado: 24-48h.',
    action: null,  // botón deshabilitado
    color: 'text-amber-600',
  },
  VERIFIED: {
    label: 'Verificado',
    description: 'Tu identidad ha sido confirmada. Tu Trust Score incluye el bono de verificación.',
    action: null,
    color: 'text-emerald-600',
  },
  REJECTED: {
    label: 'Rechazado',
    description: user.kycRejectionNote || 'El documento no pudo ser verificado.',
    action: 'Volver a intentar',
    color: 'text-red-600',
  },
};
```

#### `usePassportForm.ts`

Añadir exclusión explícita de campos KYC sensibles de la sincronización a `localStorage`:

```typescript
// Los campos KYC NUNCA se sincronizan a localStorage
const EXCLUDED_FROM_LOCAL_STORAGE = [
  'kycStatus',
  'kycDocumentUrl',
  'kycDocumentType',
  'kycStatusHistory',
  'isIdentityVerified',
];

// Al sincronizar a localStorage, filtrar campos excluidos
const safeFieldsToSync = Object.fromEntries(
  Object.entries(formData).filter(([key]) => !EXCLUDED_FROM_LOCAL_STORAGE.includes(key))
);
localStorage.setItem('passport_draft', JSON.stringify(safeFieldsToSync));
```

---

## Fase 2 — Panel de Auditoría Admin (P1)

### Objetivo
El administrador puede revisar documentos KYC pendientes, ver una previsualización segura del documento y aprobar o rechazar cada caso.

### Cloud Function: `approveKYC`

```typescript
// functions/src/approveKYC.ts

export const approveKYC = functions.https.onCall(
  async (data: { targetUserId: string }, context) => {

    // Verificar rol admin via Custom Claims (nunca un campo Firestore)
    if (!context.auth?.token.admin) {
      throw new HttpsError('permission-denied', 'Acción reservada para administradores.');
    }

    const userRef = db.collection('users').doc(data.targetUserId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();

      if (user?.kycStatus !== 'PENDING_REVIEW') {
        throw new HttpsError(
          'failed-precondition',
          `No se puede aprobar un usuario en estado ${user?.kycStatus}.`
        );
      }

      // Calcular nuevo Trust Score (lógica de negocio en servidor)
      const currentScore = user.trustScore ?? 0;
      const kycBonus = 40;
      const newScore = Math.min(100, currentScore + kycBonus);

      const historyEntry: KYCStatusHistoryEntry = {
        status: 'VERIFIED',
        timestamp: new Date().toISOString(),
        actorId: context.auth!.uid,
        actorRole: 'admin',
      };

      tx.update(userRef, {
        kycStatus: 'VERIFIED',
        isIdentityVerified: true,
        trustScore: newScore,
        kycReviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        kycStatusHistory: FieldValue.arrayUnion(historyEntry),
      });
    });

    // Notificación push al usuario
    await notifyUser(data.targetUserId, {
      title: '¡Tu identidad fue verificada!',
      body: 'Tu Pasaporte VeneStay ahora muestra el sello de verificación.',
      data: { type: 'kyc_approved' },
    });

    return { success: true };
  }
);
```

### Cloud Function: `rejectKYC`

```typescript
// functions/src/rejectKYC.ts

export const rejectKYC = functions.https.onCall(
  async (data: { targetUserId: string; note: string }, context) => {

    if (!context.auth?.token.admin) {
      throw new HttpsError('permission-denied', '');
    }

    if (!data.note || data.note.trim().length < 10) {
      throw new HttpsError('invalid-argument', 'El motivo del rechazo es obligatorio (mínimo 10 caracteres).');
    }

    const userRef = db.collection('users').doc(data.targetUserId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();

      if (user?.kycStatus !== 'PENDING_REVIEW') {
        throw new HttpsError('failed-precondition', '');
      }

      // Borrar el archivo de Storage dentro de la misma operación lógica
      if (user.kycDocumentUrl) {
        await admin.storage().bucket().file(user.kycDocumentUrl).delete();
      }

      const historyEntry: KYCStatusHistoryEntry = {
        status: 'REJECTED',
        timestamp: new Date().toISOString(),
        actorId: context.auth!.uid,
        actorRole: 'admin',
        note: data.note,
      };

      tx.update(userRef, {
        kycStatus: 'REJECTED',
        isIdentityVerified: false,
        kycDocumentUrl: FieldValue.delete(),   // borrar la referencia del documento
        kycRejectionNote: data.note,
        kycReviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        kycStatusHistory: FieldValue.arrayUnion(historyEntry),
      });
    });

    // Notificación al usuario con el motivo
    await notifyUser(data.targetUserId, {
      title: 'Verificación de identidad no aprobada',
      body: data.note,
      data: { type: 'kyc_rejected' },
    });

    return { success: true };
  }
);
```

### Cloud Function: `getKYCDocumentSignedURL`

El admin nunca accede directamente al Storage. Esta función genera una URL firmada con expiración de 30 minutos:

```typescript
// functions/src/getKYCDocumentSignedURL.ts

export const getKYCDocumentSignedURL = functions.https.onCall(
  async (data: { targetUserId: string }, context) => {

    if (!context.auth?.token.admin) throw new HttpsError('permission-denied', '');

    const userSnap = await db.collection('users').doc(data.targetUserId).get();
    const user = userSnap.data();

    if (!user?.kycDocumentUrl) throw new HttpsError('not-found', 'Sin documento.');
    if (user.kycStatus !== 'PENDING_REVIEW') throw new HttpsError('failed-precondition', '');

    const [signedUrl] = await admin.storage()
      .bucket()
      .file(user.kycDocumentUrl)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 30 * 60 * 1000, // 30 minutos
      });

    return { signedUrl };
  }
);
```

### Nuevo componente: `KYCAuditPanel.tsx`

```typescript
// src/features/dashboard/components/KYCAuditPanel.tsx

// Consulta usuarios con kycStatus === 'PENDING_REVIEW'
// Para cada usuario muestra:
//   - Nombre, foto de perfil, fecha de registro
//   - Trust Score actual
//   - Tipo de documento subido
//   - Botón "Ver documento" → llama a getKYCDocumentSignedURL → abre en modal
//   - Botón "Aprobar" → llama a approveKYC Cloud Function
//   - Botón "Rechazar" → abre modal con textarea para motivo obligatorio → llama a rejectKYC

// El componente NUNCA lee kycDocumentUrl directamente de Firestore
// Solo usa URLs firmadas generadas por la Cloud Function
```

### Reglas Firestore — `kycStatus` y campos sensibles

```javascript
// firestore.rules — perfil de usuario

match /users/{userId} {
  // El usuario puede leer y actualizar campos de perfil general
  allow read: if request.auth.uid == userId;

  allow update: if request.auth.uid == userId
    // El usuario NUNCA puede escribir estos campos desde el cliente
    && !('kycStatus' in request.resource.data.diff(resource.data).affectedKeys())
    && !('isIdentityVerified' in request.resource.data.diff(resource.data).affectedKeys())
    && !('trustScore' in request.resource.data.diff(resource.data).affectedKeys())
    && !('kycDocumentUrl' in request.resource.data.diff(resource.data).affectedKeys())
    && !('kycStatusHistory' in request.resource.data.diff(resource.data).affectedKeys());

  // Admins pueden leer perfiles para el panel de auditoría
  allow read: if request.auth.token.admin == true;

  // Admins NO escriben directamente — solo via Cloud Functions (Admin SDK bypasses rules)
}
```

---

## Fase 3 — Hardening completo e integración con checkout (P2)

### Checkout y estado KYC intermedio

El checkout ya bloquea con `trustScore < 40%`. Con el flujo KYC, un usuario en `PENDING_REVIEW` queda en un estado ambiguo. La spec correcta:

```tsx
// src/features/bookings/components/checkout/CheckoutPage.tsx

{user.kycStatus === 'PENDING_REVIEW' && (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
    <p className="text-sm font-medium text-amber-800">
      Tu verificación de identidad está en proceso.
    </p>
    <p className="mt-1 text-xs text-amber-700">
      Puedes continuar con la reserva. Tu Pasaporte se actualizará
      automáticamente cuando sea aprobado (24–48h).
    </p>
  </div>
)}

{user.kycStatus === 'NOT_SUBMITTED' && user.trustScore < 40 && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
    <p className="text-sm font-medium text-red-800">
      Tu nivel de confianza es insuficiente para reservar.
    </p>
    <button onClick={openVerificationModal} className="...">
      Verificar mi identidad ahora
    </button>
  </div>
)}
```

---

## Resumen de archivos por fase

| Fase | Archivo | Tipo | Prioridad |
|:---|:---|:---|:---|
| **Prereq.** | `storage.rules` | Modify | P0 — antes de Fase 1 |
| **Prereq.** | `firestore.rules` | Modify | P0 — antes de Fase 1 |
| F1 | `src/types/user.types.ts` | Modify | P0 |
| F1 | `src/features/auth/schemas/kyc.schema.ts` | New | P0 |
| F1 | `src/services/kyc-service.ts` | New | P0 |
| F1 | `functions/src/submitKYCDocument.ts` | New | P0 |
| F1 | `src/features/auth/components/VerificationModal.tsx` | Modify | P0 |
| F1 | `src/features/auth/components/passport/SecuritySection.tsx` | Modify | P0 |
| F1 | `src/features/auth/hooks/usePassportForm.ts` | Modify | P0 — excluir campos KYC de localStorage |
| F2 | `functions/src/approveKYC.ts` | New | P1 |
| F2 | `functions/src/rejectKYC.ts` | New | P1 |
| F2 | `functions/src/getKYCDocumentSignedURL.ts` | New | P1 |
| F2 | `src/features/dashboard/components/KYCAuditPanel.tsx` | New | P1 |
| F3 | `src/features/bookings/components/checkout/CheckoutPage.tsx` | Modify | P2 |

---

## Plan de verificación (DoD)

### Pruebas automatizadas

```powershell
npx tsc --noEmit
npm run lint
cd functions && npx tsc --noEmit
npx firebase emulators:exec --only firestore,storage "npx vitest run tests/kyc"
```

### Escenarios manuales E2E

| # | Escenario | Resultado esperado |
|:---|:---|:---|
| K-01 | Usuario sube documento válido (< 5MB, imagen) | `kycStatus: PENDING_REVIEW` en Firestore. `kycDocumentUrl` establecido por Cloud Function, no por el cliente. |
| K-02 | Usuario intenta subir archivo > 5MB | Storage rules bloquea. Error visible en el modal. |
| K-03 | Usuario intenta escribir `kycStatus` directamente | Firestore rules bloquea con `permission-denied`. |
| K-04 | Usuario en `PENDING_REVIEW` intenta subir segundo documento | Botón deshabilitado. Storage rules bloquea si se intenta via DevTools. |
| K-05 | Admin aprueba desde `KYCAuditPanel` | `kycStatus: VERIFIED`, `isIdentityVerified: true`, `trustScore += 40`. Usuario recibe push notification. |
| K-06 | Admin rechaza sin motivo | Cloud Function retorna `invalid-argument`. Modal muestra error. |
| K-07 | Admin rechaza con motivo | `kycStatus: REJECTED`, documento borrado de Storage, `kycDocumentUrl` eliminado de Firestore. Usuario recibe notificación con el motivo. |
| K-08 | Usuario rechazado intenta volver a subir | `VerificationModal` se abre limpio. Muestra el motivo del rechazo anterior. |
| K-09 | Admin accede a documento via `KYCAuditPanel` | Se genera URL firmada (30 min) via Cloud Function. URL no expuesta en Firestore. |
| K-10 | `kycStatus` no aparece en `localStorage` | Inspeccionar `localStorage` después de completar el flujo. Campo ausente. |
| K-11 | Usuario en `PENDING_REVIEW` llega al checkout | Banner informativo visible. No bloqueado. Puede continuar con la reserva. |

---

*División de Ingeniería de IA — Antigravity · Mayo 2026*
*Versión v2.0 — Reemplaza `implementation_plan.md` original*
