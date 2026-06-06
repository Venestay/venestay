# Plan de Implementación Futuro: Comercio Conversacional WhatsApp (Jelou AI Integration)

Este plan detalla los pasos de ingeniería, cambios en el esquema de datos, integraciones externas y el plan de pruebas necesario para implementar el flujo de reservas conversacionales de WhatsApp en **VeneStay**.

---

## 1. Arquitectura de Integración

El sistema interactuará de forma bidireccional entre la API de Jelou y el backend de Firebase/Firestore de VeneStay mediante HTTPS Webhooks seguros y autenticación HMAC.

```
┌─────────────────┐             HTTPS Webhook (HMAC)             ┌───────────────────────┐
│                 │ ───────────────────────────────────────────> │                       │
│    Jelou AI     │                                              │   Firebase Cloud      │
│  (WhatsApp App) │ <─────────────────────────────────────────── │     Functions         │
│                 │         Jelou Send Message API (JSON)        │                       │
└─────────────────┘                                              └───────────────────────┘
                                                                             │
                                                                             ▼
                                                                 ┌───────────────────────┐
                                                                 │  Firestore & Storage  │
                                                                 │    (Base de Datos)    │
                                                                 └───────────────────────┘
```

---

## 2. Cambios Requeridos en el Modelo de Datos (Firestore Schema)

### 2.1 Colección `/users/{uid}`
Para poder mapear la identidad de WhatsApp con el perfil de usuario de VeneStay, se agregan los siguientes campos:
*   `phoneNumber`: `string` (Formato E.164 estándar, ej. `"+584141234567"`). Debe estar indexado para búsquedas rápidas.
*   `whatsappSession`: `object` (Control de estado de la sesión activa en chat).
    *   `lastActiveState`: `string` (ej. `"EXPLORANDO"`, `"VALIDANDO_TRUST"`, `"PENDING_PAYMENT"`).
    *   `lastInteractionAt`: `timestamp`.

### 2.2 Colección `/bookings/{bookingId}`
Para trazar el origen conversacional y la temporalidad de las pre-reservas:
*   `bookingSource`: `"web"` | `"whatsapp"`.
*   `agreedPercentage`: `number` (Fijado en `20` para la regla 20/80).
*   `whatsappUserPhone`: `string`.

---

## 3. Fase de Implementación (Hitos de Desarrollo)

### Fase 1: Capa de Seguridad e Identidad (Lookup & Auth)
*   **Hito 1.1: Índice y Lookup de Teléfono**
    *   Crear un índice secundario único en Firestore para `phoneNumber` en la colección `/users`.
    *   Implementar una Cloud Function privada (`getUserByPhoneNumber`) que reciba el número formateado en E.164 y retorne el perfil de usuario (incluyendo el `trustScore`).
*   **Hito 1.2: Autenticación HMAC**
    *   Implementar un validador de firmas criptográficas HMAC en el middleware de Express de las Cloud Functions para asegurar que todas las llamadas entrantes provengan exclusivamente de Jelou AI.

### Fase 2: Webhooks y Lógica del Flujo (Backend)
*   **Hito 2.1: Endpoint `/api/whatsapp/listings/search`**
    *   Una Cloud Function `onRequest` que permita a Jelou buscar alojamientos activos filtrando por ciudad, precio máximo por noche y capacidad, retornando un JSON formateado para tarjetas de WhatsApp.
*   **Hito 2.2: Endpoint `/api/whatsapp/bookings/create`**
    *   Cloud Function para crear pre-reservas en estado `PENDING_PAYMENT` usando transacciones para evitar conflictos de disponibilidad (doble reserva).
*   **Hito 2.3: Endpoint `/api/whatsapp/bookings/upload-payment`**
    *   Procesa la URL de la imagen enviada por Jelou, descarga el archivo en el runtime de la Cloud Function y lo sube al bucket seguro de Firebase Storage (`kyc/` o `payments/`).
    *   Actualiza el estado de la reserva a `PENDING_APPROVAL`.

### Fase 3: Integración de Jelou AI (Configuración Conversacional)
*   **Hito 3.1: Diseño del Grafo de Flujos en Jelou Console**
    *   Paso 1: Mapear respuestas NLP del usuario hacia consultas de listings.
    *   Paso 2: Bloque de consulta de Trust Score. Si es menor a 75, derivar a soporte humano.
    *   Paso 3: Bloque de desglose 20/80 e instrucciones de pago.
    *   Paso 4: Captura de imagen del comprobante y envío al Webhook.

---

## 4. Plan de Verificación y Pruebas

### 4.1 Pruebas Unitarias y de Integración (Backend)
*   `describe("WhatsApp API Endpoints")`:
    *   Verificar que solicitudes sin firma HMAC válida sean rechazadas con error `401 Unauthorized`.
    *   Verificar que la creación de reserva lance excepción y haga rollback si las fechas ya están confirmadas o pre-reservadas.
    *   Verificar que la descarga de archivos desde URLs externas y su posterior carga en Firebase Storage no exceda el timeout de la función (60 segundos).

### 4.2 Pruebas de Flujo Completo (Manuales & Simulación)
1.  **Simulación de Inbound:** Enviar mensaje simulando búsqueda en Lechería de $120 y validar que el payload retorne el apartamento "Vista Mar - Complejo El Morro".
2.  **Verificación de Seguridad:** Ejecutar flujo con un número simulado con score `60` y validar que el flujo de Jelou se detenga y notifique el bloqueo. Repetir con score `88` y validar que continúe.
3.  **Confirmación y Carga de Archivo:** Subir un mock de comprobante y verificar en el panel administrativo web de VeneStay que la reserva pase de inmediato a `PENDING_APPROVAL` con el link del comprobante alojado en Firebase Storage.
