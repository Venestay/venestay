# MEMORY_HOT — VeneStay Agent

_Sprint: S05 — Admin Tools & Maintenance · Actualizado: 2026-06-12_

---

## 🚨 ALERTA CRÍTICA PARA EL PRÓXIMO AGENTE — LEER ANTES DE CUALQUIER ACCIÓN

**Despliegue de Cloud Functions BLOQUEADO por error en GCP.**
Se implementó con éxito el código de la herramienta de "Limpieza de Reservas de Prueba" (Purga Admin):
- `previewTestBookings` y `purgeTestBookings` (Cloud Functions)
- `PurgeTestBookingsModal.tsx` en el frontend (`ListingDetail.tsx`)
- Reglas de Firestore (`firestore.rules`) actualizadas para el estado `CANCELLED_BY_ADMIN` y la colección `adminActions`.

**EL PROBLEMA:** El comando `firebase deploy --only functions` falla al subir al servidor porque la cuenta de servicio de Google Cloud (`201796771956-compute@developer.gserviceaccount.com`) NO existe o le falta el rol `Storage Object Viewer`. 

**ESTADO ACTUAL EN LOCAL:** La app arrojará un error de CORS (o 404 disfrazado de CORS) al intentar usar la purga en `localhost:3000` si apunta al backend en la nube, ya que la función no pudo crearse allá.

**PRÓXIMA TAREA DEL AGENTE:** 
1. Validar con el usuario si ya reparó el Service Account en Google Cloud (IAM).
2. Si el usuario no puede reparar la nube inmediatamente, proponer usar el **Emulador Local de Firebase** en `src/lib/firebase.ts` para probar la funcionalidad localmente sin depender del deploy.

---

## Estado ahora

```text
SPRINT    : S05 — Admin Tools & Maintenance
QA_GATE   : PENDIENTE — Validar herramienta de Purga en local apuntando al backend real
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
| **Herramienta Limpieza Reservas (P1)**          | purgeTestBookings.ts, PurgeTestBookingsModal.tsx     | **CÓDIGO LISTO / DEPLOY FALLIDO**| 
| **Fix Host Email Notification (P0)**            | functions/src/booking.functions.ts, templates/       | **COMPLETADO**           | 
| **Email Notifications & Secure Stay Flow (P0)** | functions/src/\*, useCheckout.ts, booking-service.ts | **COMPLETADO**           | 
| **SPEC-AUTH-MODAL-OPTIMIZATION (P0)**           | AuthModal.tsx, useAuthForm.ts, auth.schema.ts        | **COMPLETADO**           | 
| Plan KYC v2.0                                   | docs/plans/implementation_plan_kyc_v2.md             | APROBADO                 | 

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
| 2026-06-12 | Mejora del Ecosistema de Agentes (IMPL-AGENTS-S05-01) | COMPLETADO | OK | Ninguna. Ecosistema de agentes y validaciones completamente operativo. |
