# SPEC — Flujo de Cobro Centralizado VeneStay (SPEC-CHECKOUT-PAY-001)

**ID:** SPEC-CHECKOUT-PAY-001
**Versión:** v2.0 — Rediseño por seguridad y claridad de flujo
**Prioridad:** P1
**Estado:** APROBADO POR PLANNER — Pendiente Nodo 3 (Técnico)
**Autora:** Pipeline SDD · VeneStay Engineering
**Última revisión:** 2026-07-08

---

## Contexto y Problema

El checkout actual muestra al huésped los **datos bancarios del anfitrión** para el pago del depósito del 20%. Esto genera dos problemas críticos:

1. **VeneStay pierde control de su comisión:** No hay garantía de que el anfitrión entregue el 20% a VeneStay.
2. **Riesgo de fraude y confusión:** El huésped puede transferir el 100% al anfitrión, saltando el protocolo de la plataforma.

**Solución aprobada:** El huésped siempre paga el 20% a una **cuenta corporativa de VeneStay**. Los datos del anfitrión para el 80% restante se envían únicamente en el **correo de confirmación** (y su PDF adjunto) cuando la reserva es aprobada.

---

## Flujo Operativo Aprobado (Ciclo de vida completo)

```
HUÉSPED                        UI / CHECKOUT                 ANFITRIÓN / CLOUD FUNCTIONS
   |                                |                                |
   |── 1. Solicita reserva ────────>|                                |
   |                                |── Estado: PENDING_APPROVAL     |
   |                                |   NO muestra métodos de pago   |
   |                                |   NO muestra comprobante       |
   |                                |                   ────────────>|
   |                                |                  Notificación  |
   |                                |                                |── 2. Anfitrión acepta
   |                                |── Estado: PENDING_PAYMENT      |
   |<── Notificación: aprobada, puedes pagar el 20% ────────────────|
   |── 3. Entra al Checkout ────────>|                               |
   |                                | Muestra MÉTODOS DE VENESTAY    |
   |                                | Banner: "80% se paga en sitio" |
   |── 4. Transfiere y sube ────────>|                               |
   |       comprobante               |                               |
   |                                 |── 5. Anfitrión verifica pago  |
   |                                 |                               |── Aprueba pago
   |<── 6. Correo + PDF ─────────────|                               |
   |       PDF incluye datos bancarios del anfitrión para el 80%     |
```

---

## Principio de Seguridad Central (INMUTABLE)

Los datos bancarios del anfitrión NUNCA aparecen en el DOM del navegador durante el Checkout.
Solo se transmiten en el PDF adjunto al correo de confirmación.
Esto impide scraping de datos bancarios de terceros desde el cliente.

---

## Donde Viven los Datos de Pago de VeneStay

### Decisión Arquitectónica: Firestore `config/venestay_payments`

Los datos de las cuentas corporativas de VeneStay se almacenan en un documento de Firestore, **no en variables de entorno del cliente (VITE_*)**.

**Por qué Firestore y no .env:**

| Criterio | .env / Vercel Vars | Firestore config/ (Elegido) |
|:---------|:-------------------|:----------------------------|
| Actualizar cuenta sin redeploy | No — requiere redeploy | Si — instantáneo |
| Cambio en producción en segundos | No | Si |
| Control de acceso granular | No | Si (Firestore Rules) |
| Múltiples métodos sin tocar código | No | Si — solo agregar dato en Firestore |

**Estructura del documento Firestore:**

Colección: `config`
Documento: `venestay_payments`

```json
{
  "methods": [
    {
      "id": "vs_pagomovil",
      "type": "PagoMovil",
      "label": "Pago Movil VeneStay C.A.",
      "isVerified": true,
      "data": {
        "phoneNumber": "04141234567",
        "idNumber": "J-501234567",
        "bankName": "Banco Mercantil",
        "accountHolder": "VeneStay C.A."
      }
    },
    {
      "id": "vs_zelle",
      "type": "Zelle",
      "label": "Zelle VeneStay",
      "isVerified": true,
      "data": {
        "email": "pagos@venestay.com",
        "accountHolder": "VeneStay C.A."
      }
    }
  ],
  "updatedAt": "Timestamp",
  "updatedBy": "admin_uid"
}
```

**Regla de Firestore para `config/venestay_payments`:**

```
// firestore.rules — agregar junto a las reglas existentes
match /config/{configId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true;
}
```

---

## Alcance Técnico — Archivos a Tocar

### Capa 1: Firestore (Operación — sin código)

| Acción | Detalle |
|:-------|:--------|
| Crear documento | `config/venestay_payments` con los métodos aprobados en Firebase Console |
| Actualizar firestore.rules | Añadir regla de lectura autenticada + escritura solo admin |

---

### Capa 2: Services — [NUEVO]

**Archivo:** `src/services/venestay-config.service.ts`

```typescript
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { PaymentMethod } from '@/features/dashboard/types';

export async function getVenestayPaymentMethods(): Promise<PaymentMethod[]> {
  const snap = await getDoc(doc(db, 'config', 'venestay_payments'));
  if (!snap.exists()) return [];
  const data = snap.data();
  return (data.methods ?? []) as PaymentMethod[];
}
```

---

### Capa 3: Custom Hook — [NUEVO]

**Archivo:** `src/features/bookings/hooks/useVenestayPayments.ts`

```typescript
import { useState, useEffect } from 'react';
import { getVenestayPaymentMethods } from '@/services/venestay-config.service';
import type { PaymentMethod } from '@/features/dashboard/types';

export function useVenestayPayments() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVenestayPaymentMethods()
      .then(setMethods)
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, []);

  return { methods, loading };
}
```

---

### Capa 4: Checkout UI — [MODIFICAR]

**Archivo:** `src/features/bookings/components/checkout/CheckoutPage.tsx`

#### Cambio A — Reemplazar `availablePaymentMethods` (lineas 150-173)

```typescript
// ANTES: mezcla datos del anfitrión con los del listing
const availablePaymentMethods = useMemo(() => { ... }, [listing?.paymentMethods, hostPaymentMethods]);

// DESPUÉS: siempre métodos corporativos de VeneStay (desde Firestore config/)
const { methods: availablePaymentMethods, loading: loadingMethods } = useVenestayPayments();
```

IMPORTANTE: El estado `hostPaymentMethods` se conserva en background (useEffect lineas 239-252)
porque sus datos alimentan el PDF via Cloud Functions.
Agregar comentario: `// Este estado NO se renderiza — solo alimenta el PDF via Cloud Functions`

#### Cambio B — Ocultar sección de pago en modo PENDING_APPROVAL

```tsx
// Renderizado condicional — alrededor de linea 1521
{!isRequestPhase && (
  <section aria-label="Pago del depósito del 20% a VeneStay">
    {/* tarjetas de método, subida de comprobante */}
  </section>
)}

{isRequestPhase && (
  <div className="info-banner" role="status">
    <ShieldCheck size={20} />
    <p>Tu solicitud fue enviada. El anfitrión la revisará. Solo podrás pagar cuando sea aprobada.</p>
  </div>
)}
```

#### Cambio C — Banner informativo del 80%

```tsx
<div className="balance-banner" role="note" aria-label="Información sobre el saldo pendiente">
  <Info size={16} />
  <p>
    El saldo restante ({formatCurrency(amount80Percent)} — 80%) lo pagas directamente
    al anfitrión el día del Check-in. Sus datos de pago llegarán en el correo de
    confirmación cuando se apruebe tu reserva.
  </p>
</div>
```

#### Cambio D — Validar `selectedMethod` en `isFormDisabled` (linea 203-204)

```typescript
if (isRequestPhase) return false;
if (!selectedMethod) return true;  // NUEVO: obliga selección de método VeneStay
return !reference.trim() || !file;
```

#### Cambio E — Eliminar fallback `listing.bankDetails` del DOM (lineas ~1812-1870)

El bloque de renderizado fallback que expone `listing.bankDetails` en pantalla debe ser
eliminado completamente del JSX. Esta información solo irá al PDF.

---

### Capa 5: PDF de Confirmación (Cloud Functions) — [MODIFICAR]

**Archivo:** `functions/src/templates/booking-pdf.ts`

Insertar después del bloque "RESUMEN DE SALDO" (linea ~173):

```typescript
const hostMethods: PaymentMethod[] = listing.paymentMethods ?? [];
const legacyBank = listing.bankDetails;

doc.fillColor(colors.gold).font('Helvetica-Bold')
   .text('INSTRUCCIONES PARA EL PAGO DEL SALDO (80%)', 50, currentY);
currentY += 20;

if (hostMethods.length > 0) {
  hostMethods.forEach(method => {
    doc.fillColor(colors.navy).font('Helvetica-Bold')
       .text(`Método: ${method.type} — ${method.label}`, 70, currentY);
    currentY += 16;
    if (method.data?.accountHolder) { doc.text(`Titular: ${method.data.accountHolder}`, 70, currentY); currentY += 14; }
    if (method.data?.phoneNumber)   { doc.text(`Número: ${method.data.phoneNumber}`, 70, currentY); currentY += 14; }
    if (method.data?.bankName)      { doc.text(`Banco: ${method.data.bankName}`, 70, currentY); currentY += 14; }
    if (method.data?.email)         { doc.text(`Correo/Zelle: ${method.data.email}`, 70, currentY); currentY += 14; }
    if (method.data?.idNumber)      { doc.text(`RIF/Cédula: ${method.data.idNumber}`, 70, currentY); currentY += 14; }
    currentY += 10;
  });
} else if (legacyBank) {
  doc.fillColor(colors.navy).font('Helvetica')
     .text(`Banco: ${legacyBank.bankName ?? 'No especificado'}`, 70, currentY);    currentY += 14;
  doc.text(`Titular: ${legacyBank.accountHolder ?? 'No especificado'}`, 70, currentY); currentY += 14;
  doc.text(`Cuenta: ${legacyBank.accountNumber ?? 'No especificado'}`, 70, currentY);
} else {
  doc.fillColor(colors.navy).font('Helvetica-Oblique')
     .text('Consulta los datos de pago al anfitrión directamente por el chat de VeneStay.', 70, currentY);
}

currentY += 12;
doc.fillColor('#666666').fontSize(8).font('Helvetica')
   .text(
     'Estos datos fueron proporcionados por el anfitrión al publicar su propiedad. ' +
     'Verifica su vigencia antes de realizar cualquier transferencia. ' +
     'VeneStay no se hace responsable de transferencias a cuentas no verificadas por este canal.',
     50, currentY, { width: doc.page.width - 100, align: 'justify' }
   );
```

---

## Criterios de Aceptación (QA Gate)

| # | Criterio | Verificación |
|:--|:---------|:-------------|
| CA-1 | En PENDING_APPROVAL, no existe ninguna UI de pago visible ni campo de comprobante | Manual en browser |
| CA-2 | En PENDING_PAYMENT, las tarjetas mostradas pertenecen a VeneStay | Manual + Devtools |
| CA-3 | `hostPaymentMethods` existe en el state pero NUNCA se renderiza en la UI | Code review |
| CA-4 | El QR de Pago Móvil usa datos de `config/venestay_payments` | Manual |
| CA-5 | El banner del 80% es visible con el monto calculado correcto | Manual |
| CA-6 | El botón de submit está deshabilitado si no hay `selectedMethod` activo | Manual |
| CA-7 | El PDF tiene la sección "INSTRUCCIONES PARA EL PAGO DEL SALDO (80%)" con datos del anfitrión | Revisar PDF en correo |
| CA-8 | Si el anfitrión no tiene métodos ni bankDetails, el PDF muestra el mensaje de fallback | Prueba con host sin datos |
| CA-9 | `npx tsc --noEmit` pasa con 0 errores | Automatizado |
| CA-10 | `npm run lint` pasa sin errores severos | Automatizado |
| CA-11 | `config/venestay_payments` tiene regla: read = auth != null, write = admin == true | Revisar firestore.rules |
| CA-12 | Ningún dato bancario está hardcodeado en el código fuente | Code review |

---

## Notas de Riesgo Técnico

| Riesgo | Nivel | Mitigación |
|:-------|:------|:-----------|
| El documento `config/venestay_payments` no existe en Firestore al implementar | Alto | El hook retorna [] con fallback silencioso. UI muestra "Cargando métodos..." |
| `hostPaymentMethods` eliminado por error al refactorizar | Medio | Comentar explícitamente su propósito en el código |
| Lectura extra de Firestore por sesión de checkout | Bajo | Documento plano (<1KB). Cachear con getDocFromCache si hay impacto |
| Regla de Firestore incorrecta para /config/{id} bloquea checkout | Alto | Verificar regla con Emulador antes del deploy |

---

## Orden de Implementación para el Nodo 3 (Técnico)

```
1. (Operación) Crear documento config/venestay_payments en Firebase Console
2. Actualizar firestore.rules (agregar regla /config/{configId})
3. Crear src/services/venestay-config.service.ts
4. Crear src/features/bookings/hooks/useVenestayPayments.ts
5. Modificar CheckoutPage.tsx:
   a. Cambio A: reemplazar availablePaymentMethods con useVenestayPayments
   b. Cambio B: ocultar sección pago cuando isRequestPhase === true
   c. Cambio C: agregar banner 80% debajo de los métodos de pago
   d. Cambio D: agregar validación selectedMethod en isFormDisabled
   e. Cambio E: eliminar bloque fallback listing.bankDetails del DOM
6. Modificar functions/src/templates/booking-pdf.ts (insertar sección datos anfitrión)
7. QA Gate: tsc --noEmit + npm run lint + verificación manual en browser
```

---

## Dependencias

- **Requiere antes de implementar:** Datos bancarios reales de VeneStay para crear el documento en Firestore Console.
- **No bloquea:** Ningún módulo activo actualmente.

---

*SPEC-CHECKOUT-PAY-001 v2.0 — VeneStay SDD Pipeline — 2026-07-08*
*Mejoras v2.0: Firestore en lugar de .env, separación service/hook/UI, orden de implementación explícito, 12 CAs medibles, regla Firestore incluida.*
