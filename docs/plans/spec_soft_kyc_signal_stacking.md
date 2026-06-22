# SPEC — Soft KYC por Signal Stacking (sin documentos, sin servicios pagos)
**Estado:** Propuesta — pendiente de aprobación
**Reemplaza a:** `spec_soft_kyc_cne_future.md`
**Paradigma:** Spec-Driven Development (SDD) — sin código hasta aprobación formal

---

## 1. Resumen

Este Soft KYC reemplaza el cruce contra el CNE/SAIME (inviable: sin API pública, riesgo legal de dato electoral, riesgo de scraping) por un **score compuesto de tres señales propias**, ninguna de las cuales requiere almacenar un documento de identidad ni contratar un proveedor de KYC externo:

1. **Email verificado** (ya existe en el proyecto)
2. **Teléfono verificado por OTP** (ya existe en el proyecto)
3. **Coincidencia de nombre declarado vs. titular bancario**, confirmada en el momento del primer pago real (UCP 20/80) — no en el onboarding

El Trust Score deja de ser un salto único (0% → 45%) y pasa a ser **escalonado**: cada señal aporta un incremento, y el umbral de reserva (40%) solo se alcanza con la combinación de las tres, no con una sola.

---

## 2. Decisión de diseño: por qué se descarta el cruce institucional

| Opción descartada | Motivo |
|---|---|
| Cruce contra CNE | Sin API pública vigente; la verificación pública fue eliminada y solo se puede consultar datos propios vía login. Dato de naturaleza electoral, sensible. |
| Cruce contra SAIME | Mismo problema de acceso público; solo consulta de datos propios mediante login oficial. |
| Proveedor de KYC pago (ej. Didit) | Cobra por consulta concluyente contra el registro del SAIME — descartado explícitamente por requerimiento del producto. |
| Pasarela de verificación de Pago Móvil (ej. Pabilo, PagoFlash) | Servicio de pago de terceros para automatizar verificación de transferencias — también es un costo recurrente, descartado por el mismo motivo. |

**Conclusión:** no existe en Venezuela, hoy, una fuente gratuita y oficial para verificación automatizada de identidad. El diseño debe basarse en señales que VeneStay ya controla.

---

## 3. Modelo de Trust Score escalonado

| Señal | Verificación | Incremento | Acumulable |
|---|---|---|---|
| Email verificado | Click en link de confirmación (ya existe) | +10% | Sí |
| Teléfono verificado | OTP por SMS (ya existe) | +15% | Sí |
| Nombre declarado coincide con comprobante de pago | Ver sección 4 | +20% | Sí |
| **Total máximo con las 3 señales** | | **45%** | — |

> [!IMPORTANT]
> El umbral actual de reserva (40%) se mantiene. Con este modelo, un usuario **no puede reservar solo con email + teléfono** (25%) — necesita además la señal de pago, que naturalmente solo existe una vez que intenta pagar el depósito UCP 20/80. Esto es consistente con el flujo real: nadie reserva sin pagar.

Este diseño resuelve un problema que tenía la spec original: otorgar 45% de forma instantánea en el registro, antes de cualquier intento real de transacción, es la señal más débil posible. Acá el score completo solo se alcanza en el momento de mayor fricción real (el pago), que es también el momento de mayor evidencia.

---

## 4. Detalle de la Señal 3 — Coincidencia de nombre con comprobante de pago

### 4.1 Flujo (Enfoque A, reforzado con evidencia del comprobante)

1. El usuario declara su **Nombre Completo** en el perfil (ya existe como campo `displayName` o similar).
2. Al pagar el depósito UCP 20/80 vía Pago Móvil, el usuario sube el comprobante de la transacción (captura de pantalla de la notificación bancaria o del comprobante en la app del banco) — **este paso ya existe** en el flujo de pago actual, no es un paso nuevo.
3. Una Cloud Function (`verifyPaymentNameMatch`) extrae el nombre del titular emisor desde el comprobante mediante OCR ligero (o, en una primera iteración, **revisión humana asistida** por el admin que ya revisa el pago) y lo compara contra el nombre declarado en el perfil.
4. Si hay coincidencia (normalizada — sin tildes, mayúsculas, espacios), se otorga el incremento de +20%.

### 4.2 Por qué esto NO es "almacenar un documento sensible"

- El comprobante de Pago Móvil **no es un documento de identidad nacional** (no es cédula ni pasaporte). Es evidencia de una transacción financiera, que el proyecto ya procesa como parte del flujo de pago existente.
- **No se persiste la imagen del comprobante a largo plazo en este flujo de KYC.** Se persiste únicamente:
  - El resultado booleano del match (`paymentNameMatchStatus: 'MATCHED' | 'FAILED' | 'PENDING'`)
  - El nombre normalizado extraído (string corto, no la imagen)
- Si el comprobante ya se almacena por otros motivos del flujo de pago (conciliación, disputas), eso es responsabilidad del módulo de pagos existente, no de este Soft KYC — este KYC solo lee el resultado, no posee la imagen.

> [!CAUTION]
> Si el módulo de pagos actual ya almacena comprobantes en Storage, ese almacenamiento debe auditarse aparte (TTL, acceso restringido a Admin SDK) — está fuera del alcance de esta spec, pero se señala como dependencia.

---

## 5. Modelo de Datos

### 5.1 Cambios en `UserProfile` (Firestore)

```typescript
interface UserProfile {
  // ... campos existentes ...

  // Reemplaza el bloque de Soft KYC anterior (kycType, cneMatchStatus, passport)
  trustSignals: {
    emailVerified: boolean;              // ya existe, se reutiliza
    phoneVerified: boolean;              // ya existe, se reutiliza
    paymentNameMatchStatus: 'NOT_ATTEMPTED' | 'PENDING' | 'MATCHED' | 'FAILED';
    paymentNameMatchedAt: Timestamp | null;
    paymentNameExtracted: string | null; // nombre normalizado extraído del comprobante, NO la imagen
  };

  trustScore: number; // calculado, no escribible desde cliente — ver sección 6
}
```

> [!CAUTION]
> **Compatibilidad con KYC legacy:** usuarios con el KYC manual anterior (`kycDocumentUrl`) mantienen ese campo sin cambios. El frontend debe leer ambos esquemas: si existe `kycDocumentUrl`, mostrar el estado legacy; si existe `trustSignals`, mostrar el nuevo desglose. No migrar datos retroactivamente — solo aplica a usuarios nuevos o quienes pasen por el flujo nuevo.

### 5.2 Eliminado de la spec original

- `kycType`
- `cneMatchStatus`
- `passport` (objeto con datos tipo cédula)
- `CNE_MOCK_REGISTRY`
- Cualquier referencia a `verifyCivilIdentity`

---

## 6. Backend — Cloud Functions

### 6.1 `onEmailVerified` (trigger existente, ajustar)
Al confirmarse el email, escribir `trustSignals.emailVerified = true` y recalcular `trustScore` vía la función central de cálculo (sección 6.4). **Esta escritura es vía Admin SDK únicamente.**

### 6.2 `onPhoneVerified` (trigger existente, ajustar)
Mismo patrón que 6.1, para `trustSignals.phoneVerified`.

### 6.3 `verifyPaymentNameMatch` (nueva)

```typescript
// Cloud Function — se ejecuta cuando el admin (o un proceso OCR) confirma
// el comprobante de pago durante la revisión del depósito UCP 20/80.

interface VerifyPaymentNameMatchInput {
  userId: string;
  bookingId: string;
  extractedName: string; // viene de OCR o de input del admin revisor
}

// Lógica:
// 1. Normalizar extractedName y displayName del perfil (sin tildes, mayúsculas, trim).
// 2. Comparar con tolerancia a orden de nombres/apellidos (similar al riesgo de
//    falsos positivos ya señalado para el cruce CNE — aplica el mismo cuidado aquí).
// 3. Si coincide: trustSignals.paymentNameMatchStatus = 'MATCHED', sumar +20% a trustScore.
// 4. Si no coincide: 'FAILED' — no bloquea la reserva si las otras 2 señales ya
//    alcanzan el umbral combinadas con revisión manual del admin como fallback.
// 5. Nunca persistir la imagen del comprobante en este flujo — solo el string normalizado.
```

> [!IMPORTANT]
> Esta función, junto con 6.1 y 6.2, son las **únicas** vías de escritura de `trustSignals.*` y `trustScore`. Las reglas de Firestore deben denegar explícitamente cualquier `update` del cliente sobre estos campos — mismo criterio de aceptación que ya aplica a `kycStatus`/`bookingStatus` en el resto del proyecto.

### 6.4 `recalculateTrustScore` (función central, nueva)

Función pura e idempotente que centraliza el cálculo, invocada por 6.1, 6.2 y 6.3 — evita que la lógica de puntaje quede duplicada en tres lugares:

```typescript
function calculateTrustScore(signals: TrustSignals): number {
  let score = 0;
  if (signals.emailVerified) score += 10;
  if (signals.phoneVerified) score += 15;
  if (signals.paymentNameMatchStatus === 'MATCHED') score += 20;
  return score;
}
```

### 6.5 Fallback manual (reemplaza al "Camino B" de subir documento)

Si `paymentNameMatchStatus === 'FAILED'` (ej. el usuario pagó desde la cuenta de un familiar, error de OCR, nombre con orden distinto), el sistema **no bloquea automáticamente**: el caso pasa a revisión manual del admin, igual que el flujo de pago ya contempla revisión humana de comprobantes. No se reintroduce la subida de cédula/pasaporte — el fallback es revisión humana del mismo comprobante de pago, no un documento adicional.

---

## 7. Frontend

### 7.1 Cambios respecto a la spec original

- **Se elimina** el componente `<SoftKYCForm>` con campos de Cédula/ID (ya no aplica, no hay cruce institucional).
- **Se elimina** la necesidad de un nuevo flujo de captura de documento.
- **Se agrega** un widget de progreso de Trust Score en el perfil, mostrando las 3 señales como checklist:
  - ✅ Email verificado
  - ✅ Teléfono verificado
  - ⏳ Verificación de pago (se completa automáticamente en tu primera reserva)
- El admin panel de revisión de pagos (ya existente para UCP 20/80) se extiende con un campo opcional: "¿El nombre del comprobante coincide con el perfil?" (Sí/No), que dispara `verifyPaymentNameMatch`. No es un panel nuevo — es un campo añadido al panel de revisión de pagos existente.

### 7.2 Tipado (`types/index.ts`)

```typescript
interface TrustSignals {
  emailVerified: boolean;
  phoneVerified: boolean;
  paymentNameMatchStatus: 'NOT_ATTEMPTED' | 'PENDING' | 'MATCHED' | 'FAILED';
  paymentNameMatchedAt: Timestamp | null;
  paymentNameExtracted: string | null;
}
```

---

## 8. Reglas de Seguridad (`firestore.rules`)

```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();

  allow update: if request.auth.uid == userId
    // El cliente puede actualizar su perfil, EXCEPTO los campos de confianza
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['trustSignals', 'trustScore', 'kycStatus']);

  // trustSignals y trustScore solo se escriben vía Admin SDK (Cloud Functions),
  // nunca por una regla "allow write" del cliente.
}
```

---

## 9. Riesgos remanentes (heredados o nuevos, declarados explícitamente)

| Riesgo | Mitigación |
|---|---|
| Falso positivo/negativo en match de nombre (orden de apellidos, apodos) | Normalización + fallback a revisión manual del admin (no bloqueo automático definitivo) |
| Usuario paga desde cuenta de un tercero (familiar) de buena fe | Revisión manual permite aprobar caso por caso sin penalizar al usuario |
| Trust Score más bajo que el 45% instantáneo original | Es una decisión de diseño deliberada: preferimos un score más lento pero respaldado por evidencia real de transacción, sobre uno instantáneo sin respaldo |
| Comprobante de pago contiene datos financieros (no de identidad) | Ya forma parte del flujo de pago existente; este KYC solo lee el resultado del match, no posee ni persiste la imagen |
| OCR del comprobante falla por mala calidad de imagen | Fallback automático a revisión manual del admin (mismo flujo ya usado para validar pagos) |

---

## 10. Plan de Acción

1. **Reglas y Tipos:** Actualizar `firestore.rules` (denegar `update` del cliente sobre `trustSignals`/`trustScore`) y `types/index.ts`.
2. **Cloud Functions:** Implementar `recalculateTrustScore`, ajustar `onEmailVerified`/`onPhoneVerified`, crear `verifyPaymentNameMatch`.
3. **Admin Panel:** Agregar el campo de confirmación de match al panel de revisión de pagos existente (no crear panel nuevo).
4. **Frontend:** Reemplazar `<SoftKYCForm>` por el widget de progreso de 3 señales en el perfil.
5. **Pruebas:** Validar que el score escalona correctamente, que el umbral de 40% solo se alcanza con las 3 señales, y que las reglas de Firestore bloquean escritura directa desde cliente.

---

## 11. Criterios de Aceptación

| # | Criterio | Verificación |
|---|----------|---------------|
| AC-01 | `trustSignals.*` y `trustScore` solo se escriben vía Cloud Functions (Admin SDK) | Test de Firestore rules: `update` directo desde cliente debe fallar |
| AC-02 | El Trust Score con solo email+teléfono no alcanza el umbral de reserva (40%) | Test: usuario con esas 2 señales = 25%, no puede reservar |
| AC-03 | El Trust Score con las 3 señales alcanza exactamente 45% | Test unitario de `calculateTrustScore` |
| AC-04 | No se persiste ninguna imagen de comprobante en el flujo de este KYC | Revisión de código de `verifyPaymentNameMatch` — solo strings, sin URLs de Storage propias del KYC |
| AC-05 | Un match fallido no bloquea definitivamente — pasa a revisión manual | Prueba E2E: nombre no coincide → estado `FAILED` → aparece en cola de revisión del admin |
| AC-06 | Usuarios con KYC legacy (`kycDocumentUrl`) siguen renderizando correctamente | Prueba con cuenta de usuario legacy, sin romper UI |
| AC-07 | El admin panel de pagos permite confirmar/rechazar el match sin pantalla nueva | Revisión de UI — el campo vive dentro del panel de revisión de pagos existente |
