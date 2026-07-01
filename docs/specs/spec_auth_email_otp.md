# Especificación Técnica: Validación de Correo Electrónico mediante Código OTP numérico (SPEC-AUTH-EMAIL-OTP-001)

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Prioridad:** P1 (Mejora de UX y Retención en Registro/Pasaporte)
- **Autor:** Antigravity AI (Planner Node)
- **Fecha:** 2026-07-01

---

## 1. Resumen Ejecutivo & Objetivo

Como huésped o anfitrión en VeneStay, quiero recibir un código numérico de verificación de 6 dígitos por correo electrónico en lugar de un enlace externo para poder verificar mi dirección de correo desde la misma pantalla del Pasaporte o Checkout sin perder mi sesión en el navegador ni ser redirigido a navegadores webview integrados de clientes de correo (iOS Mail, Gmail, Instagram).

## 2. Alcance

### Incluye
- **Backend (Cloud Functions):**
  - Creación de Cloud Function `sendEmailOTP`: genera código numérico de 6 dígitos con `crypto.randomInt`, lo guarda hasheado en Firestore (`otpCodes/{uid}_email`) y lo envía por correo usando la plantilla corporativa y el transportador SMTP existente (`runWith({ secrets: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] })`).
  - Creación de Cloud Function `confirmEmailOTP`: valida el código con un máximo de 3 intentos y 10 minutos de vigencia. Al acertar, actualiza en Firebase Auth (`admin.auth().updateUser(uid, { emailVerified: true })`) y en Firestore (`users/{uid}.trustSignals.emailVerified = true`).
- **Frontend (UI / React):**
  - Creación de componente UI `EmailVerificationCard` siguiendo la arquitectura visual de `WhatsAppVerificationCard` (estados `IDLE`, `OTP_SENT`, input de 6 dígitos y badge de `✓ VERIFICADO`).
  - Integración en `SecuritySection.tsx` reemplazando el botón de "Enviar enlace".

### No incluye
- Modificación al flujo de recuperación de contraseña (se mantiene por enlace de reset de Firebase Auth por estándares de seguridad).

---

## 3. Especificación UI / Maquetado

### Estados visuales esperados en `EmailVerificationCard`
1. **Default (No verificado):** Muestra el correo actual con badge amarillo `PENDIENTE` y botón `ENVIAR CÓDIGO`.
2. **Loading:** Botón deshabilitado con spinner de carga (`Enviando código...`).
3. **OTP Sent:** Input numérico de 6 caracteres centrado con botón principal `VERIFICAR CORREO` y enlace secundario de `Reenviar código` (respetando 1 minuto de cooldown visual y en backend).
4. **Verified:** Muestra el correo con badge verde `✓ VERIFICADO` sin botones de acción adicionales.

---

## 4. Lógica y Reglas de Negocio

### Entradas
- `email`: extraído automáticamente del token JWT y el documento del usuario en el backend para evitar suplantaciones.

### Reglas de Negocio en Backend (`sendEmailOTP` & `confirmEmailOTP`)
- **Anti-spam / Cooldown:** No permitir generar un nuevo código si existe uno previo cuya fecha de creación o vencimiento indique que pasaron menos de 60 segundos (`cooldownThreshold`).
- **Expiración:** El código caduca exactamente a los 10 minutos desde su creación.
- **Límite de Intentos:** Al tercer intento fallido de validación (`attempts >= 3`), el documento en Firestore se elimina automáticamente obligando al usuario a solicitar un nuevo código.
- **Sincronización dual:** Al confirmar con éxito, se actualiza tanto el auth user de Firebase Auth como el documento en Firestore (`trustSignals.emailVerified = true` y `isEmailVerified = true`), disparando `recalculateKycPhase(uid)`.

---

## 5. Criterios de Aceptación (Checklist DoD)

- [ ] El usuario hace clic en "Enviar Código" y recibe un email con el asunto *"Tu código de verificación para VeneStay es: XXXXXX"*.
- [ ] El usuario ingresa un código erróneo e incrementa el contador de intentos fallidos mostrando mensaje de error claro.
- [ ] El usuario ingresa el código correcto y su perfil pasa de inmediato al estado visual `Verificado`.
- [ ] Si el envío de correo por SMTP falla, se limpia automáticamente el documento en Firestore para no generar bloqueo de cooldown en el reintento.
- [ ] `npm run lint` y `npm run build` compilan sin advertencias ni errores en frontend y backend.
