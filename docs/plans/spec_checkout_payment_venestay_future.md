# SPEC FUTURA — Flujo de Cobro Centralizado VeneStay (Checkout Payment Redirect)

**ID:** SPEC-CHECKOUT-PAY-001  
**Prioridad:** P1  
**Estado:** PLANIFICADO — Pendiente de sprint asignado  
**Autora:** Pipeline SDD · VeneStay Engineering  
**Última revisión técnica:** 2026-06-20  

---

## Contexto

Actualmente, durante el flujo de checkout, el huésped visualiza y transfiere el depósito del **20%** usando los datos bancarios del **anfitrión**. Esto genera dos problemas:

1. **Conciliación manual:** VeneStay no controla directamente el cobro de su comisión/aseguramiento. Depende de que el anfitrión le entregue el 20%.
2. **Confusión del huésped:** Ver los datos del anfitrión puede llevar a transferencias totales (100%) en lugar del 20% pactado.

**Objetivo:** Que el huésped siempre pague el 20% a una cuenta corporativa de **VeneStay**. Los datos del anfitrión para el cobro del **80% restante** se entregarán de forma segura y exclusiva en el **PDF de Confirmación de Reserva** adjunto al correo de confirmación.

---

## Alcance

### Incluye
- Reemplazar el bloque de métodos de pago del anfitrión por los métodos corporativos de VeneStay en la UI del Checkout.
- Ocultar toda referencia a datos bancarios del anfitrión en la pantalla de pago.
- Mostrar un aviso informativo sobre el saldo del 80% y cómo se entregará.
- Actualizar el QR de Pago Móvil para que use los datos de VeneStay, no los del anfitrión.
- Incorporar en el PDF de confirmación la sección "Instrucciones para el pago del saldo (80%)".
- Mantener el fetch de métodos del anfitrión en background exclusivamente para enriquecer el PDF.

### No incluye
- Cambios en el flujo de pago del 80% el día del check-in (eso es offline).
- Cambios en la vista de administración del anfitrión.
- Integración con pasarela de pagos digital (Stripe, PayPal, etc.) — sigue siendo P2P manual.
- Modificar correo de notificación al anfitrión en esta iteración.

---

## Comportamiento esperado por estado del Booking

| Estado | Comportamiento en UI |
|:-------|:---------------------|
| Draft (pre-reserva) | Mostrar métodos de VeneStay + banner informativo del 80% |
| `PENDING_APPROVAL` (modo solicitud) | **Ocultar sección de pago** — el huésped no paga aún. Mostrar solo el mensaje de solicitud enviada. |
| `PENDING_PAYMENT` (solicitud aprobada) | Mostrar métodos de VeneStay. El comprobante es obligatorio. |
| Instant Booking (modo instantáneo) | Mostrar métodos de VeneStay desde el primer paso. |
| `CONFIRMED` | El PDF adjunto al correo contiene los datos del anfitrión para el 80%. |

---

## Cambios Técnicos Requeridos

### 1. Constantes Globales de Pago — [NEW]

**Archivo:** `src/constants/venestay-payments.ts`

Crear un archivo centralizado exportando `VENESTAY_PAYMENT_METHODS` que implemente la interfaz `PaymentMethod`. Debe incluir los métodos que VeneStay tenga activos (Zelle, Pago Móvil corporativo, Transferencia). Estos valores deben leerse de variables de entorno (`VITE_VENESTAY_ZELLE_EMAIL`, etc.) para evitar hardcodear datos sensibles.

```typescript
// Ejemplo de estructura esperada (valores reales en .env)
export const VENESTAY_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'vs_zelle',
    type: 'Zelle',
    label: 'Zelle',
    isVerified: true,
    data: { email: import.meta.env.VITE_VENESTAY_ZELLE_EMAIL },
  },
  {
    id: 'vs_pagomovil',
    type: 'PagoMovil',
    label: 'Pago Móvil',
    isVerified: true,
    data: {
      phoneNumber: import.meta.env.VITE_VENESTAY_PAGOMOVIL_PHONE,
      idNumber: import.meta.env.VITE_VENESTAY_PAGOMOVIL_RIF,
      bankName: import.meta.env.VITE_VENESTAY_PAGOMOVIL_BANK,
      accountHolder: 'VeneStay C.A.',
    },
  },
];
```

> **Seguridad (6.1):** Nunca hardcodear números de cuenta, RIF o correos reales en el código fuente ni en el repositorio. Usar exclusivamente `.env` + `.env.example` (sin valores reales).

---

### 2. Checkout UI — [MODIFY]

**Archivo:** `src/features/bookings/components/checkout/CheckoutPage.tsx`

#### 2a. Mantener el fetch de `hostPaymentMethods` (con propósito acotado)

El `useEffect` que carga los métodos del anfitrión desde Firestore (`lData.hostId`) **debe mantenerse** porque esos datos se necesitan para enriquecer el PDF vía Cloud Function. Sin embargo, deben guardarse en un state separado y **nunca** mostrarse en la UI.

```typescript
// ✅ Mantener: el dato va al PDF vía Firestore del listing, no al UI
const [hostPaymentMethods, setHostPaymentMethods] = useState<PaymentMethod[]>([]);
```

#### 2b. Reemplazar `availablePaymentMethods`

El `useMemo` actual mezcla métodos del anfitrión con los del listing. Reemplazarlo para que retorne siempre `VENESTAY_PAYMENT_METHODS`:

```typescript
// ANTES (mezcla datos del anfitrión)
const availablePaymentMethods = useMemo(() => {
  const listMethods = listing?.paymentMethods || [];
  const hMethods = hostPaymentMethods || [];
  // ...
}, [listing?.paymentMethods, hostPaymentMethods]);

// DESPUÉS (solo métodos corporativos de VeneStay)
const availablePaymentMethods = useMemo(() => {
  return VENESTAY_PAYMENT_METHODS;
}, []);
```

#### 2c. Actualizar `isFormDisabled` para forzar selección de método

Actualmente `isFormDisabled` **no valida** que haya un `selectedMethod` seleccionado. Con el nuevo flujo, el huésped debe seleccionar un método de VeneStay antes de poder avanzar:

```typescript
// Añadir esta validación en isFormDisabled (en la FASE 3, usuario verificado)
if (!selectedMethod) return true; // Nueva línea requerida
return !reference.trim() || !file;
```

#### 2d. Ajustar títulos de sección de pago

Cambiar el título "Datos de Pago" por **"Pago del Depósito (20%) a VeneStay"** para dar claridad al huésped sobre a quién le está pagando.

#### 2e. Añadir banner informativo sobre el 80%

Justo debajo del bloque de métodos de pago, añadir un componente de alerta informativa:

```
"El saldo restante (80%) — $X.XX — lo pagas directamente al anfitrión 
el día del Check-in. Recibirás sus datos de pago en el PDF de confirmación 
que se enviará a tu correo cuando la reserva sea aprobada."
```

Usar icono `ShieldCheck` o `Info` con estilo consistente con el design system (navy/gold).

#### 2f. Actualizar QR de Pago Móvil

El QR dinámico actual codifica el teléfono, RIF y banco del anfitrión. Si VeneStay tiene Pago Móvil corporativo, el QR debe generarse con los datos del método corporativo seleccionado (`VENESTAY_PAYMENT_METHODS`), no con los del anfitrión:

```typescript
// El QR debe leer de selectedMethod (que ahora siempre es un método de VeneStay)
`pago_movil:tel=${selectedMethod.data.phoneNumber}&rif=${selectedMethod.data.idNumber}&...`
// Este código ya es correcto — el problema actual es que selectedMethod puede ser del anfitrión.
// Al reemplazar availablePaymentMethods, el QR queda automáticamente correcto.
```

#### 2g. Eliminar el fallback `listing.bankDetails` del DOM

El bloque de fallback a `listing.bankDetails` (datos legacy del anfitrión) en el renderizado de `AnimatePresence` debe ser **eliminado completamente** del JSX. Esa información ya no se mostrará en pantalla; irá al PDF.

---

### 3. PDF de Confirmación (Cloud Functions) — [MODIFY]

**Archivo:** `functions/src/templates/booking-pdf.ts`

#### Contexto habilitador (ya resuelto)
El objeto `listing` completo ya se pasa a `buildBookingConfirmationPDF` desde `booking.functions.ts`. Esto significa que `listing.paymentMethods` y `listing.bankDetails` están disponibles sin cambios adicionales en el trigger.

#### Nueva sección en el PDF

Insertar inmediatamente después del bloque **"RESUMEN DE SALDO"** una nueva caja:

**Título:** `INSTRUCCIONES PARA EL PAGO DEL SALDO (80%)`

**Lógica de renderizado:**
1. Si `listing.paymentMethods` (formato nuevo) tiene métodos: iterar y mostrar tipo, titular, número/email, banco.
2. Si `listing.paymentMethods` está vacío pero existe `listing.bankDetails` (formato legacy): usar esos datos.
3. Si ninguno existe: mostrar mensaje *"Consulta los datos de pago al anfitrión directamente por el chat de VeneStay."*

**Texto de descargo (obligatorio):**
> *"Estos datos fueron proporcionados por el anfitrión al momento de publicar la propiedad. Verifica su vigencia por el chat interno de VeneStay antes de realizar cualquier transferencia el día del Check-in. VeneStay no se hace responsable de transferencias realizadas a cuentas no verificadas por este canal."*

---

## Variables de Entorno Requeridas (`.env.example`)

```bash
# Métodos de pago corporativos de VeneStay (sin valores reales en el repo)
VITE_VENESTAY_ZELLE_EMAIL=
VITE_VENESTAY_PAGOMOVIL_PHONE=
VITE_VENESTAY_PAGOMOVIL_RIF=
VITE_VENESTAY_PAGOMOVIL_BANK=
```

---

## Criterios de Aceptación (QA Gate)

- [ ] **CA-1:** En el Checkout de cualquier propiedad, los métodos de pago mostrados pertenecen a VeneStay (no al anfitrión).
- [ ] **CA-2:** El QR de Pago Móvil codifica los datos corporativos de VeneStay.
- [ ] **CA-3:** No existe ningún dato bancario del anfitrión visible en la pantalla de pago.
- [ ] **CA-4:** El banner informativo del 80% es visible y describe correctamente el flujo.
- [ ] **CA-5:** El botón de submit está deshabilitado si no hay un `selectedMethod` activo.
- [ ] **CA-6:** En reservas modo `PENDING_APPROVAL` (solicitud en curso), la sección de pago no muestra datos de pago.
- [ ] **CA-7:** El PDF de confirmación contiene la sección "Instrucciones para el pago del saldo (80%)" con los datos del anfitrión.
- [ ] **CA-8:** Si el anfitrión no tiene métodos registrados, el PDF muestra el mensaje de fallback.
- [ ] **CA-9:** `npx tsc --noEmit` pasa con 0 errores.
- [ ] **CA-10:** `npm run lint` pasa sin errores severos.
- [ ] **CA-11:** Ningún dato sensible (cuentas, RIF, correos de VeneStay) está hardcodeado en el código fuente.

---

## Dependencias

- **Requiere:** Definición y aprobación de los datos de pago corporativos de VeneStay por parte de operaciones (previo a implementación).
- **Requiere:** Agregar variables `VITE_VENESTAY_*` al `.env` local y al dashboard de Vercel antes del deploy.
- **Bloquea:** Ningún módulo activo actualmente.

---

## Notas de Riesgo Técnico

| Riesgo | Nivel | Mitigación |
|:-------|:------|:-----------|
| Las variables de entorno de VeneStay no están en Vercel al momento del deploy | Alto | Verificar en Vercel Dashboard antes de cualquier push a `main` |
| El QR de Pago Móvil podría quedar inactivo si el método de VeneStay no es `PagoMovil` | Medio | El QR solo se renderiza si `selectedMethod.type === 'PagoMovil'` — lógica ya correcta |
| `listing.bankDetails` en formato legacy podría no tener todos los campos para el PDF | Bajo | Implementar con `?? 'No especificado'` en cada campo del PDF |
| El fetch de hostPaymentMethods podría ser eliminado por error al refactorizar | Bajo | Comentar explícitamente en el código su propósito (enriquecimiento de PDF) |
