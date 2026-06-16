## SPEC ATÓMICA Y REPORTE ESTRATÉGICO — 2026-06-16 (Rev. 2)
**Nodo Activo:** Project Manager & Planner (SDD)
**Revisado por:** Arquitecto de Sistema (QA Pass)
**Objetivo:** Desconectar el entorno DEV local del emulador de Firebase y conectarlo directamente a la nube real (proyecto QA/Dev en GCP) para probar el flujo completo de Notificaciones y Emails sin interferencia del emulador.

---

### Contexto y Restricciones del Ecosistema

El proyecto mantiene la estructura: `DEV (local) → QA (Vercel Preview) → PRD (main)`.

El entorno `DEV` (`localhost:3000`) está actualmente "secuestrado" por el emulador de Firebase a través de la configuración en `src/lib/firebase.ts`. Al probar Cloud Functions que disparan emails/notificaciones, el emulador introduce bugs propios que impiden validar el flujo real.

**Regla de oro de Firebase:** la base de datos y la función deben vivir en el mismo ecosistema. Por lo tanto, si la app apunta a Firestore en la nube, las Functions que reaccionen a sus triggers también deben estar desplegadas en la nube.

---

### Gate #0 — Prerequisito Bloqueante (Verificar ANTES de ejecutar cualquier opción)

> [!CAUTION]
> **El error de IAM (Service Account / Storage Object Viewer) en GCP es un prerequisito hard, no un "contra" menor.**
> Si `firebase deploy --only functions` falla por permisos, ninguna de las opciones a continuación producirá emails reales.
>
> **Acción requerida antes de continuar:**
> Verificar que la Service Account `firebase-adminsdk-xxxx@<project>.iam.gserviceaccount.com` tiene el rol `roles/storage.objectViewer` (o `roles/firebase.sdkAdminServiceAgent`) en la consola de GCP → IAM.
> Ejecutar `firebase deploy --only functions --dry-run` para confirmar que el deploy es viable.

---

### Análisis de Opciones Estratégicas

#### ✅ Opción Recomendada: Híbrido Controlado por Variable de Entorno

Desconectamos la app local del emulador mediante una variable de entorno (`VITE_USE_FIREBASE_EMULATOR`). El flag permite alternar entre emulador y nube sin tocar código, preservando la capacidad de volver al emulador para pruebas de reglas de Firestore o desarrollo offline.

Simultáneamente, desplegamos las Cloud Functions al proyecto de QA en GCP para que los triggers de Firestore en la nube puedan dispararse correctamente.

**Flujo resultante:**
```
localhost:3000 (DEV)
  └─ Firestore en nube (QA project)
       └─ onCreate trigger → Cloud Function desplegada en QA
            └─ Nodemailer / SendGrid → email real al usuario
```

**Pros:**
- Cero bugs de emulador en el flujo de emails.
- Toggle reversible sin cambiar código; solo `.env.local`.
- El emulador sigue disponible para pruebas de reglas de seguridad o trabajo offline.

**Contras / Riesgos:**
- Requiere que el Gate #0 (IAM) esté resuelto.
- Las escrituras en Firestore durante pruebas tocan datos reales del proyecto QA. Usar colecciones con prefijo de prueba (e.g., `bookings_test/`) o limpiar después.
- El HMR de Vite puede re-importar `firebase.ts` y crear una segunda instancia de `FirebaseApp`. Ver mitigación en el plan de ejecución.

#### ❌ Opción Descartada: Frontend a Nube + Functions con Túnel (ngrok)

Enlazar triggers de Firestore remotos a funciones locales vía `ngrok` es inestable, requiere configuración de webhooks en GCP, y viola el principio de simplicidad de la arquitectura. Descartada definitivamente.

---

### Plan de Ejecución

#### Paso 1 — Verificar proyecto activo y credenciales

Antes de modificar código, confirmar que `.env.local` apunta al proyecto correcto (QA, no PRD):

```bash
# Verificar proyecto Firebase activo en la CLI
firebase use

# Debe mostrar algo como: Active Project: venestay-qa (venestay-qa)
# Si muestra el proyecto de PRD, cambiar con:
firebase use venestay-qa
```

Verificar que `.env.local` contiene las variables del proyecto QA:

```env
# .env.local — NO commitear a git (debe estar en .gitignore)
VITE_FIREBASE_PROJECT_ID=venestay-qa
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=venestay-qa.firebaseapp.com
# ... resto de variables del proyecto QA

# Flag de control del emulador
VITE_USE_FIREBASE_EMULATOR=false
```

> [!WARNING]
> Confirmar que `.env.local` está en `.gitignore`. Las credenciales de Firebase no deben exponerse en el repositorio.

---

#### Paso 2 — Modificar `src/lib/firebase.ts`

Envolver el bloque de conexión de emuladores bajo la variable de entorno. Adicionalmente, proteger contra la re-ejecución en HMR de Vite con un guard robusto:

```typescript
// src/lib/firebase.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... resto del config
};

// Guard contra re-inicialización en HMR de Vite
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1'); // ajustar región

// Conexión condicional al emulador
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Flag en el objeto app para evitar doble-conexión al emulador en HMR
// (connectFirestoreEmulator lanza si se llama dos veces en la misma instancia)
declare global {
  interface Window { _emulatorsConnected?: boolean; }
}

if (import.meta.env.DEV && useEmulator && !window._emulatorsConnected) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, 'localhost', 5001);
  window._emulatorsConnected = true;
  console.info('[Firebase] Usando EMULADOR local');
} else if (!useEmulator) {
  console.info(
    `[Firebase] Conectado a NUBE — proyecto: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`
  );
}
```

> **Nota sobre el guard de HMR:** usar `window._emulatorsConnected` en lugar de una variable de módulo evita que el Hot Module Replacement de Vite re-conecte el emulador al reemplazar el módulo, lo que lanzaría un error de Firebase por doble conexión.

---

#### Paso 3 — Desplegar Cloud Functions al proyecto QA

```bash
# Asegurarse de estar en el proyecto correcto (ver Paso 1)
firebase use venestay-qa

# Desplegar solo las Functions (no reglas, no hosting)
firebase deploy --only functions

# Si el deploy falla por IAM, revisar Gate #0
```

---

#### Paso 4 — Verificación funcional

Iniciar el servidor de desarrollo y confirmar en la consola del browser:

```
[Firebase] Conectado a NUBE — proyecto: venestay-qa
```

Crear una reserva de prueba desde `localhost:3000` y verificar:

1. El documento aparece en Firestore Console (proyecto `venestay-qa`).
2. La Cloud Function se ejecuta: verificar en **GCP Console → Cloud Functions → Logs**.
3. El email llega al destinatario de prueba.

---

#### Paso 5 — Limpieza post-prueba (opcional pero recomendado)

Si las pruebas escribieron datos reales en Firestore QA, limpiar las colecciones de prueba desde la consola de Firebase o con un script de administración.

Para reactivar el emulador en cualquier momento:

```env
# .env.local
VITE_USE_FIREBASE_EMULATOR=true
```

---

### Criterios de Aceptación

| # | Criterio | Verificación |
|---|----------|--------------|
| AC-01 | La app corre en `localhost:3000` sin conectarse al emulador | Log `[Firebase] Conectado a NUBE` en consola del browser |
| AC-02 | Las Cloud Functions están desplegadas en QA | `firebase deploy --only functions` exitoso |
| AC-03 | Un trigger de Firestore ejecuta la Function en la nube | Log visible en GCP → Cloud Functions → Logs |
| AC-04 | El email de notificación llega al destinatario | Bandeja de entrada del email de prueba |
| AC-05 | El toggle `VITE_USE_FIREBASE_EMULATOR=true` reactiva el emulador sin cambios de código | HMR recarga sin errores de doble-conexión |
| AC-06 | `.env.local` no está en el historial de git | `git status` no muestra `.env.local`; `.gitignore` lo excluye |

---

### Rollback

Si el deploy falla o el flujo no funciona como se espera:

```env
# .env.local — revertir a emulador
VITE_USE_FIREBASE_EMULATOR=true
```

No hay cambios destructivos: el código de `firebase.ts` es retrocompatible. El emulador vuelve a funcionar con solo cambiar el flag.

---

> [!IMPORTANT]
> **Aprobación de Estrategia — Confirmaciones requeridas:**
>
> 1. **Gate #0:** ¿El error de IAM (Service Account / Storage Object Viewer) en GCP ya fue resuelto? ¿`firebase deploy --only functions` puede ejecutarse sin errores de permisos?
> 2. **Proyecto activo:** Confirma que el proyecto Firebase activo en tu CLI es `venestay-qa` (QA), no el proyecto de producción.
> 3. Responde **"Aprobado"** para proceder con la modificación de `firebase.ts` y la preparación de `.env.local`.
