# SPEC ATÓMICA — 2026-07-04

**ID:** SPEC-AUTH-LOGIN-FRICTION-001  
**Sprint:** S05 — Admin Tools & Maintenance  
**Prioridad:** P1 (Optimización del Embudo de Conversión y UX)  
**Autor:** Antigravity AI (Planner Node)  
**Estado:** PENDIENTE DE APROBACIÓN  

---

### Contexto

Al iniciar sesión con una cuenta que tiene el correo electrónico no verificado, el modal de autenticación (`AuthModal`) interrumpe el flujo mostrando una advertencia de verificación en lugar de permitir el acceso, lo que genera fricción innecesaria en el embudo de conversión y entra en conflicto con nuestra arquitectura de centralizar la verificación de identidad en "Mi Pasaporte" (`SecuritySection`) y en el *guard* de reserva (`canBook`).

### Alcance

- **Capa FSD:** `features` (módulo `auth`)
- **Archivos afectados:**
  - `src/features/auth/hooks/useAuthForm.ts`
  - `src/features/auth/components/AuthModal.tsx`
- **Función / Componente:** Hook `useAuthForm` (función `handleSubmit`), componente `AuthModal`
- **Tipo de cambio:** MODIFICAR / ELIMINAR

### Qué debe hacer

1. **Optimización en `useAuthForm.ts`:**
   - En la función `handleSubmit` (cuando `mode === 'login'`), al autenticar exitosamente con `signInWithEmailAndPassword`, eliminar la comprobación condicional `if (!userCredential.user.emailVerified) { setUnverifiedEmailWarning(true); }`.
   - En su lugar, ejecutar `onClose()` de manera directa e incondicional inmediatamente después del inicio de sesión exitoso (coincidiendo con el comportamiento de `register` y Google login).
   - Eliminar el estado `unverifiedEmailWarning` y la función/lógica asociada (`handleResendVerification`) si ya no son consumidos en ninguna otra parte de este modal.

2. **Limpieza en `AuthModal.tsx`:**
   - Eliminar el bloque de renderizado condicional `{unverifiedEmailWarning ? (...) : (...)}` y mostrar siempre el formulario correspondiente (`login`, `register` o `forgot-password`).
   - Eliminar importaciones y variables que queden sin uso para mantener un código limpio y sin advertencias de linter.

3. **Flujo y UX resultante:**
   - Garantizar que cualquier usuario con credenciales válidas acceda a la plataforma al instante para explorar propiedades y gestionar sus favoritos sin barreras visuales en el modal.

### Qué NO debe hacer (límites)

- **NO modificar** la lógica de verificación de correo o envío de OTP en "Mi Pasaporte" (`SecuritySection.tsx`), donde debe continuar realizándose la verificación del usuario.
- **NO alterar** el comportamiento de las Cloud Functions ni las reglas de seguridad de Firestore (el *guard* de backend en `createBooking` que exige `canBook === true` se mantiene intacto como única barrera real y segura para concretar reservas).
- **NO modificar** el flujo de registro de nuevos usuarios (`register`), donde el envío del correo de verificación inicial en segundo plano se conserva para ayudar a la verificación temprana.

### Tipos requeridos

```typescript
// No se requieren nuevos tipos en src/types/.
// Se ajusta la interfaz de retorno del hook useAuthForm removiendo unverifiedEmailWarning y handleResendVerification.
```

### Schema Zod requerido

```typescript
// Se reutiliza loginSchema existente en src/features/auth/schemas/auth.schema.ts sin modificaciones.
```

### Criterios de aceptación (QA Gate los verificará)

- [ ] CA-1: Un usuario con correo electrónico **no verificado** (`emailVerified: false`) inicia sesión con sus credenciales desde `AuthModal` e ingresa inmediatamente a la aplicación, cerrándose el modal sin mostrar la pantalla de advertencia.
- [ ] CA-2: Un usuario con correo electrónico **verificado** inicia sesión e ingresa inmediatamente a la aplicación sin regresiones en su flujo.
- [ ] CA-3: Si un usuario con correo no verificado intenta realizar una reserva, el sistema lo sigue bloqueando correctamente en el Checkout (`canBook === false` validado por el backend en `createBooking`) y le muestra las indicaciones para verificarse en Mi Pasaporte.
- [ ] CA-4: TypeScript compila sin errores (`npx tsc --noEmit`).
- [ ] CA-5: ESLint compila sin errores ni advertencias por variables o funciones sin usar (`npm run lint`).
- [ ] CA-6: Accesibilidad: El cierre del modal tras el inicio de sesión devuelve el foco correctamente al elemento disparador o al contenedor principal de la vista según WCAG 2.2 AA.
- [ ] CA-7: Campos de seguridad (`trustSignals`, `canBook`, `kycPhase`) no son escribibles desde el cliente ni se ven alterados por este cambio visual en la UI.

### Dependencias

- **Requiere:** Ninguna (módulo independiente de UX/Auth).
- **Bloquea:** Ninguna.
