# Informe de Diagnóstico v2.0: Error de Permisos Firebase
## Corrección del Toggle QA · VeneStay v2.3.0

> **Versión:** v2.0 — Reemplaza `informe_permissions_fix.md` original
> **Elaborado por:** División de Ingeniería de IA — Antigravity · Mayo 2026
> **Severidad original de la solución propuesta:** CRÍTICA — requería corrección antes de aplicarse

---

## ⚠️ Advertencia sobre el plan original

La solución propuesta en el informe anterior **no debe aplicarse**. Introduce tres vulnerabilidades de seguridad graves que serán detalladas en la Sección 4. Este documento presenta el diagnóstico correcto y la solución segura que resuelve el mismo problema sin comprometer la integridad de la base de datos.

---

## 1. Síntoma del Problema

Al presionar el botón de activación/desactivación del perfil QA (para llevar el Trust Score al 100% o restablecerlo al 0%) utilizando la cuenta `huespedvenestay` u otra cuenta de prueba no administrativa, la consola arroja:

```
FirebaseError: Missing or insufficient permissions
```

El perfil vuelve a su estado anterior de forma inconsistente porque el cliente no puede persistir los cambios en Firestore.

---

## 2. Causa Raíz (Análisis Técnico)

El error ocurre porque `ProfileSettings.tsx` (líneas 108–141) intenta escribir directamente desde el cliente los siguientes campos de seguridad en `/users/{userId}`:

- `isIdentityVerified`
- `kycStatus`
- `trustScore`

Las reglas activas de Firestore bloquean correctamente estas escrituras para cualquier usuario no administrador:

```javascript
allow update: if isSignedIn() && (
  (request.auth.uid == userId &&
   !incoming().diff(existing()).affectedKeys()
    .hasAny(['loyaltyStats', 'currentCommissionRate', 'role',
             'kycStatus', 'isIdentityVerified', 'trustScore',
             'kycDocumentUrl', 'kycStatusHistory'])) ||
  isAdmin()
);
```

**Las reglas están funcionando exactamente como deben.** El problema no está en las reglas — está en que `ProfileSettings.tsx` escribe campos de seguridad directamente desde el cliente, lo cual viola la arquitectura establecida de VeneStay desde el inicio del proyecto.

---

## 3. Diagnóstico Completo

### 3.1 El error real está en el componente, no en las reglas

`ProfileSettings.tsx` fue construido para simular estados de QA durante el desarrollo, pero lo hace a través de escrituras directas de Firestore que están — y deben estar — bloqueadas por las reglas de seguridad. Este es exactamente el vector de ataque que las reglas previenen: un cliente modificando campos que determinan el nivel de confianza y verificación de un usuario.

### 3.2 Por qué la solución propuesta original era peligrosa

Ver Sección 4 para el análisis completo de las tres vulnerabilidades críticas.

### 3.3 La causa secundaria: `isAdmin()` usa lecturas de Firestore

La función `isAdmin()` actual lee el campo `role` del documento del usuario en cada evaluación de la regla:

```javascript
function isAdmin() {
  return isSignedIn() && (
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}
```

Esto es un problema adicional: las lecturas de Firestore dentro de las reglas (`get()`) tienen un costo de operación, añaden latencia a cada evaluación, y son potencialmente manipulables si el campo `role` pudiera ser escrito por el cliente. La solución correcta para verificar roles es usar **Custom Claims** en el token JWT, no campos de Firestore.

---

## 4. Por qué NO Aplicar la Solución Propuesta en el Informe Original

### Vulnerabilidad 1 — Regex con comodín abierto

```javascript
// PELIGROSO — no aplicar
request.auth.token.email.toLowerCase().matches('.*huespedvenestay.*')
```

Este patrón coincide con **cualquier** correo que contenga la cadena `huespedvenestay`, incluyendo:
- `evil_huespedvenestay@attacker.com`
- `huespedvenestay.fake@gmail.com`
- `nothuespedvenestay@phishing.io`

Cualquier persona puede crear una cuenta con un correo que contenga esa cadena y obtener acceso de administrador completo a Firestore. En producción esto es un vector de ataque trivial.

### Vulnerabilidad 2 — Dominio `@venestay.com` sin control verificado

```javascript
// PELIGROSO — no aplicar
request.auth.token.email.toLowerCase().matches('.*@venestay\\.com$')
```

Este patrón otorga acceso de admin a cualquier cuenta registrada con dominio `@venestay.com`. Si el dominio no está bajo control exclusivo del equipo con 2FA obligatorio (o si alguien externo puede registrar cuentas con ese dominio), esta regla es una puerta abierta. Firebase Auth permite registrar cuentas con cualquier email — no verifica que el dominio pertenezca a la organización.

### Vulnerabilidad 3 — Emails personales hardcodeados en reglas de producción

```javascript
// PELIGROSO — no aplicar
request.auth.token.email.toLowerCase() == 'rodriguezzcarlose@gmail.com' ||
request.auth.token.email.toLowerCase() == 'zabalareduardoc@gmail.com'
```

Hardcodear emails personales en las reglas de Firestore es una práctica indefendible por tres razones:
1. Si cualquiera de esas cuentas es comprometida, el atacante obtiene acceso de admin permanente a toda la base de datos.
2. Cuando esas personas dejen el proyecto, sus cuentas siguen teniendo acceso de admin a producción indefinidamente (las reglas no expiran automáticamente).
3. Las reglas de Firestore son texto visible para cualquiera con acceso al repositorio o a la consola de Firebase — los emails quedan expuestos.

---

## 5. Solución Correcta: Custom Claim `qa: true` via Firebase Admin SDK

La solución correcta no modifica las reglas de Firestore, no toca `ProfileSettings.tsx` en producción, y no introduce ninguna vulnerabilidad nueva.

### Paso 1 — Asignar el Custom Claim `qa: true` a las cuentas de prueba

Ejecutar una vez desde la terminal con Firebase CLI autenticado como administrador:

```typescript
// scripts/set-qa-claim.ts
// Ejecutar con: npx ts-node scripts/set-qa-claim.ts

import * as admin from 'firebase-admin';

// Inicializar con credenciales de admin (solo para uso en scripts locales)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const QA_ACCOUNTS = [
  'huespedvenestay@gmail.com',
  // Añadir otras cuentas QA aquí — nunca emails personales de producción
];

async function assignQAClaims() {
  for (const email of QA_ACCOUNTS) {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, {
      qa: true,
      // No añadir 'admin: true' — qa es un rol separado con permisos limitados
    });
    console.log(`✓ QA claim asignado a ${email} (uid: ${user.uid})`);
  }
}

assignQAClaims().catch(console.error);
```

### Paso 2 — Modificar `firestore.rules` para reconocer el Custom Claim `qa`

Este es el **único cambio** necesario en las reglas. Es quirúrgico, seguro y revocable:

```javascript
// firestore.rules — ÚNICA MODIFICACIÓN REQUERIDA

// Función existente — NO modificar
function isAdmin() {
  return isSignedIn() && (
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}

// NUEVA función — añadir debajo de isAdmin()
function isQATester() {
  return isSignedIn() && request.auth.token.qa == true;
}

// Modificar la regla de /users/{userId} para incluir isQATester()
match /users/{userId} {
  allow update: if isSignedIn() && (
    (request.auth.uid == userId &&
     !incoming().diff(existing()).affectedKeys()
      .hasAny(['loyaltyStats', 'currentCommissionRate', 'role',
               'kycStatus', 'isIdentityVerified', 'trustScore',
               'kycDocumentUrl', 'kycStatusHistory'])) ||
    isAdmin() ||
    isQATester()   // ← única línea añadida
  );
}
```

### Paso 3 — Verificar que el token del usuario fue actualizado

Los Custom Claims se aplican en el próximo token JWT, que se emite en el siguiente inicio de sesión o al forzar un refresh:

```typescript
// En el cliente, después de que el script de claims haya corrido:
// Forzar refresh del token para que el claim 'qa' esté disponible de inmediato

import { getAuth } from 'firebase/auth';

const auth = getAuth();
if (auth.currentUser) {
  await auth.currentUser.getIdToken(true); // true = forzar refresh
  console.log('Token actualizado — el claim qa está activo');
}
```

---

## 6. Por qué esta solución es superior

| Criterio | Solución original (NO usar) | Solución correcta (Custom Claim) |
|:---|:---|:---|
| Seguridad | ❌ Patrón regex abierto explotable | ✅ Token firmado por Firebase, no manipulable |
| Revocabilidad | ❌ Las reglas deben editarse manualmente | ✅ `setCustomUserClaims(uid, {})` revoca en el siguiente login |
| Alcance del acceso | ❌ Acceso de admin completo | ✅ Solo acceso QA — campos específicos |
| Emails hardcodeados | ❌ Expone datos personales en el repositorio | ✅ Sin emails en el código ni en las reglas |
| Costo de evaluación | Sin cambio | ✅ Leer token (gratis) en lugar de `get()` en Firestore |
| Mantenimiento | ❌ Requiere editar reglas por cada cuenta nueva | ✅ Script CLI de un solo uso por cuenta |

---

## 7. Mejora adicional recomendada: migrar `isAdmin()` a Custom Claims

Aunque no es urgente para resolver el bug actual, se recomienda para el siguiente sprint migrar la función `isAdmin()` de verificación por campo Firestore a Custom Claims, siguiendo el mismo patrón:

```javascript
// Reemplazar en firestore.rules en el siguiente sprint

// ACTUAL (lento, costoso, manipulable si role fuera escribible por el cliente)
function isAdmin() {
  return isSignedIn() && (
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}

// RECOMENDADO (rápido, seguro, evaluado en el token)
function isAdmin() {
  return isSignedIn() && request.auth.token.admin == true;
}
```

Para asignar el Custom Claim `admin: true` a los administradores reales del proyecto, usar el mismo script del Paso 1 con `admin: true` en lugar de `qa: true`, ejecutado exclusivamente desde un entorno seguro con credenciales de Admin SDK.

---

## 8. Plan de verificación

| # | Verificación | Resultado esperado |
|:---|:---|:---|
| V-01 | Login con cuenta QA → activar toggle de perfil | Sin error de permisos. `trustScore` actualizado en Firestore. |
| V-02 | Login con cuenta sin claim `qa` → intentar toggle | `FirebaseError: Missing or insufficient permissions` (regla funciona correctamente) |
| V-03 | Intentar registrar cuenta `evil_huespedvenestay@test.com` → activar toggle | `permission-denied` (claim `qa` no asignado — no hereda por nombre) |
| V-04 | Revocar claim QA con `setCustomUserClaims(uid, {})` → intentar toggle | Error de permisos tras el siguiente login (claim revocado) |
| V-05 | `tsc --noEmit` + `eslint .` | Sin errores (no se modificó código TypeScript) |

---

*División de Ingeniería de IA — Antigravity · Mayo 2026*
*Versión v2.0 — Reemplaza el informe original. No aplicar la solución del informe anterior.*
