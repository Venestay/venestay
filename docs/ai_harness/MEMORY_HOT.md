# MEMORY_HOT — VeneStay Agent
_Sprint: S04 — KYC & Identity Verification · Actualizado: 2026-06-10_

---

## 🚨 ALERTA CRÍTICA PARA EL PRÓXIMO AGENTE — LEER ANTES DE CUALQUIER ACCIÓN

**La sesión del 2026-06-09/10 dejó la rama `origin/qa` en estado CORRUPTO.**
El archivo `src/features/bookings/components/MyTrips.tsx` fue commiteado con encoding UTF-8 roto (tildes y ñ aparecen como caracteres ilegibles en el browser).
**La PRIMERA tarea de la próxima sesión es ejecutar la remediación descrita abajo.**

---

## Estado ahora
```
SPRINT    : S04 — Branch Unification & QA Recovery
QA_GATE   : OK — origin/qa sano (commit 42ac75d)
BLOQUEANTE: ninguno
RAMA_LOCAL: qa (tracking origin/qa — sincronizada · 42ac75d)
RAMA_PROD : main (origin/main — NO TOCADA, está INTACTA · d72b6b3)
```

---

## Arquitectura de Ambientes (Aprobada por el usuario)

```
DEV (local, npm run dev) → QA (origin/qa, branch) → PRD (origin/main → Vercel)
```

- **`origin`** = org `Venestay/venestay` (repositorio principal, producción)
- **`cerz30`** = fork personal `cerz30/VeneStay` (backup, no usar como base)
- **Rama `qa`**: punto de integración de todas las features antes de llegar a `main`
- **`main`**: producción limpia — Vercel despliega desde aquí

---

## Estado de origin/qa al cierre de sesión

### Commits en `qa` no presentes en `main` (en orden cronológico)
```
9533219 ← ⚠️ CORRUPTO: MyTrips.tsx con encoding roto (Out-File PowerShell)
e193b12 ← OK: fix lint — helpers puros getStatusDisplay + generateReceiptPath
a9e3ad1 ← OK: fix ruta /mis-viajes perdida en merge
83b56cc ← OK: merge feature/whatsapp-jelou-integration
160425c ← OK: merge feature/spec-soft-kyc-cne
f6fa838 ← OK: merge feature/in-app-chat-notifications
bd08ed8 ← OK: merge feature/host-email-notification-fix
ac74703 ← OK: merge feature/s03-checkout-optimizations
2666459 ← OK: gitignore + MEMORY_HOT actualizado
```

### Estado de archivos críticos en `origin/qa`
| Archivo | Estado |
|---|---|
| `src/App.tsx` | ✅ Correcto — todas las rutas presentes incluida `/mis-viajes` |
| `src/features/bookings/components/MyTrips.tsx` | ❌ CORRUPTO en origin/qa (commit 9533219) |
| `src/features/bookings/components/MyTrips.tsx` (LOCAL) | ✅ Correcto — `git checkout origin/main` ejecutado pero NO commiteado |
| `firestore.rules` / `storage.rules` | ✅ Idénticos a main |
| `functions/src/templates/` | ✅ Presentes (booking-emails, email-layout, kyc-emails) |
| `vercel.json` | ✅ OK |

---

## 🔧 PLAN DE RECUPERACIÓN — EJECUTAR AL INICIO DE LA PRÓXIMA SESIÓN

### Paso 1 — Verificar estado local
```bash
git status
git branch -vv
# Debe mostrar: * qa [origin/qa: ahead N]
```

### Paso 2 — Confirmar que el archivo local está correcto
```bash
# Buscar texto con tildes en el archivo
Select-String -Path "src/features/bookings/components/MyTrips.tsx" -Pattern "Gestión"
# Si devuelve resultado → archivo local está OK
# Si no devuelve → ejecutar: git checkout origin/main -- src/features/bookings/components/MyTrips.tsx
```

### Paso 3 — Decidir estrategia con el usuario (3 opciones)

**OPCIÓN A — Amend (RECOMENDADA):**
```bash
git add src/features/bookings/components/MyTrips.tsx
git commit --amend --no-edit
git push origin qa --force-with-lease
```

**OPCIÓN B — Nuevo commit de fix:**
```bash
git add src/features/bookings/components/MyTrips.tsx
git commit -m "fix(mytrips): correct UTF-8 encoding corrupted by PowerShell Out-File"
git push origin qa
```

**OPCIÓN C — Reset completo:**
```bash
git reset --hard a9e3ad1
git checkout origin/main -- src/features/bookings/components/MyTrips.tsx
git commit -m "fix(mytrips): restore full MyTrips from main with correct encoding"
git push origin qa --force-with-lease
```

### Paso 4 — Verificar visual en browser
```bash
npm run dev
# Navegar a /mis-viajes y verificar:
# - "Gestión de Reservas VeneStay" se muestra correctamente (no "Gesti|n")
# - TripFilterBar visible (filtros ACTIVOS / HISTORIAL)
# - BookingSummaryModal funciona (botón "Ver Resumen")
# - RescheduleRequestModal funciona
# - Chat en tiempo real funciona
```

### Paso 5 — Lint check post-fix
```bash
npm run lint
# Target: 0 errores, ~99 warnings (todos preexistentes)
```

### Paso 6 — Una vez validado, preguntar al usuario si procede limpieza de ramas
El usuario autorizó eliminar las 18 ramas antiguas mergeadas de la org, pero esto quedó pendiente hasta validar `qa`. Con `qa` limpia, proceder.

---

## Incidentes documentados en esta sesión (RCA disponible)

| ID | Incidente | Causa raíz | Estado |
|---|---|---|---|
| RCA-MYTRIPS-001 | Ruta `/mis-viajes` perdida | `--theirs` en merge App.tsx | ✅ Resuelto |
| LINT-MYTRIPS-001 | Error React Compiler lint | Función impura en render scope | ✅ Resuelto |
| REGRESSION-MYTRIPS-001 | Sub-módulos perdidos (TripFilterBar, etc.) | Rama de chat desincronizada de main | ⚠️ Parcialmente resuelto |
| ENCODING-MYTRIPS-001 | Tildes corruptas en browser | `Out-File -Encoding UTF8` en PowerShell | ❌ PENDIENTE |

**Reportes completos:**
- `C:\Users\rodri\.gemini\antigravity-ide\brain\78071f20-d81f-45b5-a1d6-66ecc716b7e2\implementation_plan_environments.md` — Post-mortem completo
- `C:\Users\rodri\.gemini\antigravity-ide\brain\78071f20-d81f-45b5-a1d6-66ecc716b7e2\RCA-MYTRIPS-001.md` — RCA original

---

## Anti-patterns críticos detectados (NUNCA REPETIR)

1. ❌ `git checkout --theirs <archivo-crítico>` sin revisar manualmente rutas/imports perdidos
2. ❌ `Out-File -Encoding UTF8` en PowerShell para restaurar archivos fuente (usa `git checkout <commit> -- <file>` siempre)
3. ❌ Push a `origin/qa` sin correr `npm run lint` + verificación visual en browser
4. ❌ Resolver conflictos de merge en `App.tsx` de forma automática — siempre manual

---

## Módulos del Sprint S04 — Estado consolidado

| Módulo | Archivo Objetivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| **Fix Host Email Notification (P0)** | functions/src/booking.functions.ts, templates/ | **COMPLETADO** | 1/3 |
| **Email Notifications & Secure Stay Flow (P0)** | functions/src/*, useCheckout.ts, booking-service.ts | **COMPLETADO** | 1/3 |
| **SPEC-AUTH-MODAL-OPTIMIZATION (P0)** | AuthModal.tsx, useAuthForm.ts, auth.schema.ts | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-MYTRIPS-REGRESSION** | src/features/bookings/components/MyTrips.tsx | **EN RECUPERACIÓN** | 2/3 |
| **Infraestructura QA Branch** | origin/qa (Venestay/venestay) | **BLOQUEADO — encoding** | 1/3 |
| **Limpieza de 18 ramas antiguas** | origin/* | **PENDIENTE** | 0/3 |
| Plan KYC v2.0 | docs/plans/implementation_plan_kyc_v2.md | APROBADO | 0/3 |
| SPEC-KYC-01 | storage.rules, firestore.rules | COMPLETADO | 0/3 |
| Fase 1 MVP KYC | kyc-service.ts, submitKYCDocument.ts | COMPLETADO | 0/3 |
| Fase 2 Panel Admin KYC | approveKYC.ts | COMPLETADO | 1/3 |
| Fase 3 Integración Checkout | CheckoutPage.tsx | COMPLETADO | 1/3 |

---

## 🧪 Pruebas Manuales y QA (Ejecutar Próxima Sesión)
Se ha generado un **Plan Maestro de Pruebas Manuales** detallado que cubre todos los flujos críticos de la rama `qa` (Huésped, Anfitrión, Auth, Navegación y Pagos).

**Artefacto con el plan completo:**
[qa_manual_testing_plan.md](file:///C:/Users/rodri/.gemini/antigravity-ide/brain/43d5cd42-ff28-401a-a37e-e92f293fccce/qa_manual_testing_plan.md)

**Mandato para el próximo agente:** 
1. Leer el plan de pruebas en el artefacto enlazado.
2. Comentar con el usuario cuáles pruebas se han realizado con éxito.
3. Marcar explícitamente en la memoria cuando la rama `qa` pase exitosamente estas pruebas manuales antes de fusionar a `main`.

---

## Notas de Integración

- **Java JDK:** `C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin`
- **Firebase proyecto:** `gen-lang-client-0727178605`
- **Emuladores:** Firestore:8080, Storage:9199
- **`npm run dev`:** Corre en `localhost:3000`
- **Vercel:** Despliega automáticamente desde `origin/main` — NO desde `qa`

---

## Próxima acción requerida (en orden de prioridad)

1. **[P0 — QA MANUAL]** Leer el artefacto `qa_manual_testing_plan.md` enlazado arriba y coordinar con el usuario la validación visual y funcional en el browser (`npm run dev`).
2. **[P1]** Con las pruebas de `qa` validadas: proceder con la eliminación de las 18 ramas antiguas de la org.
3. **[P2]** Implementar checklist de merge como proceso obligatorio del equipo (SPEC-PROCESS-MERGE-01).
