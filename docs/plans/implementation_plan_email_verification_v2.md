# Plan de Implementación: Validación de Correo Electrónico v2.0

> **Versión:** 2.0 — Adaptado al contexto actual del proyecto (S04-C · Beta Julio 2026)
> **Fecha:** 2026-06-01
> **Archivo anterior:** `implementation_plan.md` (reemplazado)

---

## 0. Análisis de Fase del Proyecto

### Estado Actual del Proyecto (S04-C)

| Indicador | Valor |
|-----------|-------|
| Sprint | S04-C — Ciclo de Cierre y QA |
| QA Gate | **FALLO** |
| Bloqueante P0 | Error `permission-denied` en Firestore Commit (Reserva Directa) |
| Lanzamiento | Beta Lechería — Julio 2026 (~4 semanas) |
| Socios Fundadores | 10 partners controlados (no es un launch público masivo) |

### Riesgos de Agregar Esto Ahora

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Regresión en flujo de registro existente | Alto | Aislar cambios en `useAuthForm` + AuthModal sin tocar otros módulos |
| Fricción excesiva para early adopters | Medio | Usar Soft Block (Opción B) para no bloquear exploración |
| Desvío de atención del bloqueante P0 | Alto | No requiere tocar `booking-service.ts`, `firestore.rules` ni `DirectRequestForm` |
| Scope creep en sprint de cierre | Alto | Implementación minimalista: menos de 3 archivos tocados |

### Decisión Arquitectónica para Beta Julio 2026

**Opción recomendada: B — Soft Block (Navegación permitida, Transacciones bloqueadas)**

Justificación:
- El proyecto ya tiene Trust Score, UCP 20/80 y KYC como capas de confianza. El email verification es un complemento, no un reemplazo.
- Los 10 socios fundadores de Lechería son controlados y onboardeados manualmente. No hay riesgo de contaminación masiva.
- Permite que usuarios de prueba exploren la plataforma (crítico para feedback pre-Beta) sin poder generar transacciones falsas.
- No requiere reestructurar el AuthModal (como la Opción C).
- Se alinea con el patrón existente de "Gatekeeper" (Trust Score 40% → mismo concepto aplicado a email).

**Las Opciones A y C se difieren para post-Beta (Agosto 2026+).**

---

## 1. Objetivo

Como **anfitrión y operador de VeneStay**, quiero asegurar que los huéspedes que realizan transacciones tengan un correo electrónico válido, para reducir perfiles fantasma y proteger el ecosistema P2P sin bloquear la exploración de la plataforma.

---

## 2. Alcance

### Incluye
- Envío de `sendEmailVerification` al registrarse (Firebase Auth)
- Banner/Toast en UI informando al usuario que debe verificar su correo
- Bloqueo de acción **reservar** si el email no está verificado (a nivel de UI + Firestore rules)
- Botón "Reenviar correo" en el modal de login cuando el email no está verificado
- Los usuarios de **Google OAuth** omiten el paso (Firebase los marca como verified automáticamente)

### No incluye
- Bloqueo de exploración / navegación general
- Refactor del AuthModal (se reusa el diseño actual)
- Magic Link (diferido a post-Beta)
- Hard Block pre-login (diferido a post-Beta)
- Cambios en `firestore.rules` (se evaluará en fase de estabilización post-Beta si es necesario)

---

## 3. Arquitectura de Cambios

```
┌─ FLUJO ACTUAL ─────────────────────────────────────┐
│ Registro → AuthModal → Firebase Auth → App (libre)  │
└─────────────────────────────────────────────────────┘

┌─ FLUJO NUEVO (Opción B) ───────────────────────────┐
│ Registro → AuthModal → Firebase Auth               │
│              ↓                                      │
│         sendEmailVerification()                     │
│              ↓                                      │
│         Entra a la App (navegación libre)           │
│              ↓                                      │
│         Banner global: "Verifica tu correo"         │
│              ↓                                      │
│         Intenta reservar → Bloqueado por UI         │
│              ↓                                      │
│         Toast + Redirect a "Verificar Ahora"        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Cambios por Archivo

### `src/features/auth/hooks/useAuthForm.ts`
- **[MODIFICAR]** En `handleSubmit` (rama de registro):
  - Después de `createUserWithEmailAndPassword`, inyectar `sendEmailVerification(user)`.
  - No hacer signOut. El usuario entra a la app.
- **[MODIFICAR]** En `handleSubmit` (rama de login):
  - Si el email no está verificado → mostrar estado `unverified_email` en el modal.
  - No bloquear el acceso, solo mostrar advertencia.
- **[AÑADIR]** Función `handleResendVerification()` que llama a `sendEmailVerification(auth.currentUser)`.

### `src/features/auth/components/AuthModal.tsx`
- **[AÑADIR]** Estado visual `unverified_email` después del login exitoso:
  - Mensaje: "Tu correo aún no está verificado. Revisa tu bandeja."
  - Botón: "Reenviar correo"
  - Botón: "Entrar de todas formas" (cierra el modal, usuario navega con banner)
- **[MODIFICAR]** No cerrar el modal automáticamente al hacer login si `!emailVerified`.

### `src/features/auth/hooks/AuthContext.tsx`
- **[AÑADIR]** Exponer `emailVerified: boolean` desde el estado de Firebase User.
- Ya existe `user?.emailVerified` en Firebase, solo falta exponerlo.

### `src/features/bookings/components/checkout/CheckoutPage.tsx`
- **[MODIFICAR]** En `handleSubmitPayment`, añadir guarda:
  ```ts
  if (!user?.emailVerified) {
    setError('Debes verificar tu correo electrónico antes de reservar. Revisa tu bandeja.');
    return;
  }
  ```
- Ya existe el patrón de guarda con `isBlockedByTrust` (Trust Score < 40%). Es idéntico.

### `src/services/auth-service.ts`
- **[AÑADIR]** Función `sendVerificationEmail(user: User): Promise<void>` que encapsula `sendEmailVerification`.
- **[AÑADIR]** Función `isEmailVerified(user: User | null): boolean`.

---

## 5. Criterios de Aceptación

- [ ] Al registrarse con email+password, se envía un correo de verificación automáticamente.
- [ ] El usuario puede explorar la app sin verificar (navegación, búsqueda, ver detalles).
- [ ] Al intentar reservar sin email verificado, se muestra error y no se crea la reserva.
- [ ] El modal de login muestra estado "no verificado" con opción de reenviar correo.
- [ ] Usuarios de Google OAuth no son afectados (ya vienen verificados).
- [ ] El botón "Reenviar correo" funciona y muestra confirmación al usuario.
- [ ] No hay cambios en `firestore.rules` (se difiere a post-Beta).

---

## 6. Validación Técnica

- [ ] `npm run lint` pasa sin errores (0 errors, warnings solo de código preexistente).
- [ ] Prueba manual: registro con `test@example.com` → correo enviado → no puede reservar.
- [ ] Prueba manual: registro con Google → no hay bloqueo.
- [ ] Prueba manual: login con email no verificado → banner visible → puede reenviar.
- [ ] No hay regresión en el flujo de checkout existente (Trust Score, UCP, upload).

---

## 7. Riesgos y Deuda Técnica

| Riesgo | Severidad | Plan de Contingencia |
|--------|-----------|----------------------|
| El correo de verificación llega a spam | Baja | Agregar texto en el modal: "Revisa tu bandeja de spam si no ves el correo" |
| Usuario cierra el modal sin verificar y después no sabe cómo | Media | Banner persistente en Home + icono en navbar |
| Firebase `sendEmailVerification` tiene rate limiting | Baja | El botón "Reenviar" tiene cooldown de 60s (Firebase lo maneja internamente) |

---

## 8. Checklist de Implementación (Orden de Ejecución)

1. `src/services/auth-service.ts` — Añadir `sendVerificationEmail()` e `isEmailVerified()`.
2. `src/features/auth/hooks/AuthContext.tsx` — Exponer `emailVerified`.
3. `src/features/auth/hooks/useAuthForm.ts` — Inyectar en registro + login.
4. `src/features/auth/components/AuthModal.tsx` — UI de estado no verificado.
5. `src/features/bookings/components/checkout/CheckoutPage.tsx` — Guarda en submit.
6. `npm run lint` — Validar.
7. Prueba manual de los 3 flujos (registro, login Google, checkout bloqueado).

---

## 9. Postergado para Post-Beta (Agosto 2026+)

- **Opción A (Hard Block):** Cuando la base de usuarios crezca y se necesite control más estricto.
- **Opción C (Magic Link):** Cuando se rediseñe el AuthModal (actualmente no está en roadmap).
- **Refuerzo en `firestore.rules`:** Si se detectan transacciones fantasma en producción.
- **Email verification check en el dashboard del anfitrión:** Para que sepan que sus huéspedes tienen email válido.
