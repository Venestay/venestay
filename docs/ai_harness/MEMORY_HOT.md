# MEMORY_HOT — VeneStay Agent

_Sprint: S05 — Admin Tools & Maintenance · Actualizado: 2026-07-08_

---

## 🔴 ACCIÓN INMEDIATA — PRIMERA TAREA AL INICIAR SESIÓN

> **El agente DEBE consultar y continuar con esta tarea al iniciar la próxima sesión.**

### SPEC-CHECKOUT-PAY-001 v2.0 — Flujo de Cobro 20%/80% (EN PROGRESO)

La spec está aprobada en `docs/plans/spec_checkout_payment_venestay_future.md` (v2.0).
Frontend implementado y compilando sin errores. Queda **1 tarea técnica** y **1 operación** pendientes:

#### Pendiente 1 — Cloud Function PDF (Nodo 3 Técnico Backend)
- **Archivo:** `functions/src/templates/booking-pdf.ts`
- **Acción:** Insertar sección **"INSTRUCCIONES PARA EL PAGO DEL SALDO (80%)"** después del bloque "RESUMEN DE SALDO" (~línea 173).
- **Lógica:** Leer `listing.paymentMethods` → fallback a `listing.bankDetails` → fallback a mensaje de chat.
- **Código de referencia:** Bloque TypeScript completo en la spec `docs/plans/spec_checkout_payment_venestay_future.md` sección "Capa 5".

#### Pendiente 2 — Seed de Firestore (Operación)
- **Acción:** Ejecutar `node scripts/seed-venestay-payments.js` para crear `config/venestay_payments` con datos de prueba.
- **Requisito:** Tener Firebase CLI autenticado o `GOOGLE_APPLICATION_CREDENTIALS` configurado.
- **Nota:** Sin este documento en Firestore, el Checkout mostrará "Cargando métodos de pago..." indefinidamente.

#### Pendiente 3 — Verificación manual en browser (QA CA-1 a CA-6)
- Levantar `npm run dev` y verificar el checklist de la spec en `localhost:3000`.

---

## Estado ahora

```text
SPRINT    : S05 — Admin Tools & Maintenance
QA_GATE   : PASS | tsc OK (0 errores) | lint OK | Vitest OK (3/3) | Playwright OK (2/2) | 2026-07-14 (SPEC-CHECKOUT-SOFT-CONSULTA-001)
BLOQUEANTE: ninguno
RAMA_LOCAL: main
TURNO_REANCLA: 2
```

---

## Arquitectura de Ambientes (Aprobada por el usuario)

```text
DEV (local, npm run dev) → QA (cerz30/qa, branch en fork) → PRD (origin/main → Vercel)
```

- **`origin`** = org `Venestay/venestay` (repositorio principal, producción)
- **`cerz30`** = fork personal `cerz30/VeneStay` (entorno independiente de QA y previews)
- **Rama `qa`**: punto de integración de todas las features antes de llegar a `main`. Se pushea al fork (`cerz30`).
- **`main`**: producción limpia — Vercel despliega desde `origin/main`

---

## Incidentes documentados recientes

| ID                   | Incidente                   | Causa raíz                              | Estado            |
| -------------------- | --------------------------- | --------------------------------------- | ----------------- |
| IAM-GCP-001          | Deploy functions falla      | Compute Default Service Account borrado | ✅ Resuelto       |
| ENCODING-MYTRIPS-001 | Tildes corruptas en browser | `Out-File -Encoding UTF8` en PowerShell | ✅ Resuelto en qa |
| RCA-MYTRIPS-001      | Ruta `/mis-viajes` perdida  | `--theirs` en merge App.tsx             | ✅ Resuelto       |

---

## Anti-patterns críticos detectados (NUNCA REPETIR)

1. ❌ Asumir que Cloud Functions funciona de inmediato sin revisar si usa Emulador o Prod. Si falla por CORS en funciones nuevas, revisar primero si la función realmente se desplegó o si la app usa localhost.
2. ❌ `git checkout --theirs <archivo-crítico>` sin revisar manualmente rutas/imports perdidos.
3. ❌ Push a `origin/qa` sin correr `npm run lint` + verificación visual en browser.

---

## Módulos Recientes — Estado consolidado

| Módulo                                          | Archivo Objetivo                                     | Estado                            |
| :---------------------------------------------- | :--------------------------------------------------- | :-------------------------------- |
| **Dominio Custom Autenticación & SSL Proxy (SPEC-AUTH-DOMAIN-001) (P0)** | vercel.json, VITE_FIREBASE_AUTH_DOMAIN | **COMPLETADO (PASS EN PROD)** |
| **Páginas Legales Soft KYC & Enlaces UI (SPEC-LEGAL-PAGES-001) (P1)** | PrivacyPolicyPage.tsx, TermsPage.tsx, App.tsx, AuthModal.tsx, Home.tsx | **COMPLETADO (PASS)** |
| **Flujo de Cobro 20/80 — VeneStay Payments (SPEC-CHECKOUT-PAY-001) (P1)** | CheckoutPage.tsx, venestay-config.service.ts, useVenestayPayments.ts, firestore.rules, booking-pdf.ts | **EN PROGRESO (frontend OK \| PDF pendiente)** |
| **Placeholder Avatar en Perfil & Pasaporte (SPEC-PASSPORT-AVATAR-PLACEHOLDER-001) (P1)** | auth-service.ts, UserProfileSetup.tsx, PassportHeader.tsx, Navbar.tsx, ListingList.tsx | **COMPLETADO (PASS)** |
| **Email Verification via OTP (P1)**             | docs/specs/spec_auth_email_otp.md, SecuritySection.tsx | **SPEC CREADA / PEND. IMPL**    |
| **Twilio WhatsApp OTP Integration (P1)**        | functions/src/auth.functions.ts, package.json, local-server | **COMPLETADO (WABA TEMPLATE ACTIVADA)**   |
| **Chat Badge Mis Viajes (P1)**                  | MyTrips.tsx                                          | **COMPLETADO**                    |
| **Flexibilización Pago (+8h) (P1)**             | MyTrips.tsx                                          | **SPEC CREADA / PEND. IMPL**      |
| **KYC Loop & Auth Modal Redirect (P1)**         | ProfileSettings.tsx, ListingDetail.tsx               | **COMPLETADO**                    |
| **Herramienta Limpieza Reservas (P1)**          | purgeTestBookings.ts, PurgeTestBookingsModal.tsx     | **CÓDIGO LISTO / DEPLOY FALLIDO** |
| **Fix Host Email Notification (P0)**            | functions/src/booking.functions.ts, templates/       | **COMPLETADO**                    |
| **Email Notifications & Secure Stay Flow (P0)** | functions/src/\*, useCheckout.ts, booking-service.ts | **COMPLETADO**                    |
| **Optimización Enrutamiento & Red Listings (SPEC-PERF-LISTING-OPTIMIZATION-001) (P0)** | ListingCard.tsx, perf-listing-load.spec.ts | **COMPLETADO (PASS)** |
| **Optimización Login KYC (SPEC-AUTH-LOGIN-FRICTION-001) (P1)** | useAuthForm.ts, AuthModal.tsx | **COMPLETADO (PASS)** |
| **SPEC-AUTH-MODAL-OPTIMIZATION (P0)**           | AuthModal.tsx, useAuthForm.ts, auth.schema.ts        | **COMPLETADO**                    |

---

## Notas de Integración

- **Java JDK:** `C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin`
- **Firebase proyecto:** `gen-lang-client-0727178605`
- **Versión de Node Functions:** Ajustada a `22` en package.json (ya no es `>=24`).
- **Emuladores:** Firestore:8080, Storage:9199, Functions: 5001 (Actualmente NO configurados explícitamente en el cliente app local).
- **`npm run dev`:** Corre en `localhost:3000`
- **Vercel:** Despliega automáticamente desde `origin/main` — NO desde `qa`

---

## Checkpoints de Cierre (registro por tarea)

> El agente DEBE añadir una entrada aquí al cerrar cada tarea con código producido.
> Usar la plantilla en `./docs/ai_harness/MEMORY_CHECKPOINT_TEMPLATE.md`.

| Fecha | Módulo | Estado | QA Gate | Próxima acción |
| 2026-07-23 | Verificación Telefónica (Cambio a SMS Principal) | COMPLETADO | PASS | Módulo cerrado y verificado (`tsc` 0 errores, linter 0 errores). Componente renombrado a PhoneVerificationCard y SMS configurado como principal. |
| 2026-07-21 | Ampliación Timeout Pago (SPEC-BOOKING-TIMEOUT-24H) | COMPLETADO | PASS | Módulo cerrado y verificado (`tsc` 0 errores, `lint` 0 errores). Transición de auto-cancelación ampliada a 24h. |
| 2026-07-21 | Subida de Pagos Mis Viajes (MyTrips) | COMPLETADO | PASS | Prueba local de envío de comprobantes de pago por parte del usuario y verificación de subcolección `payments`. |
| 2026-07-17 | Integración de QA a Main | COMPLETADO | PASS | Push exitoso desde rama `qa` a `main` en repositorio fork (`cerz30/main`) y producción (`origin/main`). Incluye unificación de UX a Verificación Telefónica con fallback automático a SMS (`SPEC-AUTH-UNIFIED-PHONE-VERIFICATION-002`) y consulta pre-reserva sin fricción (`SPEC-CHECKOUT-SOFT-CONSULTA-001`). Vercel desplegando en producción. |
| 2026-07-14 | Integración a Main & Dominio Custom Autenticación (`venestay.com`) | COMPLETADO | PASS | Push exitoso a `main` en repositorios `cerz30/VeneStay` y `Venestay/venestay`. Regla de reescritura en `vercel.json` (`/__/auth/:path*`) y `VITE_FIREBASE_AUTH_DOMAIN=venestay.com` verificados en producción con candado SSL sin alertas de seguridad. |
| 2026-07-14 | Consulta y Pago sin Fricción + Modal P2P (SPEC-CHECKOUT-SOFT-CONSULTA-001) | COMPLETADO | PASS (`tsc` 0 errores, `Vitest` 3/3, `Playwright` 2/2, `run-validation.cjs` 12 PASS) | Módulo validado autónomamente en terminal y E2E sin regresiones. Listo para merge a rama `qa` o continuar con siguientes tareas en S05. |
| 2026-07-14 | Páginas Legales Soft KYC & Enlaces UI (SPEC-LEGAL-PAGES-001) | COMPLETADO | PASS (`tsc --noEmit` 0 errores, linter 0 warnings en nuevos archivos) | Módulo cerrado y verificado en producción `main`. Listo para continuar con siguientes prioridades de S05. |
| 2026-07-13 | Twilio WhatsApp OTP Integration (SPEC-AUTH-WHATSAPP-001) | COMPLETADO | PASS | Despliegue en vivo en Firebase Cloud Functions (`us-central1`) de `sendWhatsAppOTP` y `confirmWhatsAppOTP` usando la plantilla oficial WABA (`HXed4fa6e39943eb13205dfca6a0c05da3`). Blindaje 100% de `functions/.env` verificado en `.gitignore`. |
| 2026-07-12 | Placeholder Avatar en Perfil & Pasaporte (SPEC-PASSPORT-AVATAR-PLACEHOLDER-001) | COMPLETADO | PASS | Se eliminó el fallback aleatorio a pravatar.cc al crear perfiles e interfaces y se implementó el placeholder premium oficial en Perfil, Pasaporte y Navbar. Verificar visualmente en browser o continuar con tareas de S05. |
| 2026-07-08 | Flujo de Cobro 20/80 — VeneStay Payments (SPEC-CHECKOUT-PAY-001 v2.0) | EN PROGRESO | PARCIAL (tsc OK, lint en curso) | 1) Ejecutar `node scripts/seed-venestay-payments.js` para crear `config/venestay_payments` en Firestore. 2) Modificar `functions/src/templates/booking-pdf.ts` para incluir sección "INSTRUCCIONES PARA EL PAGO DEL SALDO (80%)". 3) Verificación manual en `localhost:3000`. Código de referencia en `docs/plans/spec_checkout_payment_venestay_future.md`. |
| 2026-07-04 | Integración de QA a Main | COMPLETADO | PASS | Push exitoso desde rama qa a main en repositorio fork (`cerz30/main`) con optimizaciones de rendimiento y UX en login. |
| 2026-07-04 | Optimización Enrutamiento & Red Listings (SPEC-PERF-LISTING-OPTIMIZATION-001) | COMPLETADO | PASS | Tiempo de enrutamiento reducido en un 95.8% (de 1,787 ms a 74 ms) al navegar directo a /listing/:id. Se erradicó el 100% de las peticiones HTTP concurrentes a DolarApi desde las tarjetas. |
| 2026-07-04 | Optimización Login KYC (SPEC-AUTH-LOGIN-FRICTION-001) | COMPLETADO | PASS | Se eliminó el bloqueo de correo no verificado en el modal al iniciar sesión, permitiendo acceso directo a la app. La verificación se mantiene centralizada en Mi Pasaporte y Checkout Guard. |
| 2026-07-02 | Integración de QA a Main | COMPLETADO | PASS | Push exitoso desde fork personal (`cerz30/qa`) a producción (`origin/main` y `cerz30/main`). Vercel desplegando en producción. |
| 2026-07-01 | Email Verification via OTP (SPEC-AUTH-EMAIL-OTP-001) | PLANIFICADO | N/A | Spec guardada en `docs/specs/spec_auth_email_otp.md`. Pendiente activar Nodo 3 para implementar Cloud Functions (`sendEmailOTP` / `confirmEmailOTP`) y componente UI (`EmailVerificationCard`). |
| 2026-07-01 | Twilio WhatsApp OTP Setup (SPEC-AUTH-WHATSAPP-001) | COMPLETADO | PASS | 1) Conectar teléfono de prueba ('join <keyword>') al Sandbox Twilio (+14155238886). 2) Probar validación de número y recepción del código OTP en Pasaporte / KYC. |
| 2026-06-30 | Twilio WhatsApp OTP Setup (SPEC-AUTH-WHATSAPP-001) | PLANIFICADO | N/A | El usuario creó cuenta Twilio Sandbox (+14155238886). Pendiente: 1) Conectar teléfono de prueba ('join <keyword>'). 2) Configurar 3 secretos en Firebase CLI (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`). 3) Activar Nodo 3 para implementar librería `twilio` en `auth.functions.ts` y desplegar. |
| 2026-06-27 | Fix Validaciones QA (G3 & G12) | COMPLETADO | PASS | Continuar con Estrategia de Auditoría Playwright. |
| 2026-06-27 | Estrategia de Auditoría Global Playwright | PLANIFICADO | N/A | Elegir Opción A (Iterativa) u Opción B (Masiva) para ejecutar las suites. |
| 2026-06-27 | Chat Badge Mis Viajes (SPEC-MYTRIPS-CHAT-BADGE-001) | COMPLETADO | PASS | Verificar visualmente en el browser el badge rojo en la tarjeta de reserva del huésped. |
| 2026-06-25 | Fecha Nacimiento & KYC Checkout Unificación (SPEC-PASSPORT-004 / SPEC-CHECKOUT-CANBOOK-UNIFY) | COMPLETADO | PASS | Pruebas visuales en vivo exitosas en Checkout. Flujo desbloqueado. |
| 2026-06-23 | Playwright E2E: Passport Auth | COMPLETADO | PASS | Módulo de pruebas E2E configurado y pasando exitosamente. |
| 2026-06-23 | Fix SMTP Secrets (SPEC-AUTH-MAILER-001) | COMPLETADO | PASS | Probar manualmente el reenvío de correo (Despliegue COMPLETADO). |
| 2026-06-23 | KYC (Auth) - Plantillas de Correo Premium | COMPLETADO | PASS | Configurar secrets de SMTP en Google Secret Manager y desplegar funciones. Realizar pruebas manuales de registro y reset de password. |
| 2026-06-23 | Fix Bug: AuthModal State Reset | COMPLETADO | OK | Se corrigió el bug donde AuthModal retenía el estado de unverifiedEmailWarning al reabrirse. |
| 2026-06-22 | Push a Github QA | COMPLETADO | PASS | Push exitoso a cerz30 qa con la Fase 1 de KYC y validaciones de Auth. |
| 2026-06-22 | Ejecución de VeneStay Validation Skill | COMPLETADO | PASS | Continuar con revisión de módulo solicitado u optimización de código. |
| 2026-06-21 | Ajustes PDF: Badge y Normas (SPEC-PDF-RULES-LAYOUT) | COMPLETADO | OK | Implementado en booking-pdf.ts y probado sin errores. |
| 2026-06-21 | Restricciones en Checkout (Pago Pendiente) y Tiempo de Pago (SPEC-CHECKOUT-PAYMENT-RESTRICTION) | COMPLETADO | OK | Validaciones de compilación y lint exitosas. |
| 2026-06-21 | Restringir Checkout en Modo Solicitud (SPEC-CHECKOUT-REQUEST-BLOCK) | COMPLETADO | OK | Validaciones de compilación completadas exitosamente. |
| 2026-06-21 | Omitir Modal KYC en Pago de Reserva de Prueba (SPEC-DASHBOARD-002) | COMPLETADO | OK | Validaciones de compilación y lint completadas. Pruebas manuales locales. |
| 2026-06-20 | Spec: Ocultar Datos Anfitrión en Checkout (Futuro) | PLANIFICADO | PENDIENTE | Documentado en `docs/plans/spec_checkout_payment_venestay_future.md` |
| 2026-06-20 | Visualización de Huéspedes en Miniaturas (SPEC-LISTINGS-001) | COMPLETADO | OK | Pruebas manuales locales por parte del usuario. |
| 2026-06-20 | Corrección de Tipos en kyc.functions.ts | COMPLETADO | OK | Ninguna. Errores de linting de TypeScript resueltos. |
| 2026-06-19 | Implementación de Mensajes Rápidos del Anfitrión (Quick Replies) | COMPLETADO | OK | Pruebas manuales en el entorno local para el panel de administración. |
| 2026-06-19 | Implementación de TravelerDNA & Umbrales de Checkout | COMPLETADO | OK | Validaciones exitosas, listo para pruebas locales en el navegador. |
| 2026-06-19 | Despliegue de Cloud Functions | COMPLETADO | OK | Ejecutar npm audit fix para resolver G9 y re-validar rama. |
| 2026-06-18 | Planificación Soft KYC (CNE) Seguro | COMPLETADO | PENDIENTE | Ejecutar Specs Atómicas (SPEC-AUTH-KYC-001 a 004) en la próxima sesión. |
| 2026-06-18 | Fix URLs Plantillas Email (SPEC-EMAIL-URL-FIX-001) | COMPLETADO | OK | Desplegar functions: `firebase deploy --only functions`. |
| 2026-06-18 | Pausa de Sesión (Pruebas pendientes) | COMPLETADO | OK | Se continuará con las pruebas manuales de los correos y PDF adjunto en otra conversación. |
| 2026-06-18 | PDF Resumen Estadía Email Confirmado (SPEC-EMAIL-PDF-ATTACH-001) | COMPLETADO | OK | (Manual) Verificar en el flujo de confirmación que el huésped recibe un email con un PDF adjunto del resumen de la estadía. |
| 2026-06-18 | Fix Triggers Email Pago (SPEC-EMAIL-TRIGGERS-FIX-001) | COMPLETADO | OK | Prueba manual en localhost:3000: aprobar reserva, subir pago, verificar pago. Verificar que llegan los 3 correos faltantes. |
| 2026-06-18 | Documentación de Plantillas de Email y Flujo Huésped | COMPLETADO | OK | Proceder con la validación manual del correo del huésped en el entorno local. |
| 2026-06-18 | Migración Triggers Firestore v1→v2 (SPEC-NOTIFICATIONS-001/002) | COMPLETADO | OK | Realizar prueba en vivo: hacer reserva en localhost:3000 y verificar que llegan los correos. |
| 2026-06-17 | Optimización de Imágenes (.tempmediaStorage) | COMPLETADO | OK | Integrar las imágenes optimizadas en el listado de la propiedad. |
| 2026-06-16 | Pausa de Sesión (Despliegue a QA local) | COMPLETADO | OK | Se continuará con el flujo de pruebas de notificaciones en otra conversación. |
| 2026-06-16 | Conexión DEV a Nube (Desactivar Emulador Local) | COMPLETADO | OK | Reiniciar npm run dev y desplegar functions. |
| 2026-06-16 | Resolución de crash interno del emulador de Firestore | COMPLETADO | OK | Proceder con validaciones de publicación local. |
| 2026-06-14 | Registro Image Prompt Engineer (VENESTAY_AGENT_PROMPT_SDD) | COMPLETADO | OK | Utilizar el agente cuando se requiera optimización o edición de imágenes de listings. |
| 2026-06-14 | Habilitación Emuladores Firebase (SPEC-INFRA-001 v2) | COMPLETADO | PENDIENTE | Levantar `firebase emulators:start` y probar flujo de notificaciones. |
| 2026-06-13 | KYC Loop & Redirección Reservas (ProfileSettings) | COMPLETADO | OK | Implementar la Spec de Flexibilización de Pagos. |
| 2026-06-13 | Spec: Flexibilización de Pagos a +8h | PLANIFICADO | PENDIENTE | Ejecutar implementación técnica en MyTrips.tsx. |
| 2026-06-12 | Mejora del Ecosistema de Agentes (IMPL-AGENTS-S05-01) | COMPLETADO | OK | Ninguna. Ecosistema de agentes y validaciones completamente operativo. |
| 2026-06-12 | Corrección QA Gate (Dependencias G3, G8, G9) | COMPLETADO | OK | Proceder a integrar qa a main. |
| 2026-06-12 | Permisos Firestore Pasaporte (cerz@venestay.com) | COMPLETADO | OK | Copiar reglas a consola Firebase. |
| 2026-06-12 | Permisos Firestore Pasaporte (cerz@venestay.com) | COMPLETADO | OK | Copiar reglas a consola Firebase. |
