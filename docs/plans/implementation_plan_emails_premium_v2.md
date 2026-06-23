# Implementación de Plantillas de Correo Premium (Auth)

Actualmente Firebase Auth envía correos genéricos de texto plano para la verificación de correo y el restablecimiento de contraseña. Para usar el diseño premium de VeneStay (HTML + CSS de `email-layout.ts`), debemos evitar el envío nativo de Firebase y crear nuestras propias Cloud Functions que despachen el correo a través del SMTP en Hostinger.

---

## User Review Required

> [!WARNING]
> **Credenciales SMTP — usar Secret Manager, no `.env`**
> Las credenciales SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) **no deben guardarse en un archivo `.env` dentro de `functions/`**. Un `.env` puede commitearse accidentalmente, quedar expuesto en logs de CI/CD o en el ZIP de deploy. El estándar oficial de Firebase para secrets en producción es **Google Secret Manager**:
> ```bash
> firebase functions:secrets:set SMTP_HOST
> firebase functions:secrets:set SMTP_PORT
> firebase functions:secrets:set SMTP_USER
> firebase functions:secrets:set SMTP_PASS
> ```
> En desarrollo local, el archivo `.env` en `functions/` sí es aceptable, pero debe estar en `.gitignore` y **nunca** commiteado. Al aprobar este plan, configura los secrets en Secret Manager antes del primer deploy a producción.

> [!CAUTION]
> **Rate limiting obligatorio antes de deploy**
> `sendCustomVerificationEmail` y `sendCustomPasswordResetEmail` son endpoints que envían correos. Sin rate limiting, pueden ser usadas para spam masivo a terceros desde la infraestructura de VeneStay. Ver sección de Cloud Functions para la implementación requerida.

---

## Open Questions

~~Ninguna.~~ — **Revisado:** hay dos decisiones pendientes de confirmación:

1. **`actionCodeSettings.url`**: ¿cuál es la URL base a la que Firebase debe redirigir al usuario después de verificar su email o resetear su contraseña? (ej. `https://venestay.com/auth/callback` o `https://venestay.com/mi-pasaporte`). Esta URL debe pasarse en `generateEmailVerificationLink` y `generatePasswordResetLink`.
2. **Integración con KYC**: al verificar el email, se debe disparar `recalculateKycPhase` para actualizar `trustSignals.emailVerified` y `canBook`. Este plan lo incluye como parte del trigger `onEmailVerified` — confirmar que la spec KYC ya fue aprobada antes de implementar esta función.

---

## Proposed Changes

---

### Cloud Functions (Backend)

#### [MODIFY] `functions/package.json`
- Añadir `nodemailer` en `dependencies` y `@types/nodemailer` en `devDependencies`.
- Verificar que `firebase-functions` es v4+ para compatibilidad con Secret Manager (`runWith({ secrets: [...] })`).

#### [NEW] `functions/src/templates/auth-emails.ts`
- Crear plantillas HTML usando `buildEmailWrapper` de `email-layout.ts`:
  - `buildEmailVerificationHTML(displayName: string, actionLink: string): string`
  - `buildPasswordResetHTML(displayName: string, actionLink: string): string`
- Las plantillas deben incluir un **texto alternativo plano** (`text:` field en nodemailer) para clientes de correo que no renderizan HTML — evita que el correo caiga en spam o sea ilegible.

#### [NEW] `functions/src/lib/mailer.ts` *(separar la creación del transporter)*
- Centralizar la creación del transporter de nodemailer en un módulo independiente, en lugar de crearlo inline en `customEmails.functions.ts`. Esto permite reutilizarlo en otras Cloud Functions (notificaciones de reservas, etc.) sin duplicar la lógica de conexión SMTP.

```typescript
// functions/src/lib/mailer.ts
import * as nodemailer from 'nodemailer';

export function createTransporter() {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // TLS — Hostinger usa puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}
```

#### [NEW] `functions/src/auth/customEmails.functions.ts`

**`sendCustomVerificationEmail`**
- Tipo: `httpsCallable` — requiere usuario **autenticado**.
- Validar que el `email` en el request coincide con `context.auth.token.email` — un usuario autenticado no puede solicitar un link de verificación para el email de otra persona.
- Rate limit: máximo **3 llamadas por usuario por hora** (implementar con contador en Firestore o usando la colección `rateLimits/{userId}`).
- Generar el link con `admin.auth().generateEmailVerificationLink(email, { url: ACTION_CODE_URL })`.
- Enviar la plantilla HTML vía SMTP con fallback de logging si el envío falla.

```typescript
export const sendCustomVerificationEmail = functions
  .runWith({ secrets: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] })
  .https.onCall(async (data, context) => {
    // 1. Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado.');
    }
    // 2. Validar que el email pertenece al usuario que llama
    if (data.email !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'Email no coincide con tu cuenta.');
    }
    // 3. Rate limiting
    await enforceRateLimit(context.auth.uid, 'verificationEmail', 3, 60);
    // 4. Generar link y enviar
    const actionLink = await admin.auth().generateEmailVerificationLink(data.email, {
      url: process.env.ACTION_CODE_URL, // ej. https://venestay.com/auth/callback
    });
    const html = buildEmailVerificationHTML(data.displayName, actionLink);
    await sendMail({ to: data.email, subject: 'Verifica tu correo — VeneStay', html });
  });
```

**`sendCustomPasswordResetEmail`**
- Tipo: `httpsCallable` — **no requiere autenticación** (el usuario olvidó su contraseña).
- Rate limit más estricto: máximo **3 llamadas por email por hora**, por IP si es posible. Usar un contador en Firestore keyed por email normalizado (lowercase), no por `userId`.
- **Nunca revelar si el email existe o no** en la respuesta — responder siempre con éxito genérico, igual que Firebase nativo, para no filtrar información de usuarios registrados.
- Generar el link con `admin.auth().generatePasswordResetLink(email, { url: ACTION_CODE_URL })`.

```typescript
export const sendCustomPasswordResetEmail = functions
  .runWith({ secrets: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] })
  .https.onCall(async (data, _context) => {
    const email = (data.email as string).toLowerCase().trim();
    // Rate limit por email (no por userId — el usuario no está autenticado)
    await enforceRateLimit(email, 'passwordReset', 3, 60);
    try {
      const actionLink = await admin.auth().generatePasswordResetLink(email, {
        url: process.env.ACTION_CODE_URL,
      });
      const html = buildPasswordResetHTML(data.displayName ?? 'Usuario', actionLink);
      await sendMail({ to: email, subject: 'Restablece tu contraseña — VeneStay', html });
    } catch (error) {
      // Si el email no existe en Firebase Auth, generatePasswordResetLink lanza un error.
      // NO propagar ese error al cliente — responder siempre con éxito genérico.
      functions.logger.warn('sendCustomPasswordResetEmail: email no encontrado o error SMTP', { email, error });
    }
    // Respuesta genérica siempre, independientemente del resultado
    return { success: true };
  });
```

#### [NEW] `functions/src/auth/onEmailVerified.functions.ts` *(no estaba en el plan original)*

> [!IMPORTANT]
> Este trigger es necesario para conectar el flujo de Auth con el sistema KYC. Sin él, verificar el email no actualiza `trustSignals.emailVerified` ni dispara `recalculateKycPhase`, y el usuario nunca avanza en el KYC aunque haya verificado su correo.

```typescript
// Se dispara cuando Firebase Auth marca el email como verificado
export const onEmailVerified = functions.auth.user().beforeSignIn(async (user) => {
  if (user.emailVerified) {
    await admin.firestore().collection('users').doc(user.uid).update({
      'trustSignals.emailVerified': true,
    });
    await recalculateKycPhase(user.uid); // función central del sistema KYC
  }
});
```

*Alternativa si `beforeSignIn` no aplica al caso:* usar un trigger `onUpdate` en Firestore que reaccione cuando el token de Auth se refresca y `emailVerified` cambia a `true`, o llamar a `recalculateKycPhase` explícitamente desde `sendCustomVerificationEmail` una vez confirmada la verificación.

#### [NEW] `functions/src/lib/rateLimiter.ts` *(helper compartido)*

```typescript
// Contador simple en Firestore con TTL de ventana deslizante
export async function enforceRateLimit(
  key: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<void> {
  const ref = admin.firestore().collection('rateLimits').doc(`${action}:${key}`);
  // ... lógica de contador con expiresAt — lanza HttpsError('resource-exhausted') si se supera
}
```

#### [MODIFY] `functions/src/index.ts`
- Exportar `sendCustomVerificationEmail`, `sendCustomPasswordResetEmail`, `onEmailVerified`.
- **No** exportar `createTransporter` ni `enforceRateLimit` — son módulos internos.

---

### Frontend

#### [MODIFY] `src/services/auth-service.ts`
- Modificar `sendVerificationEmail` para llamar a `httpsCallable('sendCustomVerificationEmail')` en lugar de `sendEmailVerification` nativo.
- Crear `sendPasswordReset(email: string)` que llame a `httpsCallable('sendCustomPasswordResetEmail')`.
- Manejar el error `resource-exhausted` (rate limit) mostrando un mensaje claro: "Has solicitado demasiados correos. Espera antes de intentarlo de nuevo."

#### [MODIFY] `src/features/auth/hooks/useAuthForm.ts`
- Modificar `handleForgotPassword` para usar `authService.sendPasswordReset` en lugar del nativo de Firebase.
- Mostrar el mismo mensaje genérico de éxito independientemente de si el email existe — consistente con el comportamiento del backend.

---

## Verification Plan

### Manual Verification (Happy Path)
1. Hacer clic en "Enviar enlace" desde el modal de "Mi Pasaporte". Verificar que llega un correo con diseño Premium de VeneStay. Hacer clic en el link y confirmar que Firebase marca el email como verificado y el frontend actualiza el estado.
2. Hacer clic en "Restablecer contraseña" desde el modal de Login. Verificar que el correo de recuperación tiene diseño Premium. Hacer clic en el link y confirmar que se puede cambiar la contraseña exitosamente.
3. Verificar que el link de los correos redirige correctamente a `ACTION_CODE_URL` tras completar la acción.

### Verification de Seguridad (obligatorio antes de deploy)
4. **Rate limit — verificación:** solicitar más de 3 correos de verificación en menos de una hora con la misma cuenta → el 4º intento debe retornar error `resource-exhausted`.
5. **Rate limit — reset:** solicitar más de 3 resets para el mismo email en menos de una hora → mismo resultado.
6. **Email ajeno — verificación:** intentar llamar a `sendCustomVerificationEmail` con un email distinto al de la cuenta autenticada → debe retornar `permission-denied`.
7. **Email inexistente — reset:** solicitar reset para un email que no existe en Firebase Auth → la respuesta del cliente debe ser idéntica a la de un email que sí existe (no filtrar información).
8. **Escritura directa de `trustSignals.emailVerified` desde cliente:** intentar escribir ese campo directamente en Firestore → las reglas deben denegar la operación.

### Verification de Integración con KYC
9. Verificar el email de una cuenta nueva → revisar en Firebase Console que `trustSignals.emailVerified === true` y que `recalculateKycPhase` actualizó `kycPhase` y `canBook` correctamente.
10. Confirmar que un usuario que ya verificó su email antes de este deploy no pierde su estado (`kycStatus === 'VERIFIED'` legacy sigue funcionando).

### Verification de Resiliencia
11. Simular fallo SMTP (credenciales incorrectas en local) → la Cloud Function debe loggear el error en Firebase Logger sin exponer el detalle al cliente. El cliente recibe un mensaje genérico de error, no el stack trace de nodemailer.
