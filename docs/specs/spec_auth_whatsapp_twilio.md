# Especificación Atómica — VeneStay SDD

**ID:** SPEC-AUTH-WHATSAPP-001  
**Fecha:** 29 de junio de 2026  
**Revisión:** v1.1 — Correcciones post-análisis (29 jun 2026)  
**Sprint:** S05 — Admin Tools & Maintenance (o S06 Beta Lechería)  
**Prioridad:** P1  

---

### 1. Contexto

Para el lanzamiento de la **Beta en Lechería (Julio 2026)**, es indispensable que los usuarios puedan verificar su número de teléfono/WhatsApp mediante un código OTP real. Actualmente, el módulo de pasaporte de VeneStay ejecuta esta verificación en modo **STUB** en Cloud Functions (`sendWhatsAppOTP`), imprimiendo el código únicamente en los logs del servidor. Esta especificación define la sustitución del modo STUB por la integración real con **Twilio WhatsApp Messaging API**, manteniendo la seguridad, el aislamiento de secretos y la compatibilidad con el frontend existente.

---

### 2. Alcance

- **Capa FSD:** `services / infra` (Firebase Cloud Functions)
- **Archivos afectados:**
  - `functions/package.json` — Agregar dependencia `twilio` (comando: `cd functions && npm install twilio --save`)
  - `functions/src/auth.functions.ts` — Modificar `sendWhatsAppOTP`: patrón de secretos, generación segura de OTP, envío real vía Twilio y cooldown de reenvío
- **Funciones / Componentes:** `sendWhatsAppOTP` (Cloud Function Callable)
- **`confirmWhatsAppOTP`:** **SIN CAMBIOS** — su lógica de validación de hash, intentos y KYC ya es correcta
- **Tipo de cambio:** `MODIFICAR`

---

### 3. Qué debe hacer

#### 3.1 Instalación del SDK

Ejecutar en la terminal, posicionado en el directorio `functions/` del proyecto:

```bash
cd functions
npm install twilio --save
```

> ⚠️ **Crítico:** El paquete debe instalarse dentro de `functions/`, no en la raíz del proyecto. El SDK oficial de Twilio ya incluye sus tipos TypeScript — no se necesita `@types/twilio`.

---

#### 3.2 Patrón de Secretos — Usar `.runWith({ secrets })` (Firebase Functions v1)

El proyecto ya usa este patrón en `functions/src/auth/customEmails.functions.ts`. La función **debe seguir el mismo patrón exacto**:

```typescript
import twilio from 'twilio';

// ✅ CORRECTO: Secrets inyectados por Firebase Secret Manager
export const sendWhatsAppOTP = functions
  .runWith({ secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'] })
  .https.onCall(async (data: { phoneNumber: string }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    
    // Inicializar el cliente DENTRO del callable (no en el módulo global)
    // para garantizar que los secretos estén disponibles en el momento de ejecución
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const twilioFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
    // ...resto de la lógica
  });
```

> ⚠️ **No inicializar `twilio()` en el scope global del módulo.** Los secretos solo están disponibles dentro del handler. Este es el mismo patrón que usa `createTransporter()` en las Cloud Functions de email.

---

#### 3.3 Generación Criptográficamente Segura del OTP (Corrección C-1)

Reemplazar la generación actual con `Math.random()` por `crypto.randomInt()`. El módulo `crypto` ya está importado en el archivo.

```typescript
// ❌ ANTES (inseguro — no usar):
const code = Math.floor(100000 + Math.random() * 900000).toString();

// ✅ DESPUÉS (criptográficamente seguro):
const code = crypto.randomInt(100000, 1000000).toString();
```

---

#### 3.4 Cooldown de Reenvío (Anti-spam / Anti-costo Twilio)

Antes de generar y enviar un nuevo OTP, verificar si ya existe uno activo con menos de 9 minutos transcurridos. Si el documento `otpCodes/{uid}` existe y su `expiresAt` es mayor a `now + 1 minuto`, rechazar la solicitud:

```typescript
const existingOtp = await db.collection('otpCodes').doc(uid).get();
if (existingOtp.exists) {
  const existingData = existingOtp.data()!;
  const cooldownThreshold = new Date(Date.now() + 60 * 1000); // 1 minuto restante = cooldown
  if (existingData.expiresAt.toDate() > cooldownThreshold) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Ya enviamos un código recientemente. Espera antes de solicitar otro.'
    );
  }
}
```

---

#### 3.5 Envío del Mensaje WhatsApp vía Twilio

Una vez generado el código y guardado el hash en Firestore, enviar el mensaje:

```typescript
await client.messages.create({
  body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
  from: twilioFrom,
  to: `whatsapp:${data.phoneNumber}`,
});
```

---

#### 3.6 Manejo de Errores

Capturar excepciones de Twilio sin filtrar credenciales en los logs:

```typescript
} catch (error: unknown) {
  // ⚠️ Loguear el código de error de Twilio, NUNCA el token ni el SID
  const twilioError = error as { code?: number; message?: string };
  functions.logger.error('[Twilio] Error al enviar OTP', {
    code: twilioError.code,
    to: data.phoneNumber,
  });
  throw new functions.https.HttpsError(
    'aborted',
    'No se pudo enviar el mensaje de WhatsApp. Verifica que el número sea correcto y esté registrado en WhatsApp.'
  );
}
```

---

### 4. Qué NO debe hacer (límites)

- **NO alterar el frontend:** `WhatsAppVerificationCard.tsx` ya envía `{ phoneNumber }` en formato E.164 (`+58...`) y espera `{ success: true, message: ... }`. No se debe cambiar este contrato.
- **NO hardcodear credenciales:** Bajo ninguna circunstancia se escribirán SIDs, tokens ni números en el código fuente ni en archivos versionados por git.
- **NO inicializar `twilio()` en el scope global del módulo:** Solo dentro del handler del callable (ver §3.2).
- **NO exponer el OTP al cliente:** El código en texto plano jamás debe ser devuelto en el payload de respuesta de la función HTTPS.
- **NO modificar `confirmWhatsAppOTP`:** Su lógica de validación es correcta. Esta spec no la toca.
- **NO instalar `twilio` en la raíz del proyecto:** Solo en el directorio `functions/`.

---

### 5. Tipos de referencia

> **Nota:** `TwilioConfigSecrets` es un contrato de **documentación arquitectónica**, no una interfaz funcional de código. Los secretos se consumen directamente desde `process.env.*` dentro del callable.

```typescript
// ──────────────────────────────────────────────────
// CONTRATOS DE DATOS (ya existentes, sin cambios)
// ──────────────────────────────────────────────────

// Payload que llega desde WhatsAppVerificationCard.tsx
interface SendWhatsAppOTPRequest {
  phoneNumber: string; // Formato E.164 obligatorio (ej. +584121234567)
}

// ──────────────────────────────────────────────────
// REFERENCIA DE SECRETOS (solo documentación)
// ──────────────────────────────────────────────────

/**
 * Nombres exactos de los secretos en Google Cloud Secret Manager.
 * Se consumen como process.env.* dentro del callable.
 * NO usar como interfaz de objeto en el código.
 */
// TWILIO_ACCOUNT_SID     → string (ej. "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
// TWILIO_AUTH_TOKEN      → string (token de autenticación de Twilio)
// TWILIO_WHATSAPP_NUMBER → string (ej. "+14155238886" — sin prefijo "whatsapp:")
```

---

### 6. Schema Zod requerido (Validación Server-Side)

Validación defensiva aplicada al inicio del callable, antes de cualquier operación:

```typescript
import { z } from 'zod';

const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'El número debe estar en formato internacional E.164 válido.'),
});

// Uso en el callable:
const parsed = sendOtpSchema.safeParse(data);
if (!parsed.success) {
  throw new functions.https.HttpsError(
    'invalid-argument',
    parsed.error.errors[0]?.message ?? 'Número de teléfono inválido.'
  );
}
```

---

### 7. Criterios de aceptación (QA Gate los verificará)

- [ ] **CA-1:** `sendWhatsAppOTP` envía el mensaje de WhatsApp al número indicado vía SDK de Twilio. Se puede verificar en el dashboard de Twilio o en el teléfono del desarrollador (Sandbox).
- [ ] **CA-2:** Si el envío por Twilio falla (número inválido, fuera del sandbox, cuenta suspendida), la función captura el error **sin filtrar tokens en los logs** y retorna `HttpsError('aborted', ...)` legible para el usuario.
- [ ] **CA-3:** El código OTP se almacena en Firestore (`otpCodes/{uid}`) únicamente bajo hash SHA-256 con expiración de 10 minutos.
- [ ] **CA-4:** Si el usuario solicita un nuevo OTP antes de que expire el cooldown de 1 minuto, la función retorna `HttpsError('resource-exhausted', ...)` sin generar un nuevo envío a Twilio.
- [ ] **CA-5:** El código OTP se genera usando `crypto.randomInt(100000, 1000000)` — no `Math.random()`.
- [ ] **CA-6:** La verificación exitosa en `confirmWhatsAppOTP` actualiza `trustSignals.whatsappVerified = true` exclusivamente desde el servidor (Admin SDK) y ejecuta `recalculateKycPhase(uid)` correctamente.
- [ ] **CA-7:** `npm run build` en el directorio `functions/` se ejecuta con **0 errores TypeScript**.
- [ ] **CA-8:** `npm run lint` en la raíz del proyecto pasa **sin violaciones de reglas ESLint**.
- [ ] **CA-9:** Ningún secreto ni variable sensible se encuentra en el código, commits, logs ni UI (`Seguridad Bloqueante §6.1 AGENTS.md`).

---

### 8. Prerequisitos (bloqueantes antes de implementar)

El Nodo 3 (Técnico Backend) **no puede iniciar la implementación** hasta que estos prerequisitos estén resueltos por el usuario:

| # | Prerequisito | Dónde configurarlo |
|:--|:-------------|:-------------------|
| P-1 | Crear cuenta Twilio y activar el **Sandbox de WhatsApp Business** | [console.twilio.com](https://console.twilio.com) → Messaging → Try it out → Send a WhatsApp message |
| P-2 | Obtener `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` | Dashboard de Twilio → Account Info |
| P-3 | Registrar el número de teléfono del sandbox como `TWILIO_WHATSAPP_NUMBER` | Dashboard → Sandbox Number (ej. `+14155238886`) |
| P-4 | Crear los 3 secretos en **Google Cloud Secret Manager** del proyecto `gen-lang-client-0727178605` con los nombres exactos: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` | [console.cloud.google.com](https://console.cloud.google.com) → Secret Manager |
| P-5 | Para desarrollo local: crear `functions/.env` (en `.gitignore`) con los valores del Sandbox | Archivo `functions/.env` — NO versionar |

---

### 9. Dependencias

- **Requiere:** Todos los prerequisitos del §8 resueltos antes de iniciar el Nodo 3.
- **Bloquea:** Liberación a producción de la Beta Lechería con flujos de reserva habilitados (`canBook === true`) para huéspedes nuevos. Sin OTP real, `kycPhase` no puede alcanzar el valor `1`.
