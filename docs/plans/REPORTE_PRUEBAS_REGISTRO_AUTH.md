# REPORTE DE DIAGNÓSTICO Y PRUEBAS AUTOMATIZADAS DE REGISTRO
**Fecha:** 30 de Junio de 2026  
**Módulo:** Autenticación (`AuthModal`, `useAuthForm`)  
**ID de Spec:** `SPEC-AUTH-REG-FIX-001`  
**Ejecutado por:** División de Ingeniería de IA — Antigravity (Nodo 4 QA & Nodo 2 Planner)

---

## 1. Síntoma Reportado
Al intentar registrar una nueva cuenta (ejemplo mostrado en captura: `abrahannysmiltguzman@gmail.com`), la interfaz muestra el banner rojo de error:
> ❌ **"Error al crear la cuenta. Inténtalo de nuevo."**

Sin embargo, al verificar en la base de datos y consola de Firebase, **la cuenta sí fue creada exitosamente**.

---

## 2. Diagnóstico Técnico con Playwright (Suite `tests/e2e/register-diagnosis.spec.ts`)

Se ejecutaron pruebas automatizadas interceptando las peticiones a la API de Firebase (`identitytoolkit.googleapis.com`) y a Cloud Functions (`sendCustomVerificationEmail`).

### Trazabilidad de Red (Network Trajectory)
Al enviar el formulario de registro (`createUserWithEmailAndPassword`), ocurre la siguiente secuencia exacta en milisegundos:

1. **`POST https://identitytoolkit.googleapis.com/v1/accounts:signUp`**
   - **Estado:** `200 OK`
   - **Resultado:** La cuenta de usuario **se crea en Firebase Auth** y el cliente recibe el `idToken`. El usuario queda inmediatamente autenticado (`auth.currentUser != null`).
2. **`POST https://identitytoolkit.googleapis.com/v1/accounts:update`**
   - **Estado:** `200 OK`
   - **Resultado:** Se actualiza el `displayName` del usuario en su perfil de Auth.
3. **`POST https://us-central1-gen-lang-client-0727178605.cloudfunctions.net/sendCustomVerificationEmail`**
   - **Comportamiento:** El cliente invoca la Cloud Function para enviar el correo de verificación personalizado con nodemailer/SMTP.

### Análisis de Causa Raíz (RCA)
En `src/features/auth/hooks/useAuthForm.ts` (líneas 156-170), el código actual es monolítico:

```typescript
try {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  await sendVerificationEmail(userCredential.user);
  onClose();
} catch (err: unknown) {
  const authErr = err as AuthError;
  const mappedMsg = firebaseErrorMap[authErr?.code] || 'Error al crear la cuenta. Inténtalo de nuevo.';
  setGeneralError(mappedMsg);
} finally {
  setLoading(false);
}
```

#### El Fallo Arquitectónico:
Si tras la creación exitosa del usuario (`createUserWithEmailAndPassword`), la llamada posterior a `sendVerificationEmail(userCredential.user)` sufre **cualquier micro-corte de red, latencia extrema (cold start de Cloud Functions > 10s), error SMTP de proveedor, o desajuste temporal de token**, la promesa de `sendVerificationEmail` lanza un error (`functions/internal`, `functions/deadline-exceeded`, etc.).

Al estar dentro del mismo bloque `try/catch` que la creación de cuenta:
1. El catch intercepta el fallo del correo.
2. Como el código de error devuelto no empieza por `auth/*` (es un error de functions), no coincide con ningún mapa en `firebaseErrorMap`.
3. El sistema recurre al mensaje por defecto: **`"Error al crear la cuenta. Inténtalo de nuevo."`**
4. La función `onClose()` nunca se ejecuta, dejando el modal abierto con un mensaje engañoso.
5. Si el usuario intenta hacer clic en "Crear cuenta" nuevamente, ahora falla con `auth/email-already-in-use` porque **la cuenta ya existe**.

---

## 3. Especificación Atómica de Corrección (SDD)

```markdown
## SPEC ATÓMICA — 2026-06-30

**ID:** SPEC-AUTH-REG-FIX-001
**Sprint:** S05
**Prioridad:** P0 (Experiencia crítica de onboarding y consistencia de datos)

### Contexto
Evitar que fallos secundarios (como latencia o error en el envío del correo de verificación tras registrarse) engañen al usuario indicando que su cuenta no fue creada cuando en realidad sí se creó en Firebase.

### Alcance
- **Capa FSD:** features
- **Archivo afectado:** `src/features/auth/hooks/useAuthForm.ts`
- **Función:** `handleSubmit` (rama `register`)
- **Tipo de cambio:** MODIFICAR

### Qué debe hacer
1. Aislar la creación de la cuenta (`createUserWithEmailAndPassword`) y actualización del nombre (`updateProfile`). Si esto tiene éxito, la cuenta es oficialmente válida.
2. Encapsular la llamada a `sendVerificationEmail(userCredential.user)` en un bloque `try/catch` secundario e independiente.
3. Si el envío del correo de verificación falla:
   - Registrar una advertencia en consola.
   - **NO mostrar el error general de "Error al crear la cuenta"**.
   - Activar la vista o advertencia de correo no verificado (`setUnverifiedEmailWarning(true)`) o cerrar el modal permitiendo al `AuthContext` gestionar la sesión del usuario, informando que la cuenta fue creada y permitiéndole reenviar el correo desde la UI.

### Qué NO debe hacer
- No debe revertir ni borrar la cuenta de usuario en Firebase si falla el correo.
- No debe alterar las validaciones de Zod (`registerSchema`).

### Criterios de Aceptación (QA Gate)
- [ ] CA-1: Si `createUserWithEmailAndPassword` exitoso y `sendVerificationEmail` exitoso → Modal se cierra limpiamente (`onClose()`).
- [ ] CA-2: Si `createUserWithEmailAndPassword` exitoso pero `sendVerificationEmail` lanza error → Modal no muestra "Error al crear la cuenta"; la sesión se mantiene activa y se le da feedback al usuario de que su cuenta está creada.
- [ ] CA-3: TypeScript compila sin errores (`npx tsc --noEmit`).
- [ ] CA-4: Pruebas automatizadas E2E en Playwright pasan sin regresiones.
```

---

## 4. Documento de Pruebas Automatizadas Playwright

El script automatizado creado en `tests/e2e/register-diagnosis.spec.ts` contempla la siguiente estructura de validación continua:

| ID Prueba | Escenario | Resultado Esperado | Estado Actual |
| :--- | :--- | :--- | :--- |
| `DIAG-01` | Registro con email existente o solicitado (`rodriguezz_carlose@hotmail.com`) | Captura de errores HTTP y verificación visual en UI | ✅ Automatizado |
| `DIAG-02` | Registro con email único (`rodriguezz_carlose_<timestamp>@hotmail.com`) | 200 OK en `signUp`, `update` y `sendCustomVerificationEmail`. Modal cierra sin error | ✅ Automatizado |

---

## 5. Próximos Pasos (Solicitud de Aprobación al Usuario)
De acuerdo a la **Regla Absoluta 2 (Spec Before Code)** de VeneStay SDD v4.0, se solicita al usuario:
> **Confirmar si se aprueba la especificación `SPEC-AUTH-REG-FIX-001` para proceder con la implementación del desacople del envío de correo en `useAuthForm.ts`.**
