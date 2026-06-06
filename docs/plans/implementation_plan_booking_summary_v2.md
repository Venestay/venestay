# Plan de Implementación v2.0: Resumen de Propiedad Alquilada
## `BookingSummaryModal` · PDF Nativo · Email Automático · VeneStay v2.3.0

> **Sprint:** S04
> **Versión:** v2.0 — Reemplaza `implementation_plan.md` original
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Mayo 2026

---

## Correcciones respecto al plan original

**Corrección 1 — `proofUrl` necesita URL firmada.**
El comprobante de pago está en `/booking-proofs/{requestId}/` con reglas de Storage que bloquean la lectura pública. Un `<img src={booking.proofUrl}>` falla silenciosamente. La solución es una Cloud Function `getProofSignedURL` que devuelve una URL firmada con expiración de 30 minutos, igual que el documento KYC.

**Corrección 2 — Idempotencia del email.**
Los Firestore triggers pueden ejecutarse más de una vez para el mismo evento. Sin guard de idempotencia, el huésped recibe múltiples emails de confirmación. La Cloud Function debe verificar `booking.confirmationEmailSentAt` antes de escribir en la colección `mail`.

---

## Spec del modal: qué muestra en cada estado

El modal se abre desde `MyTrips` para dos estados, pero muestra información diferente:

| Campo | `AWAITING_VERIFICATION` | `CONFIRMED` |
|:---|:---|:---|
| Fechas y noches | ✅ | ✅ |
| Desglose financiero | ⚠️ "Pago en verificación" | ✅ "20% pagado · 80% al llegar" |
| Comprobante (miniatura + ref) | ✅ | ✅ |
| Normas de la casa | ✅ | ✅ |
| Check-in / Check-out | ✅ | ✅ |
| Botón descargar PDF | ✅ | ✅ |
| Nota de estado | "Tu pago está siendo verificado" | "Reserva confirmada" |

---

## Campos requeridos del `Listing` (verificar que existen en el schema)

El modal carga el `Listing` vía `booking.listingId`. Antes de implementar, verificar
que estos campos existen en `src/types/listing.types.ts`:

```typescript
interface Listing {
  // Campos requeridos por el modal — confirmar existencia:
  title: string;
  address: string;
  checkInTime: string;          // "14:00" o "Flexible"
  checkOutTime: string;         // "11:00"
  houseRules: HouseRule[];
  hostName: string;
  hostPhone?: string;           // Solo si el anfitrión lo habilitó
  cleaningFee: number;
}

interface HouseRule {
  id: string;
  label: string;
  allowed: boolean;
  icon: string;                 // nombre del icono de Lucide
}
```

Si algún campo no existe, añadirlo al schema y al `ListingForm` antes de
implementar el modal.

---

## Cambios por módulo

### Módulo 1 — Cloud Function: `getProofSignedURL` (nuevo)

Reemplaza el acceso directo a `proofUrl` desde el componente.

```typescript
// functions/src/getProofSignedURL.ts

export const getProofSignedURL = functions.https.onCall(
  async (data: { bookingId: string }, context) => {

    if (!context.auth) throw new HttpsError('unauthenticated', '');

    const bookingSnap = await db.collection('bookings').doc(data.bookingId).get();
    const booking = bookingSnap.data() as Booking;

    // Solo el huésped o el anfitrión pueden obtener la URL
    const isParticipant =
      context.auth.uid === booking.guestId ||
      context.auth.uid === booking.hostId;

    if (!isParticipant) throw new HttpsError('permission-denied', '');
    if (!booking.proofUrl) throw new HttpsError('not-found', 'Sin comprobante.');

    const [signedUrl] = await admin.storage()
      .bucket()
      .file(booking.proofUrl)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 30 * 60 * 1000, // 30 minutos
      });

    return { signedUrl };
  }
);
```

### Módulo 2 — Cloud Function: `onBookingStateChanged` (modificar)

Añadir guard de idempotencia antes de escribir en `mail`:

```typescript
// functions/src/index.ts — dentro de onBookingStateChanged

export const onBookingStateChanged = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {

    const before = change.before.data() as Booking;
    const after = change.after.data() as Booking;

    // Solo actuar cuando el estado cambia a CONFIRMED
    if (before.status === after.status) return;
    if (after.status !== 'CONFIRMED') return;

    // Guard de idempotencia — evita emails duplicados
    if (after.confirmationEmailSentAt) {
      console.log(`Email ya enviado para booking ${context.params.bookingId}`);
      return;
    }

    // Marcar como enviado ANTES de escribir en mail (evita race condition)
    await change.after.ref.update({
      confirmationEmailSentAt: FieldValue.serverTimestamp(),
    });

    // Obtener datos del huésped
    const guestSnap = await db.collection('users').doc(after.guestId).get();
    const guest = guestSnap.data();
    if (!guest?.email) return;

    // Obtener datos del listing
    const listingSnap = await db.collection('listings').doc(after.listingId).get();
    const listing = listingSnap.data();

    // Escribir en la colección mail (Firebase Trigger Email extension)
    await db.collection('mail').add({
      to: guest.email,
      message: {
        subject: `Confirmación de tu estadía en ${listing?.title} — VeneStay`,
        html: buildConfirmationEmailHTML(after, guest, listing),
      },
    });
  });
```

**Template del email — spec mínima:**

```typescript
function buildConfirmationEmailHTML(
  booking: Booking,
  guest: UserProfile,
  listing: Listing
): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
      .header { background: #0B1120; color: #ffffff; padding: 24px 32px; }
      .header-logo { color: #C5A059; font-size: 20px; font-weight: bold; }
      .header-sub { color: rgba(255,255,255,0.6); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
      .body { padding: 32px; }
      .title { font-size: 22px; font-weight: bold; color: #0B1120; margin-bottom: 4px; }
      .subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
      .section { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
      .section-label { font-size: 10px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 8px; }
      .row { display: flex; justify-content: space-between; font-size: 14px; color: #333; padding: 4px 0; }
      .amount-highlight { color: #C5A059; font-weight: bold; }
      .footer { background: #f9f9f9; padding: 20px 32px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #e5e5e5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-logo">VeneStay</div>
        <div class="header-sub">Alquileres Premium · Lechería</div>
      </div>
      <div class="body">
        <div class="title">¡Tu estadía está confirmada! 🎉</div>
        <div class="subtitle">Hola ${guest.displayName}, todo está listo para tu viaje.</div>

        <div class="section">
          <div class="section-label">Propiedad</div>
          <div class="row"><span>${listing.title}</span></div>
          <div class="row"><span>📍 ${listing.address}</span></div>
        </div>

        <div class="section">
          <div class="section-label">Fechas</div>
          <div class="row">
            <span>Check-in</span>
            <span>${formatDate(booking.checkIn)} · ${listing.checkInTime}</span>
          </div>
          <div class="row">
            <span>Check-out</span>
            <span>${formatDate(booking.checkOut)} · ${listing.checkOutTime}</span>
          </div>
          <div class="row">
            <span>Huéspedes</span>
            <span>${booking.guestCount} viajero(s)</span>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Resumen de pago</div>
          <div class="row">
            <span>Garantía pagada (20%)</span>
            <span class="amount-highlight">✓ ${booking.anticipoAmount} USDT</span>
          </div>
          <div class="row">
            <span>Saldo al llegar (80%)</span>
            <span>${booking.remainingAmount} USDT</span>
          </div>
          <div class="row">
            <span>Ref. comprobante</span>
            <span>${booking.paymentReference || '—'}</span>
          </div>
        </div>
      </div>
      <div class="footer">
        VeneStay · Lechería, Venezuela · venestay.app<br>
        Este correo es una confirmación automática. No respondas a este email.
      </div>
    </div>
  </body>
  </html>
  `;
}
```

### Módulo 3 — `BookingSummaryModal.tsx` (modificar)

#### Carga del comprobante con URL firmada

```typescript
// Reemplazar el acceso directo a proofUrl

const [proofSignedUrl, setProofSignedUrl] = useState<string | null>(null);
const [proofLoading, setProofLoading] = useState(false);

useEffect(() => {
  if (!booking?.id || !booking?.proofUrl) return;
  setProofLoading(true);
  const fn = httpsCallable(functions, 'getProofSignedURL');
  fn({ bookingId: booking.id })
    .then((result: any) => setProofSignedUrl(result.data.signedUrl))
    .catch(() => setProofSignedUrl(null))
    .finally(() => setProofLoading(false));
}, [booking?.id, booking?.proofUrl]);

// En el JSX:
{proofLoading && <div className="h-32 animate-pulse rounded-xl bg-gray-100" />}
{proofSignedUrl && (
  <img
    src={proofSignedUrl}
    alt="Comprobante de pago"
    className="w-full rounded-xl object-cover"
  />
)}
{!proofLoading && !proofSignedUrl && booking?.proofUrl && (
  <p className="text-xs text-gray-400">No se pudo cargar el comprobante.</p>
)}
```

#### Desglose financiero adaptativo por estado

```typescript
const isConfirmed = booking.status === 'CONFIRMED';
const isPendingVerification = booking.status === 'AWAITING_VERIFICATION';

// En el JSX — desglose financiero:
{isConfirmed && (
  <div className="flex items-center gap-2 text-emerald-600">
    <CheckCircle className="h-4 w-4" />
    <span className="text-sm font-medium">Garantía del 20% recibida y verificada</span>
  </div>
)}

{isPendingVerification && (
  <div className="flex items-center gap-2 text-amber-600">
    <Clock className="h-4 w-4" />
    <span className="text-sm font-medium">Pago en proceso de verificación</span>
  </div>
)}
```

#### Botón de PDF con instrucción de usuario

```tsx
<button
  onClick={() => {
    // Mostrar instrucción antes de abrir el diálogo
    alert('En el diálogo de impresión, selecciona "Guardar como PDF" como destino.');
    window.print();
  }}
  className="flex items-center gap-2 rounded-xl border border-brand-gold/30
             bg-brand-gold/5 px-4 py-2.5 text-xs font-semibold text-brand-navy
             transition-all hover:bg-brand-gold/15"
>
  <Download className="h-4 w-4 text-brand-gold" />
  Descargar PDF
</button>
```

#### Responsive móvil

```tsx
// El modal en móvil ocupa pantalla completa con scroll interno
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="summary-modal-title"
  className={`
    fixed inset-0 z-50 flex items-end justify-center
    sm:items-center sm:p-4
  `}
>
  <div className={`
    relative w-full max-w-2xl overflow-y-auto
    bg-white rounded-t-2xl sm:rounded-2xl
    max-h-[90dvh] sm:max-h-[85vh]
    p-6
  `}>
    {/* contenido del modal */}
  </div>
</div>
```

En móvil el modal aparece como **bottom sheet** (anclado abajo, esquinas redondeadas arriba).
En desktop aparece como **modal centrado** con `max-w-2xl`.

#### Estilos de impresión `@media print`

```css
/* Inyectar en el componente via <style> o en index.css bajo @layer */

@media print {
  /* Ocultar todo lo que no es el modal */
  body > *:not(#booking-summary-print-root) { display: none !important; }

  /* Ocultar elementos de la UI */
  [data-print-hide] { display: none !important; }

  /* Reset del modal para impresión */
  .modal-overlay { position: static !important; background: none !important; }
  .modal-container {
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Tipografía y colores de impresión */
  * { color: #000 !important; background: #fff !important; }
  .text-brand-gold { color: #b08f23 !important; }

  /* Membrete de impresión */
  .print-header-only { display: block !important; }

  /* Salto de página si el contenido es largo */
  .house-rules-section { page-break-inside: avoid; }

  /* Formato A4 */
  @page { size: A4; margin: 20mm; }
}

/* El elemento de membrete solo se muestra en impresión */
.print-header-only { display: none; }
```

#### `useFocusTrap` — verificar existencia o crear

```typescript
// src/hooks/useFocusTrap.ts
// Verificar si existe. Si no, crear con esta implementación mínima:

import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // El componente padre es responsable de cerrar el modal al recibir Escape
        containerRef.current?.dispatchEvent(new CustomEvent('modal-escape'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);

  return containerRef;
}
```

---

## Nuevo campo en `Booking` (añadir al tipo)

```typescript
// src/types/booking.types.ts

interface Booking {
  // ... campos existentes ...
  confirmationEmailSentAt?: Timestamp;  // guard de idempotencia del email
}
```

---

## Criterios de aceptación (actualizados)

- [ ] CA-01: Al clic en "Ver Resumen" con estado `CONFIRMED` o `AWAITING_VERIFICATION`, se abre el modal.
- [ ] CA-02: Se muestran días, noches y fechas en español.
- [ ] CA-03: Se renderizan las normas de la casa con iconos.
- [ ] CA-04: El comprobante carga vía URL firmada (no directamente desde `proofUrl`). Si falla, muestra mensaje de error sin crashear el modal.
- [ ] CA-05: El desglose financiero muestra "pago en verificación" si el estado es `AWAITING_VERIFICATION`, y "20% pagado / 80% al llegar" si es `CONFIRMED`.
- [ ] CA-06: El modal atrapa el foco con `useFocusTrap`. Se cierra con Escape.
- [ ] CA-07: Al pulsar "Descargar PDF", muestra instrucción de usuario antes del diálogo de impresión. El formato impreso oculta botones y menús.
- [ ] CA-08: La Cloud Function no escribe en `mail` si `confirmationEmailSentAt` ya existe en el documento.
- [ ] CA-09: En móvil (< 640px), el modal aparece como bottom sheet anclado en la parte inferior.
- [ ] CA-10: `tsc --noEmit` y `eslint .` sin errores en `src/` y `functions/src/`.
- [ ] CA-11: La imagen del comprobante tiene `alt="Comprobante de pago"` para accesibilidad.

---

## Resumen de archivos

| Archivo | Tipo | Cambio |
|:---|:---|:---|
| `functions/src/getProofSignedURL.ts` | New | URL firmada del comprobante |
| `functions/src/index.ts` | Modify | Idempotencia del email + template HTML |
| `src/types/booking.types.ts` | Modify | Campo `confirmationEmailSentAt` |
| `src/types/listing.types.ts` | Modify | Verificar/añadir `HouseRule`, `checkInTime`, `checkOutTime` |
| `src/hooks/useFocusTrap.ts` | New/Verify | Crear si no existe |
| `src/features/bookings/components/BookingSummaryModal.tsx` | Modify | URL firmada, desglose adaptativo, responsive |

---

*División de Ingeniería de IA — Antigravity · Mayo 2026*
*Versión v2.0 — Reemplaza `implementation_plan.md` original*
