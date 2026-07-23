# Plan de Implementación: Flujo Completo de Reseñas (Guest -> Property)
**ID:** SPEC-REVIEWS-WORKFLOW-001 | **Sprint:** S05 | **Prioridad:** P1
**Estado:** COMPLETADO (Código Frontend + Backend implementado)
**Creado:** 2026-07-23

---

## Contexto

El proyecto cuenta con el frontend visual (`ReviewForm`, `ReviewCard`, `ListingReviews`) y el servicio de escritura en Firestore (`review-service.ts`), pero **faltan 4 piezas críticas** que impiden que cualquier usuario llegue al formulario de forma orgánica. Ninguna reserva tiene un estado `COMPLETED` porque no existe el motor que las transite. Sin `COMPLETED`, nunca se genera la `ReviewSession`, y sin ella el hook `useListingDetail` nunca activa el formulario.

### Bloqueante actual
El módulo de Cloud Functions (`cronCompleteBookings`, trigger `COMPLETED`) **requiere Firebase CLI** para desplegarse. Este plan debe implementarse en un equipo con CLI activo y autenticado.

---

## Puntos Flojos Detectados (Análisis de Código)

1. **`BookingStatus` no incluye `COMPLETED`** — El tipo `BookingStatus` en `src/features/bookings/types/index.ts` no tiene el estado `'COMPLETED'`. El cron job fallaría en TypeScript.
2. **`getPendingReviewSession` filtra solo por `bookingId`** — El frontend necesita buscar la sesión por token (ID directo), que es el camino principal via URL `?review=SESSION_ID`.
3. **Sin guard de idempotencia en la creación de ReviewSession** — Si el cron se ejecuta dos veces, se crearían dos `reviewSessions`. Hay que verificar si ya existe una antes de crear.
4. **`useListingDetail` no tiene acceso a `bookingId`** — La estrategia de URL `?review=SESSION_ID` del correo es el camino principal y más confiable.
5. **Sin expiración validada en el cliente** — `review-service.ts` no valida `expiresAt`. Se debe agregar.
6. **`reviewSessions` solo permite `create` a Admin SDK** — Restricción correcta según `firestore.rules`. El cron es el único creador.

---

## Open Questions (Pendientes de Respuesta)

1. **Acceso desde Mis Viajes:** ¿El botón "Dejar Reseña" aparece solo si `status === 'COMPLETED'`, o también para `CONFIRMED` con `endDate` pasado?
2. **Double-blind reviews:** ¿MVP unidireccional (Guest -> Property) únicamente?

---

## Proposed Changes

### 1. Tipos — `src/features/bookings/types/index.ts`
```diff
  | 'RESCHEDULE_PENDING'
+ | 'COMPLETED';
```

---

### 2. Cloud Functions — `functions/src/booking.functions.ts`

#### A) `cronCompleteBookings` (Nuevo Cron — requiere Firebase CLI)
```typescript
export const cronCompleteBookings = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('America/Caracas')
  .onRun(async () => {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await db.collection('bookings')
      .where('status', '==', 'CONFIRMED')
      .where('endDate', '<', today)
      .get();

    if (snapshot.empty) return null;

    const batch = db.batch();
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, {
        status: 'COMPLETED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          actorId: 'system',
          actorName: 'Sistema VeneStay',
          note: 'Estadía finalizada automáticamente.'
        })
      });
    });

    await batch.commit();
    console.log(`${snapshot.docs.length} reservas marcadas como COMPLETED.`);
    return null;
  });
```

#### B) `onBookingStateChanged` — bloque `CONFIRMED → COMPLETED`
```typescript
if (after.status === 'COMPLETED' && before.status !== 'COMPLETED') {
  // Guard de idempotencia
  const existingSession = await db.collection('reviewSessions')
    .where('bookingId', '==', bookingId)
    .limit(1).get();

  if (existingSession.empty) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const sessionRef = await db.collection('reviewSessions').add({
      bookingId,
      guestId: after.guestId,
      propertyId: after.listingId,
      status: 'PENDING',
      ucpVerified: true,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const guestSnap = await db.collection('users').doc(after.guestId).get();
    const guest = guestSnap.data();
    const listingSnap = await db.collection('listings').doc(after.listingId).get();
    const listing = listingSnap.data();

    if (guest?.email) {
      await db.collection('mail').add({
        to: guest.email,
        message: {
          subject: `¿Cómo estuvo tu estadía en ${listing?.title || 'VeneStay'}?`,
          html: buildReviewRequestEmailHTML(after, guest, listing || {}, sessionRef.id),
        },
      });
    }

    await db.collection('messages').add({
      bookingId,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text: '🌟 ¡Esperamos que hayas disfrutado tu estadía! Te enviamos un correo para dejar tu reseña.',
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });
  }
}
```

---

### 3. Email Template — `functions/src/templates/booking-emails.ts`

```typescript
export function buildReviewRequestEmailHTML(
  booking: EmailBooking,
  guest: EmailGuest,
  listing: EmailListing,
  sessionId: string
): string {
  const baseUrl = booking.appBaseUrl || APP_BASE_URL_PRODUCTION;
  const reviewUrl = `${baseUrl}/listing/${(booking as any).listingId}?review=${sessionId}`;

  const content = `
    <div class="title">¿Cómo estuvo tu estadía? ⭐</div>
    <div class="text">Hola ${guest.displayName || 'Huésped'}, tu estadía en <strong>${listing.title || 'VeneStay'}</strong> ha finalizado. Tu opinión ayuda a otros viajeros.</div>
    <div class="details-box">
      <div class="details-title">Tu estadía</div>
      <div class="row">
        <span class="row-label">Propiedad</span>
        <span class="row-value">${listing.title || '—'}</span>
      </div>
      <div class="row">
        <span class="row-label">Fechas</span>
        <span class="row-value">${formatDate(booking.startDate || '')} al ${formatDate(booking.endDate || '')}</span>
      </div>
    </div>
    <div class="button-container">
      <a href="${reviewUrl}" class="btn-primary">Evaluar mi Estadía</a>
    </div>
    <div class="text" style="font-size:12px; color:#999; text-align:center; margin-top:16px;">
      Este enlace es válido por 30 días.
    </div>
  `;
  return buildEmailWrapper('Déjanos tu reseña', content);
}
```

---

### 4. Servicios del Cliente — `src/services/review-service.ts`

```typescript
// Nueva función: buscar sesión por token (ID directo desde URL)
export const getPendingReviewSessionByToken = async (sessionId: string): Promise<ReviewSession | null> => {
  const docRef = doc(db, 'reviewSessions', sessionId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const session = { id: docSnap.id, ...docSnap.data() } as ReviewSession;
  if (session.status !== 'PENDING') return null;

  const expiresAt = (session.expiresAt as Timestamp).toDate();
  if (expiresAt < new Date()) {
    console.warn(`ReviewSession ${sessionId} ha expirado.`);
    return null;
  }
  return session;
};

// Mejora función existente: añadir guard de expiración
// En getPendingReviewSession: añadir where('expiresAt', '>', Timestamp.now())
```

---

### 5. Frontend — `src/features/listings/hooks/useListingDetail.ts`

```typescript
// Añadir imports:
import { useSearchParams } from 'react-router-dom';
import { getPendingReviewSessionByToken } from '@/services/review-service';

// Dentro del hook, nuevo useEffect:
const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  const reviewToken = searchParams.get('review');
  if (!reviewToken || !user) return;
  let isMounted = true;

  getPendingReviewSessionByToken(reviewToken).then(session => {
    if (!isMounted) return;
    if (session) {
      setActiveReviewSession(session);
    } else {
      toast.error('El enlace de reseña ha expirado o ya fue utilizado.');
      setSearchParams(prev => { prev.delete('review'); return prev; });
    }
  });

  return () => { isMounted = false; };
}, [searchParams, user]);
```

### 6. Frontend — `src/features/bookings/components/MyTrips.tsx`

```tsx
// En las tarjetas de reserva con status === 'COMPLETED':
{booking.status === 'COMPLETED' && (
  <button
    onClick={() => navigate(`/listing/${booking.listingId}`)}
    className="mt-2 flex items-center gap-2 text-xs font-bold text-[#C5A059] hover:underline"
  >
    <Star className="h-3 w-3 fill-current" />
    Dejar Reseña
  </button>
)}
```

---

## Verification Plan

### Automated Tests
```bash
npx tsc --noEmit
npm run lint
```

### Manual Verification
1. Modificar en Firestore Console una reserva `CONFIRMED` con `endDate` del día anterior.
2. Triggerear el cron (`firebase functions:shell`) o esperar ciclo.
3. ✅ Reserva pasa a `COMPLETED`.
4. ✅ Se crea `reviewSessions/{id}` con `status: PENDING`.
5. ✅ Se encola email en colección `mail` con URL correcta.
6. Navegar a `localhost:3000/listing/{id}?review={sessionId}`.
7. ✅ Formulario `ReviewForm` aparece.
8. ✅ Al enviar, `reviewSessions/{id}` pasa a `SUBMITTED`.
9. ✅ Reseña aparece en "Reseñas Verificadas" del listing.
10. ✅ MyTrips muestra botón "Dejar Reseña" en tarjetas COMPLETED.

### Security Check
- ✅ `reviewSessions` solo se crea por Admin SDK.
- ✅ `reviews` valida en Firestore Rules que la `reviewSessionId` existe, está `PENDING` y pertenece al usuario.
- ✅ Sin secretos expuestos en el cliente.
