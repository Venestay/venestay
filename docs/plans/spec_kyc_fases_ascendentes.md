# SPEC — Sistema KYC por Fases Ascendentes
**Estado:** Propuesta — pendiente de aprobación
**Reemplaza a:** `spec_soft_kyc_signal_stacking.md`, `spec_soft_kyc_cne_future.md`
**Paradigma:** Spec-Driven Development (SDD) — sin código hasta aprobación formal

---

## 1. Filosofía de Diseño

El sistema KYC de VeneStay crece de forma **ascendente**: cada fase añade confianza sin romper lo anterior. Un usuario que cumple la Fase 1 puede reservar desde el día uno. Las fases posteriores desbloquean funcionalidades adicionales (propiedades premium, montos más altos, menor escrutinio del host) sin bloquear retroactivamente a quienes ya reservaron.

**Principios que no cambian en ninguna fase:**
- Ningún campo de seguridad (`kycStatus`, `trustSignals.*`, `trustScore`) se escribe desde el cliente. Solo Cloud Functions vía Admin SDK.
- No se almacenan documentos de identidad nacionales (cédula, pasaporte) en ninguna fase.
- El gating real de reservas vive en el backend (`createBooking`), no en el frontend. El frontend solo refleja el estado para UX.

---

## 2. Resumen de Fases

| Fase | Nombre | Requisito para reservar | Estado |
|------|--------|------------------------|--------|
| 1 | Identidad Básica | Email verificado + WhatsApp OTP + perfil completo | **Sprint actual** |
| 2 | Confianza Financiera | Fase 1 + coincidencia de nombre en primer pago (Pago Móvil/Binance) | Backlog |
| 3 | Confianza Reforzada | Fase 2 + vouching de host o historial de reservas completadas | Backlog |

---

## 3. FASE 1 — Identidad Básica

### 3.1 Requisitos para poder reservar

El sistema **no usa un umbral numérico de Trust Score** en esta fase. El gating es booleano: todas las condiciones deben ser `true` simultáneamente.

| Requisito | Verificación | Quién verifica |
|-----------|-------------|----------------|
| Email verificado | Link de confirmación (Firebase Auth nativo) | Sistema automático |
| Teléfono verificado | OTP por WhatsApp | Cloud Function `verifyWhatsAppOTP` |
| Nombre completo | Campo no vacío, mínimo 2 palabras | Validación en Cloud Function `updateProfile` |
| Fecha de nacimiento | Campo no vacío, usuario mayor de 18 años | Validación en Cloud Function `updateProfile` |
| Foto de perfil | URL de imagen subida a Storage | Cloud Function `uploadProfilePhoto` |
| Descripción / Bio | Campo no vacío, mínimo 20 caracteres | Validación en Cloud Function `updateProfile` |

> [!IMPORTANT]
> La mayoría de edad (18 años) se valida contra la fecha de nacimiento declarada. No es verificación gubernamental — es una declaración jurada implícita del usuario. Se documenta en los Términos de Servicio.

### 3.2 Modelo de datos — `UserProfile` (Firestore)

```typescript
interface UserProfile {
  // Campos existentes que se reutilizan
  displayName: string;           // nombre completo
  photoURL: string;              // foto de perfil (Storage URL)
  email: string;
  
  // Señales de verificación — escritura solo vía Admin SDK
  trustSignals: {
    emailVerified: boolean;                          // Firebase Auth
    whatsappVerified: boolean;                       // OTP WhatsApp
    whatsappNumber: string | null;                   // número confirmado, nunca el número declarado sin OTP
    whatsappVerifiedAt: Timestamp | null;
    
    // Fase 2 (declarado aquí para no migrar el schema después)
    paymentNameMatchStatus: 'NOT_ATTEMPTED' | 'PENDING' | 'MATCHED' | 'FAILED';
    paymentNameMatchedAt: Timestamp | null;
    
    // Fase 3
    vouchingStatus: 'NONE' | 'VOUCHED';
    vouchedBy: string | null;                        // userId del host que hizo vouching
  };

  // Datos de perfil — escritura vía Cloud Function updateProfile con validación
  profile: {
    bio: string;
    birthDate: Timestamp;
    birthDateVerified: boolean;                      // true si pasó validación de mayoría de edad
  };

  // Estado KYC derivado — calculado por Cloud Function, nunca escrito por cliente
  kycPhase: 0 | 1 | 2 | 3;                         // fase máxima que el usuario ha alcanzado
  canBook: boolean;                                  // calculado: kycPhase >= 1
  
  // Legacy — mantener para usuarios con KYC documental anterior
  kycStatus?: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  kycDocumentUrl?: string;
}
```

> [!CAUTION]
> **Compatibilidad legacy:** usuarios con `kycStatus === 'VERIFIED'` (KYC documental anterior) mantienen `canBook = true` sin necesidad de re-verificar. La Cloud Function `recalculateKycPhase` detecta este caso y no lo pisa.

### 3.3 Cloud Functions — Fase 1

#### `verifyWhatsAppOTP` (nueva)

**Flujo:**
1. Cliente llama a `sendWhatsAppOTP({ phoneNumber })`.
2. Cloud Function genera un código OTP de 6 dígitos, lo almacena hasheado en Firestore con TTL de 10 minutos, y lo envía vía WhatsApp (ver sección 3.4 — integración de mensajería).
3. Cliente llama a `confirmWhatsAppOTP({ phoneNumber, code })`.
4. Cloud Function valida el código contra el hash almacenado y el TTL.
5. Si es válido: escribe `trustSignals.whatsappVerified = true`, `trustSignals.whatsappNumber = phoneNumber`, limpia el OTP de Firestore, y llama a `recalculateKycPhase`.

```typescript
// Estructura del OTP temporal en Firestore (colección separada, no en /users)
// /otpCodes/{userId}
interface OtpRecord {
  codeHash: string;       // bcrypt o SHA-256 del código — nunca el código en claro
  phoneNumber: string;
  expiresAt: Timestamp;   // now + 10 minutos
  attempts: number;       // máximo 3 intentos antes de invalidar
}
```

> [!CAUTION]
> El código OTP **nunca se almacena en claro** en Firestore, ni siquiera temporalmente. Solo el hash. Ante una brecha, un OTP hasheado no es explotable.

#### `updateProfile` (modificar existente)

Agregar validaciones server-side antes de persistir:
- `displayName`: mínimo 2 palabras, máximo 60 caracteres.
- `bio`: mínimo 20 caracteres, máximo 500 caracteres.
- `birthDate`: usuario debe tener >= 18 años al momento de la validación. Si no, rechazar con error `'too-young'`.
- Al completar estos campos, llamar a `recalculateKycPhase`.

#### `recalculateKycPhase` (nueva — función central idempotente)

```typescript
async function recalculateKycPhase(userId: string): Promise<void> {
  const user = await admin.firestore().collection('users').doc(userId).get();
  const data = user.data();

  // Legacy: si ya tenía KYC documental aprobado, no pisar
  if (data?.kycStatus === 'VERIFIED') {
    await user.ref.update({ kycPhase: 1, canBook: true });
    return;
  }

  const signals = data?.trustSignals;
  const profile = data?.profile;

  // Fase 1
  const phase1 =
    signals?.emailVerified === true &&
    signals?.whatsappVerified === true &&
    !!data?.displayName && data.displayName.trim().split(' ').length >= 2 &&
    !!data?.photoURL &&
    profile?.birthDateVerified === true &&
    (profile?.bio?.length ?? 0) >= 20;

  // Fase 2 (se evalúa solo si Fase 1 cumplida)
  const phase2 = phase1 && signals?.paymentNameMatchStatus === 'MATCHED';

  // Fase 3
  const phase3 = phase2 && signals?.vouchingStatus === 'VOUCHED';

  const kycPhase = phase3 ? 3 : phase2 ? 2 : phase1 ? 1 : 0;

  await user.ref.update({
    kycPhase,
    canBook: kycPhase >= 1,
  });
}
```

#### `createBooking` — guard de seguridad (modificar existente)

```typescript
// Reemplazar la lógica de kycStatus === 'VERIFIED' por:
const userDoc = await admin.firestore().collection('users').doc(userId).get();
const canBook = userDoc.data()?.canBook === true;

if (!canBook) {
  throw new HttpsError(
    'failed-precondition',
    'Debes completar tu perfil y verificar tu contacto antes de reservar.'
  );
}
```

### 3.4 Integración WhatsApp OTP

**Opción recomendada para beta:** Usar la integración de WhatsApp Business que VeneStay ya evalúa vía **Jelou AI** (ya referenciada en el proyecto). Jelou puede enviar mensajes de WhatsApp templados con el código OTP sin requerir la API oficial de Meta directamente.

**Alternativa de bajo costo para lanzamiento rápido:** Twilio WhatsApp Sandbox (gratis para desarrollo, ~$0.005/mensaje en producción) o `wapi.chat` (proveedor venezolano/latinoamericano más económico).

**Fallback:** si el proveedor de WhatsApp falla, ofrecer SMS como canal alternativo desde la misma UI, sin cambiar la Cloud Function (solo cambia el canal de entrega).

> [!NOTE]
> La selección del proveedor de WhatsApp queda fuera del alcance de esta spec. Lo que sí es fijo: la Cloud Function `verifyWhatsAppOTP` recibe el número y el código — el canal de entrega es un detalle de configuración, no de arquitectura.

### 3.5 Reglas de Firestore

```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();

  allow update: if request.auth.uid == userId
    // El cliente puede actualizar campos de perfil presentacional
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['displayName', 'photoURL', 'profile.bio', 'profile.birthDate'])
    // Pero nunca los campos de seguridad
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['trustSignals', 'kycPhase', 'canBook', 'kycStatus']);
}

// OTP temporal — solo la Cloud Function puede leer/escribir
match /otpCodes/{userId} {
  allow read, write: if false; // solo Admin SDK
}
```

> [!CAUTION]
> Nótese la asimetría intencional: `displayName` y `photoURL` **sí** pueden ser escritos por el cliente (son datos presentacionales), pero `trustSignals`, `kycPhase` y `canBook` **nunca**. La validación de que `displayName` tenga >= 2 palabras ocurre en `updateProfile` (Cloud Function), no en las reglas de Firestore.

### 3.6 Frontend — Cambios Fase 1

#### `SecuritySection.tsx` — nueva tarjeta de WhatsApp
- Estado visual: `Sin verificar` → `Código enviado (X:XX)` → `Verificado ✓`.
- Input del número con selector de prefijo (+58 Venezuela por defecto).
- Botón "Reenviar código" disponible tras 60 segundos (no antes).
- Máximo 3 intentos antes de mostrar "Espera 30 minutos para intentarlo de nuevo" (el backend invalida el OTP tras 3 intentos fallidos).

#### `PassportCompletionBanner` (nuevo componente)
Checklist de progreso visible en el perfil y en el checkout si `canBook === false`:

```
Para reservar necesitas:
✅ Email verificado
⬜ Verificar WhatsApp
⬜ Agregar foto de perfil  
⬜ Completar nombre completo
⬜ Agregar fecha de nacimiento
⬜ Escribir una descripción (mín. 20 caracteres)
```

#### `CheckoutPage.tsx` — condición de UX (solo visual)
```typescript
// Solo para UI — el backend valida canBook independientemente
const canProceedToCheckout = profileData?.canBook === true;
```

#### `KYCRequiredModal.tsx`
- Reemplazar copy de "sube tu cédula" por el `PassportCompletionBanner` embebido.
- Deep link directo a Mi Pasaporte → sección correspondiente al ítem pendiente.

---

## 4. FASE 2 — Confianza Financiera (Backlog)

Se activa automáticamente cuando el usuario completa su primer pago real (depósito UCP 20/80). No requiere ninguna acción extra del usuario más allá de pagar.

**Señal adicional:** coincidencia del nombre declarado en el perfil con el nombre del titular del instrumento de pago (Pago Móvil o Binance), confirmada durante la revisión del comprobante por el admin o por OCR.

**Efecto en `kycPhase`:** `1 → 2`. No cambia `canBook` (ya era `true`), pero puede usarse en el futuro para desbloquear propiedades con requisito `minGuestPhase: 2`.

*Spec detallada: ver `spec_soft_kyc_signal_stacking.md` — sección de Señal 3.*

---

## 5. FASE 3 — Confianza Reforzada (Backlog)

**Señales adicionales (cualquiera de las dos):**
- Vouching de un host con historial verificado en la plataforma.
- Historial acumulado de N reservas completadas sin incidentes (umbral a definir en la spec de Fase 3).

**Efecto en `kycPhase`:** `2 → 3`. Puede desbloquear propiedades premium o reducir el escrutinio del host en `bookingMode: 'request'`.

*Spec detallada: pendiente de diseño.*

---

## 6. Plan de Acción — Fase 1 (Sprint actual)

El orden es estricto: el backend guard debe existir **antes** de que el frontend relaje el bloqueo visual.

1. **Schema:** Actualizar `types/index.ts` con la interfaz `UserProfile` revisada.
2. **Reglas de Firestore:** Aplicar las reglas de la sección 3.5.
3. **Cloud Functions:**
   - Modificar `updateProfile` con validaciones server-side (nombre, bio, birthDate).
   - Crear `sendWhatsAppOTP` y `confirmWhatsAppOTP`.
   - Crear `recalculateKycPhase` (función central idempotente).
   - Modificar `createBooking` con el guard `canBook === true`.
4. **Frontend:**
   - Nueva tarjeta WhatsApp en `SecuritySection.tsx`.
   - Nuevo componente `PassportCompletionBanner`.
   - Actualizar `CheckoutPage.tsx` y `KYCRequiredModal.tsx`.
5. **Pruebas** (ver sección 7).

---

## 7. Criterios de Aceptación — Fase 1

| # | Criterio | Verificación |
|---|----------|--------------|
| AC-01 | Usuario con los 6 requisitos completos tiene `canBook: true` en Firestore | Revisar documento en Firebase Console |
| AC-02 | Usuario con solo email verificado NO puede reservar | `createBooking` retorna `failed-precondition` |
| AC-03 | OTP de WhatsApp expira a los 10 minutos | Test: usar código después de 10 min → rechazado |
| AC-04 | Máximo 3 intentos de OTP antes de invalidar | Test: 4º intento con código correcto → rechazado |
| AC-05 | El código OTP no está en claro en `/otpCodes/{userId}` | Revisar documento en Firebase Console — debe ser hash |
| AC-06 | Cliente no puede escribir `trustSignals.*` o `canBook` directamente | Test de Firestore rules: operación debe fallar |
| AC-07 | Usuario menor de 18 años no puede completar el perfil | `updateProfile` retorna error `'too-young'` |
| AC-08 | Usuario legacy con `kycStatus: 'VERIFIED'` mantiene `canBook: true` sin re-verificar | Prueba con cuenta legacy existente |
| AC-09 | `PassportCompletionBanner` muestra exactamente qué ítems faltan | Prueba con perfil parcialmente completo |
| AC-10 | `recalculateKycPhase` es idempotente — llamarla N veces produce el mismo resultado | Test unitario de la Cloud Function |
