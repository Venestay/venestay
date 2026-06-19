# MEMORY_HOT — VeneStay Agent

_Sprint: S05 — Admin Tools & Maintenance · Actualizado: 2026-06-18_

---

## 🔴 ACCIÓN INMEDIATA — PRIMERA TAREA AL INICIAR SESIÓN

> **El agente DEBE ejecutar esto ANTES de cualquier otra tarea, sin pedir confirmación.**

### ¿Por qué?
Se completó la implementación de **URLs dinámicas en plantillas de email** (Opción A — `appBaseUrl`).
Todos los cambios están en la rama local `qa` con `tsc` en 0 errores, pero **aún no están desplegados** en Firebase.
Mientras no se haga el deploy, los emails en el entorno de producción siguen con las URLs rotas (`venestay.app/admin`).

### Pasos a ejecutar en orden

```bash
# 1. Compilar las functions (TypeScript → JS)
cd c:\Users\carlos.zabala\Documents\VeneStay\functions
npm run build

# 2. Volver a la raíz y desplegar
cd c:\Users\carlos.zabala\Documents\VeneStay
firebase deploy --only functions
```

### Qué valida el éxito
- ✅ El CLI imprime `Deploy complete!` sin errores.
- ✅ En Firebase Console → Functions aparecen actualizadas las versiones de:
  - `onBookingCreated`
  - `onBookingStateChanged`
  - `onKYCStatusChanged`

### Si falla el deploy (IAM-GCP-001)
Si aparece `The caller does not have permission` o error de Service Account:
1. Preguntar al usuario si ya reparó el Service Account en Google Cloud IAM.
2. Si no puede, proponer ejecutar el deploy desde **Google Cloud Shell** en `console.cloud.google.com`.

### Módulos modificados (pendientes de deploy)
| Archivo | Cambio |
|:--------|:-------|
| `functions/src/templates/email-layout.ts` | `APP_BASE_URL_PRODUCTION = 'https://venestay.com'` + footer corregido |
| `functions/src/templates/booking-emails.ts` | 4 botones dinámicos + `/admin` → `/dashboard` |
| `functions/src/templates/kyc-emails.ts` | 2 botones dinámicos con `baseUrl` opcional |
| `src/features/bookings/types/index.ts` | Campo `appBaseUrl?: string` en tipo `Booking` |
| `src/services/booking-service.ts` | `appBaseUrl: window.location.origin` en creación de reservas |
| `src/features/bookings/components/checkout/CheckoutPage.tsx` | `appBaseUrl: window.location.origin` en `ensureBooking` |
| `index.html` | `og:url` corregido a `venestay.com` |

---

## Estado ahora

```text
SPRINT    : S05 — Admin Tools & Maintenance
QA_GATE   : OK | 2026-06-12
BLOQUEANTE: ninguno
RAMA_LOCAL: qa
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

| ID                     | Incidente                                  | Causa raíz                              | Estado                   |
| ---------------------- | ------------------------------------------ | --------------------------------------- | ------------------------ |
| IAM-GCP-001            | Deploy functions falla                     | Compute Default Service Account borrado | ✅ Resuelto              |
| ENCODING-MYTRIPS-001   | Tildes corruptas en browser                | `Out-File -Encoding UTF8` en PowerShell | ✅ Resuelto en qa        |
| RCA-MYTRIPS-001        | Ruta `/mis-viajes` perdida                 | `--theirs` en merge App.tsx             | ✅ Resuelto              |

---

## Anti-patterns críticos detectados (NUNCA REPETIR)

1. ❌ Asumir que Cloud Functions funciona de inmediato sin revisar si usa Emulador o Prod. Si falla por CORS en funciones nuevas, revisar primero si la función realmente se desplegó o si la app usa localhost.
2. ❌ `git checkout --theirs <archivo-crítico>` sin revisar manualmente rutas/imports perdidos.
3. ❌ Push a `origin/qa` sin correr `npm run lint` + verificación visual en browser.

---

## Módulos Recientes — Estado consolidado

| Módulo                                          | Archivo Objetivo                                     | Estado                   | 
| :---------------------------------------------- | :--------------------------------------------------- | :----------------------- | 
| **Flexibilización Pago (+8h) (P1)**             | MyTrips.tsx                                          | **SPEC CREADA / PEND. IMPL** |
| **KYC Loop & Auth Modal Redirect (P1)**         | ProfileSettings.tsx, ListingDetail.tsx               | **COMPLETADO**           |
| **Herramienta Limpieza Reservas (P1)**          | purgeTestBookings.ts, PurgeTestBookingsModal.tsx     | **CÓDIGO LISTO / DEPLOY FALLIDO**| 
| **Fix Host Email Notification (P0)**            | functions/src/booking.functions.ts, templates/       | **COMPLETADO**           | 
| **Email Notifications & Secure Stay Flow (P0)** | functions/src/\*, useCheckout.ts, booking-service.ts | **COMPLETADO**           | 
| **SPEC-AUTH-MODAL-OPTIMIZATION (P0)**           | AuthModal.tsx, useAuthForm.ts, auth.schema.ts        | **COMPLETADO**           | 

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
|:------|:-------|:-------|:--------|:---------------|
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
