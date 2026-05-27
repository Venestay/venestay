# Informe Técnico: Flujo "Solicitar Reserva"
## Modelo Híbrido Instant Book vs. Request to Book — VeneStay v2.3.0

> **Clasificación:** Documento de Arquitectura y Producto · División de Ingeniería de IA, Antigravity
> **Versión:** v1.0.0 · Mayo 2026
> **Alcance:** Feature nueva para Beta de Lechería — Julio 2026

---

## Resumen Ejecutivo

VeneStay opera actualmente bajo un modelo de **Reserva Inmediata (Instant Book)**: el huésped selecciona fechas, elige método de pago y asegura la estancia en un solo flujo sin intervención del anfitrión. Este modelo maximiza la conversión pero sacrifica el control del anfitrión sobre quién accede a su propiedad.

Este informe propone la incorporación de un modelo híbrido configurable: **"Solicitar Reserva"** (Request to Book), activable por el anfitrión por propiedad desde el `ListingForm`. Cuando está activo, el huésped inicia contacto directo con el anfitrión antes de que el pago se ejecute, replicando y mejorando el estándar de Airbnb y Booking.com para el mercado específico de Lechería.

| Dimensión | Instant Book (actual) | Request to Book (propuesto) |
|:---|:---|:---|
| Control del anfitrión | Ninguno | Total — aprueba o rechaza en 24h |
| Velocidad de conversión | Máxima | Moderada (ventana de 24h) |
| Riesgo de overbooking | Bajo (automático) | Muy bajo (validación manual) |
| Confianza huésped primerizo | Media | Alta (contacto humano previo) |
| Complejidad de implementación | Ya implementado | Media — 3 capas de cambio |

---

## 1. Análisis de Estándares de la Industria

### 1.1 Airbnb — Instant Book vs. Request to Book

Airbnb es la referencia canónica para este modelo híbrido. Su implementación tiene tres características que definen el estándar:

**Control granular por propiedad.** El anfitrión activa o desactiva Request to Book propiedad por propiedad, no a nivel de cuenta. Esto permite que un mismo anfitrión con múltiples listings tenga una villa premium en modo Request y un apartamento estándar en modo Instant.

**El huésped no paga hasta la aprobación.** En Request to Book, Airbnb pre-autoriza la tarjeta pero no ejecuta el cargo hasta que el anfitrión confirma. Esto es crítico: el huésped siente que "solicitó" y el anfitrión siente que "eligió". Ninguno percibe que fue forzado.

**Chat obligatorio con mensaje pre-llenado.** Al enviar la solicitud, Airbnb abre un hilo de mensaje con un texto predeterminado que el huésped puede editar: *"Hola, me gustaría reservar tu espacio para [fechas]."* El anfitrión recibe notificación push y tiene 24 horas para responder antes de que la solicitud expire automáticamente.

**Indicador visual en el listing.** Las propiedades en modo Request to Book muestran el botón **"Solicitar reserva"** en lugar de **"Reservar"**, lo que comunica el modelo al huésped antes del checkout.

### 1.2 Booking.com — Pre-aprobación en Alquileres Vacacionales

Booking.com aplica Request to Book especialmente para propiedades independientes en LATAM y Europa por tres razones específicas del mercado:

**Multicalendar sin sincronización.** Muchos anfitriones independientes en Venezuela, Colombia y Argentina publican en Booking, Instagram y WhatsApp simultáneamente. La pre-aprobación manual les permite confirmar que las fechas están realmente disponibles en sus otros canales antes de comprometer la reserva.

**Perfil del huésped como filtro.** Booking muestra al anfitrión el perfil completo del huésped (país de origen, historial de reservas, valoraciones recibidas) antes de que decida aprobar o rechazar. En VeneStay, el equivalente es el **Pasaporte VeneStay + Trust Score**.

**Comunicación por mensajería interna.** Booking redirige toda la comunicación previa a la reserva a su sistema de mensajería interna, evitando que el anfitrión y el huésped intercambien datos de contacto antes de que la transacción esté asegurada dentro de la plataforma.

### 1.3 Lo que VeneStay debe adoptar y adaptar

| Práctica de industria | Airbnb | Booking | Adaptación para VeneStay |
|:---|:---:|:---:|:---|
| Control por propiedad (no por cuenta) | ✅ | ✅ | ✅ Campo `requireApproval` en el listing |
| Pago congelado hasta aprobación | ✅ | ✅ | ✅ No ejecutar UCP hasta confirmación |
| Chat obligatorio al solicitar | ✅ | ✅ | ✅ Chat integrado + comprobante |
| Indicador visual en el listing | ✅ | ✅ | ✅ Botón diferenciado en ListingDetail |
| Plazo de respuesta con expiración | ✅ 24h | ✅ 48h | ✅ 24h con notificación al anfitrión |
| Perfil del huésped visible al aprobar | ✅ | ✅ | ✅ Pasaporte VeneStay + Trust Score |
| Rechazo sin penalización | ✅ | ✅ | ✅ Anfitrión puede rechazar sin costo |

---

## 2. Arquitectura de la Feature

### 2.1 Nueva propiedad en el modelo de datos del listing

```typescript
// src/types/listing.types.ts
interface Listing {
  // ... campos existentes ...
  bookingMode: 'instant' | 'request';  // Nuevo campo
}
```

```typescript
// src/features/dashboard/types/dashboard.schema.ts
const listingSchema = z.object({
  // ... campos existentes ...
  bookingMode: z.enum(['instant', 'request']).default('instant'),
});
```

**Regla de Firestore:**
```
// firestore.rules — añadir a la sección de listings
allow update: if request.auth.uid == resource.data.hostId
              && request.resource.data.bookingMode in ['instant', 'request'];
```

### 2.2 Nuevo modelo de datos para la solicitud de reserva

```typescript
// src/types/booking.types.ts

interface BookingRequest {
  id: string;
  listingId: string;
  hostId: string;
  guestId: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  guestCount: number;
  totalAmount: number;           // Calculado en Cloud Function
  anticipoAmount: number;        // 20% del total (protocolo UCP)
  paymentMethod: 'ves' | 'usdt';
  status: BookingRequestStatus;
  guestMessage: string;          // Mensaje inicial del huésped
  paymentProofUrl?: string;      // URL del comprobante (Firebase Storage)
  paymentReference?: string;     // Número de referencia
  hostResponse?: 'approved' | 'rejected';
  hostResponseNote?: string;
  expiresAt: Timestamp;          // createdAt + 24 horas
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type BookingRequestStatus =
  | 'pending_host'       // Esperando respuesta del anfitrión
  | 'approved'           // Anfitrión aprobó, pago procesándose
  | 'rejected'           // Anfitrión rechazó
  | 'expired'            // 24h sin respuesta
  | 'cancelled_by_guest' // Huésped canceló antes de respuesta
  | 'completed';         // Reserva confirmada y pagada
```

### 2.3 Diagrama de flujo completo

```
HUÉSPED                          SISTEMA                         ANFITRIÓN
───────                          ───────                         ─────────

[ListingDetail]
 Listing con bookingMode='request'
 → Botón: "Solicitar Reserva"
         │
         ▼
[CheckoutPage — modo request]
 Selecciona fechas + método pago
 Visualiza desglose UCP (sin pagar)
 Escribe mensaje al anfitrión
 Adjunta comprobante (opcional)
 → Click: "Enviar Solicitud"
         │
         ▼                    [Cloud Function]
                              createBookingRequest()
                              - Valida disponibilidad
                              - Calcula montos
                              - Crea doc en /bookingRequests/
                              - Bloquea fechas (soft-block)     → [Notificación push]
                              - Inicia countdown 24h                "Nueva solicitud de
                              - Abre hilo de chat                    [Huésped] para
                                                                      [fechas]"
                                                                         │
                                                                         ▼
                                                                  [Dashboard Anfitrión]
                                                                  Ve: Trust Score huésped
                                                                  Ve: Pasaporte VeneStay
                                                                  Ve: Mensaje del huésped
                                                                  Ve: Comprobante adjunto
                                                                  Ve: Countdown 24h
                                                                         │
                                                            ┌────────────┴────────────┐
                                                            ▼                         ▼
                                                       [APROBAR]                [RECHAZAR]
                                                            │                         │
                              [Cloud Function]             │      [Cloud Function]    │
                              approveBookingRequest()      │      rejectBookingRequest()
                              - Confirma pago              │      - Libera fechas
                              - Convierte a Booking        │      - Notifica huésped
                              - Libera soft-block          │      - Cierra solicitud
                              - Notifica huésped           │
                                    │
                                    ▼
[Notificación al huésped]    ¡Reserva Confirmada!
"Tu solicitud fue aprobada.  Booking creado en Firestore
 Tu estancia está asegurada."
```

---

## 3. Especificación de Cambios por Módulo

### 3.1 Módulo Dashboard — `ListingForm.tsx` (StepGeneral)

**Nuevo switch en el paso General del formulario:**

```tsx
// src/features/dashboard/components/steps/StepGeneral.tsx

<div className="space-y-2">
  <label className="text-sm font-medium text-brand-navy">
    Modo de reserva
  </label>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {/* Opción Instant Book */}
    <button
      type="button"
      onClick={() => setValue('bookingMode', 'instant')}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all
        ${watch('bookingMode') === 'instant'
          ? 'border-brand-navy bg-brand-navy/5'
          : 'border-gray-100 hover:border-gray-200'
        }`}
    >
      <Zap className="mt-0.5 h-5 w-5 text-brand-gold shrink-0" />
      <div>
        <p className="text-sm font-semibold text-brand-navy">Reserva Inmediata</p>
        <p className="mt-0.5 text-xs text-brand-navy/60">
          Los huéspedes reservan al instante sin confirmación previa.
          Mayor velocidad de conversión.
        </p>
      </div>
    </button>

    {/* Opción Request to Book */}
    <button
      type="button"
      onClick={() => setValue('bookingMode', 'request')}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all
        ${watch('bookingMode') === 'request'
          ? 'border-brand-gold bg-brand-gold/5'
          : 'border-gray-100 hover:border-gray-200'
        }`}
    >
      <MessageSquare className="mt-0.5 h-5 w-5 text-brand-gold shrink-0" />
      <div>
        <p className="text-sm font-semibold text-brand-navy">Solicitar Reserva</p>
        <p className="mt-0.5 text-xs text-brand-navy/60">
          El huésped te contacta primero. Tú apruebas o rechazas en 24 horas.
          Mayor control sobre quién se queda.
        </p>
      </div>
    </button>
  </div>
</div>
```

### 3.2 Módulo Listings — `ListingDetail.tsx`

**Cambio en el botón de reserva según el modo:**

```tsx
// src/features/listings/components/ListingDetail.tsx

const isRequestMode = listing.bookingMode === 'request';

<button
  onClick={() => navigate(`/checkout/${listing.id}`)}
  className={`w-full rounded-xl py-3.5 text-sm font-semibold uppercase tracking-widest
    transition-all duration-300
    ${isRequestMode
      ? 'border border-brand-gold bg-transparent text-brand-navy hover:bg-brand-gold/10'
      : 'bg-brand-navy text-white hover:bg-brand-navy/90'
    }`}
>
  {isRequestMode ? (
    <span className="flex items-center justify-center gap-2">
      <MessageSquare className="h-4 w-4" />
      Solicitar Reserva
    </span>
  ) : (
    'Asegurar mi Estancia'
  )}
</button>

{isRequestMode && (
  <p className="mt-2 text-center text-xs text-brand-navy/50">
    El anfitrión tiene 24h para confirmar. No se realiza ningún cargo hasta su aprobación.
  </p>
)}
```

### 3.3 Módulo Bookings — `CheckoutPage.tsx` (modo request)

**Panel de solicitud que reemplaza el botón de pago inmediato:**

El `CheckoutPage` detecta el modo del listing y condiciona el panel final:

```tsx
// src/features/bookings/components/checkout/CheckoutPage.tsx

{listing.bookingMode === 'request' ? (
  <RequestToBookPanel
    listing={listing}
    dates={selectedDates}
    guests={guestCount}
    paymentMethod={selectedMethod}
    amounts={calculatedAmounts}
  />
) : (
  <InstantBookPanel {/* Panel actual */} />
)}
```

**Especificación del componente `RequestToBookPanel`:**

```
Estructura visual (de arriba a abajo):
┌────────────────────────────────────────────┐
│  RESUMEN DE FECHAS Y MONTO (solo lectura)  │
│  Check-in: 30 may · Check-out: 31 may      │
│  Anticipo a pagar si se aprueba: 90 USDT   │
├────────────────────────────────────────────┤
│  MENSAJE AL ANFITRIÓN                      │
│  [Textarea pre-llenado editable]           │
│  "Hola [Anfitrión], quiero reservar tu     │
│   propiedad del [inicio] al [fin]. [...]"  │
├────────────────────────────────────────────┤
│  COMPROBANTE (OPCIONAL)                    │
│  Puedes adjuntarlo ahora o después         │
│  de la aprobación.                         │
│  [Subir imagen] [Número de referencia]     │
├────────────────────────────────────────────┤
│  AVISO LEGAL COMPACTO                      │
│  "No se realizará ningún cargo hasta que   │
│   el anfitrión confirme tu solicitud."     │
├────────────────────────────────────────────┤
│  [BOTÓN: Enviar Solicitud & Contactar]     │
│  bg-brand-navy, borde dorado sutil         │
└────────────────────────────────────────────┘
```

### 3.4 Nuevo servicio — `booking-request.service.ts`

```typescript
// src/services/booking-request.service.ts

export async function createBookingRequest(
  payload: CreateBookingRequestPayload
): Promise<BookingRequest> {
  // Llamada a Cloud Function (nunca lógica de montos en cliente)
  const fn = httpsCallable(functions, 'createBookingRequest');
  const result = await fn(payload);
  return result.data as BookingRequest;
}

export async function uploadPaymentProof(
  requestId: string,
  file: File
): Promise<string> {
  // Subida a Firebase Storage bajo /booking-proofs/{requestId}/
  const path = `booking-proofs/${requestId}/${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return getDownloadURL(ref);
}

export async function approveBookingRequest(
  requestId: string,
  hostNote?: string
): Promise<void> {
  const fn = httpsCallable(functions, 'approveBookingRequest');
  await fn({ requestId, hostNote });
}

export async function rejectBookingRequest(
  requestId: string,
  hostNote: string
): Promise<void> {
  const fn = httpsCallable(functions, 'rejectBookingRequest');
  await fn({ requestId, hostNote });
}
```

### 3.5 Cloud Functions requeridas

```
functions/src/
  createBookingRequest.ts   — Valida disponibilidad, calcula montos, crea
                              el doc, activa soft-block de fechas, inicia
                              countdown de 24h, crea hilo de chat.

  approveBookingRequest.ts  — Ejecuta el pago real, convierte el
                              BookingRequest en un Booking confirmado,
                              libera el soft-block (ahora es hard-block).

  rejectBookingRequest.ts   — Libera el soft-block de fechas, cierra la
                              solicitud, notifica al huésped.

  expireBookingRequests.ts  — Cloud Function programada (cada hora):
                              busca solicitudes con expiresAt < now()
                              y las marca como 'expired'. Libera fechas.
```

---

## 4. Reglas de Seguridad Adicionales

```javascript
// firestore.rules — nueva colección bookingRequests

match /bookingRequests/{requestId} {

  // El huésped puede crear una solicitud
  allow create: if request.auth != null
                && request.auth.uid == request.resource.data.guestId
                && request.resource.data.status == 'pending_host';

  // El huésped puede leer sus propias solicitudes
  // El anfitrión puede leer las solicitudes de sus propiedades
  allow read: if request.auth.uid == resource.data.guestId
              || request.auth.uid == resource.data.hostId;

  // Solo Cloud Functions pueden actualizar el status
  // (se controla via Admin SDK en las functions)
  allow update: if false;

  // Nadie puede eliminar solicitudes (auditoría)
  allow delete: if false;
}
```

```javascript
// storage.rules — comprobantes de pago

match /booking-proofs/{requestId}/{fileName} {
  // Solo el huésped dueño de esa solicitud puede subir
  allow write: if request.auth != null
               && request.auth.uid == getBookingRequestOwner(requestId)
               && request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');

  // El huésped y el anfitrión pueden leer
  allow read: if request.auth != null
              && isBookingRequestParticipant(requestId, request.auth.uid);
}
```

---

## 5. Experiencia del Anfitrión — Panel de Aprobación

El anfitrión recibe una notificación y accede a una vista dedicada en su dashboard:

```
PANEL DE SOLICITUD PENDIENTE
┌──────────────────────────────────────────────────────┐
│  NUEVA SOLICITUD DE RESERVA                          │
│  ─────────────────────────────────────────────────── │
│  [Foto huésped]  Carlos M.                           │
│  Trust Score: ████████░░ 82/100                      │
│  Pasaporte: Verificado ✓                             │
│  Reservas anteriores: 3 completadas                  │
│                                                      │
│  Propiedad: Apto Frente al Mar — Lechería            │
│  Fechas:    30 may → 31 may 2026 (1 noche)           │
│  Huéspedes: 2 viajeros                               │
│  Monto:     450 USDT (90 USDT anticipo)              │
│                                                      │
│  MENSAJE DEL HUÉSPED                                 │
│  "Hola, viajamos en pareja desde Caracas.            │
│   Es nuestro primer viaje a Lechería..."             │
│                                                      │
│  COMPROBANTE ADJUNTO: [Ver imagen]                   │
│  Referencia: 4521-8833-XX                            │
│                                                      │
│  ⏱ Tiempo restante para responder: 18:42:30         │
│                                                      │
│  [APROBAR RESERVA]      [RECHAZAR]                   │
│   bg-brand-navy          texto rojo sutil            │
└──────────────────────────────────────────────────────┘
```

---

## 6. Manejo de Casos Borde

| Caso | Comportamiento esperado |
|:---|:---|
| Anfitrión no responde en 24h | Cloud Function expira la solicitud, libera fechas, notifica al huésped con mensaje: "La solicitud expiró. El anfitrión no respondió a tiempo. No se realizó ningún cargo." |
| Huésped cancela antes de respuesta | Huésped puede cancelar desde su panel. Fechas se liberan inmediatamente. Sin penalización. |
| Dos huéspedes solicitan las mismas fechas | El soft-block solo bloquea para nuevas solicitudes mientras la primera está pendiente. Si la primera expira o se rechaza, la segunda puede proceder. Si la primera se aprueba, la segunda se invalida automáticamente. |
| Anfitrión rechaza sin nota | Se permite el rechazo pero el sistema muestra al anfitrión: "Agregar un motivo ayuda al huésped a entender la decisión." (no obligatorio) |
| Comprobante no coincide con monto | El anfitrión puede aprobar de todas formas. La verificación del comprobante es responsabilidad del anfitrión, no del sistema automático. |
| Listing cambia de modo mientras hay solicitud pendiente | El cambio de `bookingMode` no afecta solicitudes en curso. Solo aplica a nuevas solicitudes. |

---

## 7. Impacto en Quality Gates

Este feature toca cuatro de los cinco módulos críticos del sistema. Antes de llegar a producción debe pasar:

| Gate | Verificación específica |
|:---|:---|
| TypeScript (`tsc --noEmit`) | `BookingRequest`, `BookingRequestStatus` y todos los props de los nuevos componentes tipados estrictamente |
| ESLint | Sin hooks condicionales en `CheckoutPage` al alternar entre modos |
| Tests de integración | (1) Crear solicitud exitosa, (2) Aprobar solicitud → booking confirmado, (3) Rechazar → fechas liberadas, (4) Expiración automática a las 24h, (5) Dos solicitudes concurrentes → solo una aprobada |
| Firestore Rules | Huésped no puede aprobar su propia solicitud. Anfitrión no puede crear solicitudes. Cloud Functions son el único actor que actualiza `status`. |
| WCAG 2.2 AA | Countdown timer con `aria-live="polite"`. Botones de aprobar/rechazar con `aria-label` descriptivo. |

---

## 8. Hoja de Ruta de Implementación

| Sprint | Objetivo | Entregable |
|:---|:---|:---|
| S-RB-01 | Modelo de datos + Cloud Functions base | `BookingRequest` en Firestore, `createBookingRequest` function, soft-block de fechas |
| S-RB-02 | Dashboard del anfitrión — configuración | Switch en `StepGeneral`, campo `bookingMode` en schema Zod, persistencia en Firestore |
| S-RB-03 | Checkout adaptativo — modo request | `RequestToBookPanel`, upload de comprobante, mensaje al anfitrión |
| S-RB-04 | Panel de aprobación del anfitrión | Vista de solicitudes pendientes, botones aprobar/rechazar, `approveBookingRequest` + `rejectBookingRequest` functions |
| S-RB-05 | Expiración automática + QA completo | `expireBookingRequests` scheduled function, suite de tests de integración, auditoría de reglas |

---

## 9. Beneficios Estratégicos para el Mercado de Lechería

**Control sobre huéspedes desconocidos.** En Lechería, la mayoría de los anfitriones son propietarios individuales que conocen personalmente a sus inquilinos habituales. La reserva automática de un desconocido genera resistencia cultural. Request to Book reduce esa fricción sin eliminar la plataforma del proceso.

**Compatibilidad con el mercado informal.** Muchos anfitriones en Lechería coordinan reservas por Instagram y WhatsApp simultáneamente. La pre-aprobación les permite confirmar disponibilidad real antes de comprometer las fechas en VeneStay, reduciendo cancelaciones de último momento.

**Diferencial frente al WhatsApp directo.** Request to Book replica la conversación informal del WhatsApp pero dentro de VeneStay, con el comprobante documentado, el historial del huésped visible y la transacción protegida por el protocolo UCP. Para el anfitrión, usar VeneStay en modo Request es estrictamente mejor que gestionar por WhatsApp.

---

*Elaborado por la División de Ingeniería de IA — Antigravity*
*Documento de Arquitectura y Producto v1.0.0 · Mayo 2026*
*Referencia: `informe_solicitar_reserva.md` (análisis del agente) + estándares Airbnb y Booking.com*
