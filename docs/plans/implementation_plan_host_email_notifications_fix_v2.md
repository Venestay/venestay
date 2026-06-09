# Plan de Implementación: Corrección de Notificaciones al Anfitrión (Comprobante de Pago) v2.0

> **Versión:** 2.0 — Adaptado al contexto actual del proyecto (S04-C · Beta Julio 2026)
> **Fecha:** 2026-06-07
> **Contexto:** Habilitación local y robustez en la resolución de correos de anfitriones

---

## 0. Análisis de Fase del Proyecto

### Estado Actual y Causa del Fallo
El flujo de "Asegurar la reserva" (cuando el huésped sube un comprobante) cambia el estado de la reserva a `AWAITING_VERIFICATION`. Esto debería disparar una notificación de correo al anfitrión. Sin embargo, no llega porque:
1. **Emulador local offline:** No existe la configuración del emulador de `"functions"` en `firebase.json`, lo que causa que los triggers locales de la base de datos no se ejecuten.
2. **Despliegue bloqueado:** El directorio `/functions` carece de dependencias (`package.json`) y configuración (`tsconfig.json`) local para TypeScript, haciendo imposible su compilación o despliegue seguro a producción.
3. **IDs Mock en BD:** Muchas de las propiedades mock usan `hostId` ficticios (`'admin'`, `'admin_carlos'`), los cuales no tienen un documento correspondiente con correo electrónico en la colección `users`, fallando silenciosamente la resolución de la dirección de destino.

---

## 1. Objetivo

Habilitar el entorno de desarrollo y pruebas de Cloud Functions en local, estructurando las dependencias necesarias y dando resiliencia de datos al trigger `onBookingStateChanged` para que el email de confirmación siempre se encole correctamente en la colección `mail`.

---

## 2. Alcance

### Incluye
- Creación de dependencias y scripts de construcción en la subcarpeta `functions/`.
- Habilitación del servicio y emulador de `"functions"` en `firebase.json`.
- Corrección de resiliencia en [booking.functions.ts](file:///c:/VeneStay/functions/src/booking.functions.ts) para resolver correos a partir de UIDs mocks y de formato de correo crudo.

### No incluye
- Cambios en las plantillas visuales ya desacopladas en el sprint anterior.
- Modificaciones en las reglas de seguridad de Firestore (`firestore.rules`).

---

## 3. Arquitectura de Cambios

```
VeneStay/
  ├── firebase.json              # Habilita el servicio "functions" y su emulador local (Puerto 5001)
  └── functions/
        ├── package.json         # [NEW] Dependencias locales de la función (admin, functions, typescript)
        ├── tsconfig.json        # [NEW] Configuración de compilación para compilar a /lib
        └── src/
              └── booking.functions.ts  # [MODIFY] Lógica de resolución de correo del host con fallback
```

---

## 4. Cambios por Archivo

### `functions/package.json` [NEW]
Define dependencias aisladas del runtime de Cloud Functions y scripts de compilación:
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w"
  },
  "engines": {
    "node": ">=24"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.12.0",
    "firebase-functions": "^6.2.0"
  },
  "devDependencies": {
    "typescript": "~5.8.2"
  },
  "private": true
}
```

### `functions/tsconfig.json` [NEW]
Configuración para compilar de forma aislada a JS en la carpeta `lib/`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2022",
    "skipLibCheck": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

### `firebase.json` [MODIFY]
Configurar el bloque de `functions` y asignar puerto local al emulador:
```json
{
  "firestore": {
    "database": "ai-studio-58b68c99-e33b-41f2-9d14-cb5d47474d97",
    "rules": "firestore.rules"
  },
  "storage": [
    {
      "target": "rules",
      "rules": "storage.rules"
    }
  ],
  "functions": {
    "source": "functions",
    "codebase": "default"
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true
    }
  }
}
```

### `functions/src/booking.functions.ts` [MODIFY]
Dotar al trigger de robustez para la resolución de correos de anfitriones:
```typescript
        // Lógica de resolución del correo del anfitrión
        let hostEmail: string | null = null;
        const ownerId = after.ownerId;

        if (ownerId && ownerId.includes('@')) {
          hostEmail = ownerId;
        } else {
          try {
            const hostSnap = await db.collection('users').doc(ownerId).get();
            const host = hostSnap.data();
            if (host && host.email) {
              hostEmail = host.email;
            }
          } catch (err) {
            console.error('Error fetching host details from users:', err);
          }
        }

        // Fallback para pruebas si el host final no tiene email resuelto
        if (!hostEmail) {
          console.warn(`Host email not found for ownerId: ${ownerId}. Falling back to default test host email.`);
          hostEmail = 'anfitrionvenestay@venestay.com';
        }
```

---

## 5. Criterios de Aceptación

- [ ] **CA-1:** `functions` compila localmente de forma exitosa (`npm run build` genera la carpeta `lib/` sin fallos).
- [ ] **CA-2:** El emulador de Cloud Functions inicia localmente en el puerto `5001`.
- [ ] **CA-3:** Al transicionar una reserva a `AWAITING_VERIFICATION`, se encola exitosamente un documento en la colección `mail` de Firestore local.
- [ ] **CA-4:** Si el `ownerId` de la reserva es un ID mock (e.g. `'admin'`), se utiliza el fallback `anfitrionvenestay@venestay.com`.
- [ ] **CA-5:** Si el `ownerId` de la reserva es un correo crudo, se envía a este de forma directa.
- [ ] **CA-6:** La suite de validación `run-validation.cjs` del proyecto pasa con un resultado de 10/10 Gates exitosos.

---

## 6. Plan de Verificación

### Pruebas Automatizadas
- Compilar las functions ejecutando `npm run build` en el directorio de `functions`.
- Ejecutar: `npm run validate` para validar TypeScript, linter y tests de regresión del proyecto.

### Pruebas Manuales
1. Subir un comprobante simulado de pago desde la UI o ejecutando un script local de checkout.
2. Comprobar que en Firestore se inserta el documento de correo en la colección `mail`.
