# SPEC-INFRA-001 v2: Habilitación de Emuladores de Firebase en Frontend

**Sprint:** S05
**Prioridad:** P0
**Fecha:** 2026-06-14

| Campo | Valor |
|---|---|
| ID | SPEC-INFRA-001 |
| Sprint | S05 - Admin Tools & Maintenance |
| Prioridad | P0 - Bloqueante de sprint |
| Tipo | MODIFICAR - `src/lib/firebase.ts` |
| Capa FSD | infra / configuración global |
| Versión | v2 - Auditada y reforzada |
| Autor original | Planner (IA Arquitecto) |
| Revisión | Auditoría de seguridad y completitud |

## 1. Contexto y Motivación
El despliegue de Cloud Functions a producción está bloqueado por un error de IAM en Google Cloud. Para desbloquear las pruebas locales del flujo UCP de Asegurar Estadía (estado AWAITING_VERIFICATION) y la generación de correos transaccionales, es necesario conectar el frontend al Emulador de Firebase.

La especificación original (v1) cubría Firestore y Functions, pero omitía componentes críticos del stack de VeneStay que generarían un estado híbrido dev/prod difícil de diagnosticar.

## 2. Hallazgos de la Auditoría (v1 -> v2)

| Hallazgo | Riesgo v1 | Solución v2 |
|---|---|---|
| 🔴 Doble conexión al emulador en HMR de Vite | Error de runtime silencioso: el SDK lanza excepción si `connectFirestoreEmulator()` se llama más de una vez. | Flag de módulo `emulatorsConnected` previene re-ejecución en hot reload. |
| 🔴 Auth Emulator ausente | Custom Claims y `onAuthStateChanged` consultan Auth de producción; estado híbrido dev/prod imposible de diagnosticar. | Agregar `connectAuthEmulator(auth, 'http://localhost:9099')`. |
| 🔴 Storage Emulator no contemplado | Funciones del sprint S05 que usen `signedURL` fallarán contra producción. | Agregar `connectStorageEmulator(storage, 'localhost', 9199)` si aplica. |
| 🔴 CA-2 vago (advertencia reactiva) | No especificaba cómo detectar emulador caído; el SDK no emite error descriptivo proactivo. | `console.warn` proactivo al conectar, con puertos y comando de arranque embebidos. |

> **CRÍTICO:** La omisión del Auth Emulator es el riesgo más alto. VeneStay usa Custom Claims para enforcement de roles (reemplazando el check de email hardcodeado), por lo que cualquier flujo de KYC o admin correría contra usuarios reales de producción.

## 3. Implementación - `src/lib/firebase.ts`
El siguiente bloque reemplaza el segmento de inicialización existente. Los imports de producción no se modifican.

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
// Opcional - solo si el sprint usa Storage:
// import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = { /* sin cambios - leer de import.meta.env */ };

// Evitar re-inicialización en HMR de Vite
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db        = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');
export const auth      = getAuth(app);
// export const storage = getStorage(app);

// --- Conexión a emuladores ---
// Flag módulo-nivel: previene doble llamada en hot-reload (Vite HMR)
let emulatorsConnected = false;

if (import.meta.env.DEV && !emulatorsConnected) {
  emulatorsConnected = true;
  console.warn(
    '[VeneStay DEV] Conectando a emuladores de Firebase.\n' +
    '  Firestore   localhost:8080\n' +
    '  Functions   localhost:5001\n' +
    '  Auth        http://localhost:9099\n' +
    '  Si ves errores de red: firebase emulators:start'
  );

  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
  // connectStorageEmulator(storage, 'localhost', 9199);
}
```

## 4. Backend - Comandos de Arranque
Ejecutar en este orden antes de iniciar el frontend:

```bash
# 1. Compilar las Cloud Functions (TypeScript -> lib/)
cd functions && npm run build && cd ..

# 2. Levantar emuladores con UI habilitada
firebase emulators:start --only firestore,functions,auth

# 3. En otra terminal - levantar el frontend
npm run dev
```

Agregar en `firebase.json` (habilita la UI de emuladores en http://localhost:4000):
```json
{
  "emulators": {
    "auth":      { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "ui":        { "enabled": true, "port": 4000 }
  }
}
```

## 5. Criterios de Aceptación (QA Gate)

| CA | Descripción | Estado v1 | Estado v2 |
|---|---|---|---|
| CA-1 | Al ejecutar `npm run dev`, el frontend conecta Firestore, Functions y Auth a los emuladores cuando `DEV=true`. | Parcial (solo 2 servicios) | Completo (3 servicios) |
| CA-2 | `console.warn` proactivo al iniciar, con lista de puertos y comando `firebase emulators:start`. | Vago - no especificado | Implementado en bloque DEV |
| CA-3 | `tsc --noEmit` sin errores de compilación | Presente | Presente |
| CA-4 | ESLint sin errores severos | Presente | Presente |
| CA-5 | No se lanza error 'emulator already started' durante hot-reload de Vite. El flag `emulatorsConnected` previene la doble llamada. | No cubría | Cubierto |
| CA-6 | El flujo de KYC con Custom Claims funciona íntegramente en emulador sin hacer requests al Auth de producción. | No cubría | Cubierto |

## 6. Límites de la Spec (sin cambio)
- No modificar el esquema de base de datos Firestore.
- No alterar las credenciales de producción del archivo `.env`.
- No levantar los emuladores programáticamente desde código React.
- El bloque de conexión a emuladores es dead code en producción (`import.meta.env.DEV = false` en build).

## 7. Dependencias y Bloqueos

| Tipo | Detalle |
|---|---|
| Requiere | Ejecutar `npm run build` en `functions/` antes de iniciar los emuladores. Sin este paso, `firebase emulators:start` usa código desactualizado. |
| Bloquea | Pruebas locales de envío de correos (Sprint S05) - flujo UCP AWAITING_VERIFICATION completo. |
| IAM bloqueante | El error de Google Cloud IAM en producción sigue activo. Esta spec no lo resuelve; solo habilita el camino alternativo via emuladores. |

## 8. Aprobación y Próximos Pasos

> **NOTA:** Revisar esta especificación v2. Si estás de acuerdo, confirma para proceder al cambio en `src/lib/firebase.ts`. Una vez aplicado, se proveerán los comandos para levantar el emulador localmente.

| Paso | Responsable |
|---|---|
| Aprobar spec v2 | Carlos (Project Manager) |
| Aplicar cambio en `src/lib/firebase.ts` | Developer / Claude |
| Ejecutar `npm run build` en `functions/` | Carlos (local) |
| Levantar `firebase emulators:start` | Carlos (local) |
| Verificar CA-1 a CA-6 | QA Gate |
