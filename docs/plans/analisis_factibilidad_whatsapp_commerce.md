# Análisis de Factibilidad — Comercio Conversacional por WhatsApp
## VeneStay v2.3.0 · Sprint Futuro Propuesto

> **Documento de referencia analizado:** `docs/specs/spec_conversational_commerce_whatsapp.md`
> **Autor del análisis:** Agente Antigravity · Nodo 1 — Project Manager
> **Fecha:** 2026-06-05

---

## Resumen Ejecutivo

La idea de integrar un flujo de reservas completo vía WhatsApp con la plataforma **Jelou AI** es **FACTIBLE** desde el punto de vista técnico y arquitectónico, dado que el núcleo de VeneStay (Firebase / Firestore + Cloud Functions + Storage) ya soporta todos los bloques de datos que requiere el flujo. Sin embargo, la implementación NO es trivial: requiere la incorporación de una **capa de integración externa** (Jelou API / WhatsApp Business API) que hoy no existe en el proyecto, y que introduce dependencias de negocio, costos operativos y riesgos de seguridad que deben ser evaluados cuidadosamente antes de iniciar el desarrollo.

**Veredicto:** ✅ Factible — ⚠️ Complejidad Alta — 📅 Sprint Futuro (no S04)

---

## 1. Análisis por Paso del Flujo

### Paso 1 — Descubrimiento de Propiedades (NLP → Tarjeta Interactiva)

| Dimensión | Estado Actual | Brecha a Cubrir |
|:---|:---|:---|
| **Datos de listings** | ✅ Disponibles en Firestore (`listings/`) con título, precio, ciudad, capacidad | ❌ No hay endpoint público/API REST que Jelou pueda consultar |
| **Búsqueda por NLP** | ❌ No existe procesamiento de lenguaje natural interno | ❌ Requiere configurar Jelou con intents: ciudad, precio/noche, capacidad |
| **Tarjetas interactivas** | ❌ No existe | ❌ Requiere WhatsApp Business API (Meta) con soporte de Interactive Messages / Flow |

**Implicación técnica:** Se necesita un **webhook de lectura** (`GET /api/listings?city=lecheria&maxPrice=120`) o una Cloud Function `onRequest` que Jelou pueda consumir para obtener resultados de búsqueda. Los datos ya existen; el canal de exposición no.

---

### Paso 2 — Filtro de Seguridad (Trust Score ≥ 75)

| Dimensión | Estado Actual | Brecha a Cubrir |
|:---|:---|:---|
| **Trust Score en modelo de datos** | ✅ Campo `trustScore` en `/users/{uid}` (incrementado con `approveKYC` +40 pts) | ❌ El `trustScore` está vinculado al `uid` de Firebase Auth, no al número de WhatsApp |
| **Lógica de umbral (≥ 75)** | ⚠️ Existe la puntuación, no la regla de "bloqueo" | ❌ Requiere una Cloud Function callable o trigger que Jelou pueda invocar con el número telefónico |
| **Mapeo `whatsappNumber → uid`** | ❌ No existe | ❌ Requiere campo `phoneNumber` estandarizado en el documento `/users/{uid}` y una función de lookup |

**Implicación técnica:** Se requiere un endpoint tipo `POST /api/trust-check` con el número de teléfono como input, que devuelva `{ eligible: boolean, score: number }`. Este endpoint deberá implementarse como Cloud Function con CORS controlado y autenticación por API Key desde Jelou.

---

### Paso 3 — Intención de Reserva (Modelo 20/80)

| Dimensión | Estado Actual | Brecha a Cubrir |
|:---|:---|:---|
| **Modelo financiero 20/80** | ✅ Implementado: `agreedPercentage: 20` en `booking-service.ts` → `requestBookingDirectly()` | ❌ El flujo actual requiere un usuario autenticado (`guestId`). WhatsApp no tiene sesión de Firebase Auth |
| **Creación de reserva** | ✅ Transacción atómica con verificación de disponibilidad | ❌ Falta un mecanismo de identidad provisional para huéspedes sin cuenta registrada |
| **Cálculo de depósito** | ✅ Lógica existente en `useCheckout.ts` | ❌ Debe exponerse como utilidad server-side para Jelou |
| **Datos bancarios automáticos** | ❌ Hardcodeados en el simulador HTML | ❌ Deben provenir de Firestore (datos del anfitrión de la propiedad) |

**Implicación técnica:** El mayor reto de este paso es la **identidad del huésped**. Se puede resolver con un flujo de registro ligero vía WhatsApp (nombre + email) que cree un usuario Firebase anónimo o con autenticación por teléfono (`signInWithPhoneNumber`). Esto añade complejidad al flujo conversacional.

---

### Paso 4 — Carga del Comprobante y Sincronización

| Dimensión | Estado Actual | Brecha a Cubrir |
|:---|:---|:---|
| **Upload a Firebase Storage** | ✅ `storage-service.ts` → `uploadUserDocument()` implementado | ❌ Jelou necesita recibir la imagen del chat y retransmitirla al endpoint de Storage |
| **Transición de estado** | ✅ `PENDING_APPROVAL` existe en `booking-service.ts` | ❌ El trigger de estado debe ser activado desde un webhook externo, no desde la UI web |
| **Notificación al anfitrión** | ⚠️ Solo existe notificación a admins vía `adminNotifications` collection | ❌ No hay notificación push/email al anfitrión directamente |

**Implicación técnica:** Jelou debe poder invocar un endpoint `POST /api/submit-payment-proof` que reciba la URL del comprobante (ya almacenado por Jelou en sus servidores o en la URL pública de WhatsApp Media) y actualice el estado de la reserva. Idealmente, el sistema debería descargar la imagen de WhatsApp y re-subirla a Firebase Storage propio para no depender de URLs externas con expiración.

---

## 2. Mapa de Nuevos Componentes Requeridos

```
┌─────────────────────────────────────────────────────┐
│                  JELOU AI (Externo)                  │
│  • Webhook de respuesta a mensajes WhatsApp          │
│  • NLP Intents: búsqueda, reserva, pago              │
│  • Orquestador del flujo conversacional              │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / HTTPS
                    ▼
┌─────────────────────────────────────────────────────┐
│         CAPA DE INTEGRACIÓN (Nuevas CF)             │
│                                                      │
│  GET  /api/listings/search        → listings/        │
│  POST /api/trust-check            → users/{uid}      │
│  POST /api/bookings/whatsapp      → bookings/        │
│  POST /api/submit-payment-proof   → storage + bookings│
└───────────────────┬─────────────────────────────────┘
                    │ Firebase Admin SDK
                    ▼
┌─────────────────────────────────────────────────────┐
│           INFRAESTRUCTURA EXISTENTE                  │
│  • Firestore (listings, bookings, users, messages)   │
│  • Firebase Storage (comprobantes/)                  │
│  • Cloud Functions (kyc, booking, auth)              │
└─────────────────────────────────────────────────────┘
```

---

## 3. Evaluación de Riesgos

| Riesgo | Nivel | Mitigación |
|:---|:---:|:---|
| **Identidad sin Firebase Auth** — Un usuario de WhatsApp no tiene UID | 🔴 Alto | Implementar lookup por `phoneNumber` o autenticación OTP de Firebase Phone Auth |
| **Dependencia de API de terceros** — WhatsApp Business API y Jelou tienen costos y cuotas | 🟠 Medio | Evaluar pricing de Jelou (conversaciones/mes) y Meta WABA antes de iniciar |
| **Comprobantes en URLs externas** — URLs de media de WhatsApp expiran en 72h | 🟠 Medio | Descargar y re-subir el archivo a Firebase Storage desde la Cloud Function |
| **Sin autenticación del webhook** — Jelou llama a los endpoints sin validar origen | 🔴 Alto | Implementar HMAC Signature Verification en cada endpoint (secreto compartido) |
| **Datos bancarios expuestos** — La Cloud Function devuelve datos sensibles en texto plano | 🔴 Alto | Cifrar datos bancarios en Firestore o devolverlos únicamente vía canal seguro HTTPS, nunca en logs |
| **Trust Score sin mapeo telefónico** — El score actual no está vinculado al número WA | 🟠 Medio | Añadir campo `phoneNumber` (E.164) al modelo `UserProfile` y función de lookup |
| **Bloqueo de calendario prematuro** — La reserva puede ocupar fechas sin pago confirmado | 🟡 Bajo | El esquema actual ya distingue `PENDING_PAYMENT` vs `CONFIRMED`; usar el mismo patrón |

---

## 4. Dependencias Externas y Costos a Evaluar

Antes de iniciar el desarrollo, se deben resolver las siguientes preguntas de negocio:

1. **WhatsApp Business API (Meta):**
   - ¿El número de WA de VeneStay ya está registrado como WABA (WhatsApp Business Account)?
   - Costo por conversación iniciada por el negocio vs. por el usuario (pricing 2024 de Meta).

2. **Jelou AI:**
   - ¿Existe una cuenta activa/contrato con Jelou?
   - ¿Cuál es el límite de mensajes/conversaciones del plan actual?
   - ¿Jelou soporta Flow Buttons nativos de WhatsApp o solo texto?

3. **Firebase Cloud Functions:**
   - Verificar si el plan actual (Spark/Blaze) permite llamadas HTTP externas desde funciones.
   - El plan Blaze (Pay-as-you-go) es obligatorio para Cloud Functions con salida a Internet.

---

## 5. Hoja de Ruta Propuesta (Sprint Futuro)

> ⚠️ Esta hoja de ruta es preliminar y requiere aprobación del Project Manager antes de crear specs atómicas.

```
FASE 1 — Infraestructura de Integración (Sprint S05 ó S06)
  ├─ Crear endpoints HTTP (Cloud Functions onRequest) con HMAC Auth
  ├─ Añadir campo phoneNumber (E.164) a UserProfile
  ├─ Implementar función de lookup: phoneNumber → uid → trustScore
  └─ Crear colección whatsapp_sessions para estado conversacional

FASE 2 — Flujo Core de Reservas WA (Sprint S06 ó S07)
  ├─ Configurar Jelou: Intents de búsqueda, reserva y pago
  ├─ Implementar creación de booking desde webhook (sin UI)
  ├─ Implementar upload de comprobante desde Jelou → Firebase Storage
  └─ Conectar notificaciones al panel del anfitrión

FASE 3 — Seguridad y Calidad (Sprint S07 ó S08)
  ├─ HMAC Signature Verification en todos los webhooks
  ├─ Rate limiting por número telefónico
  ├─ Auditoría de logs de conversaciones
  └─ QA Gate completo: Trust Score, estados de reserva, expiración
```

---

## 6. Conclusión y Recomendación

El plan de comercio conversacional por WhatsApp es **estratégicamente valioso** para el mercado venezolano (alta penetración de WhatsApp, baja adopción de apps nativas) y **técnicamente factible** dado que el 70% de la lógica de negocio ya existe en VeneStay.

**La recomendación es: aprobar el plan para un sprint futuro (S05/S06)**, condicionado a:

- [ ] Confirmar cuenta activa de WhatsApp Business API (WABA) con Meta.
- [ ] Confirmar acceso a Jelou y capacidades de su API (webhooks salientes, soporte de media).
- [ ] Resolver la estrategia de identidad para huéspedes no registrados en Firebase.
- [ ] Aprobar el modelo de seguridad de los webhooks (HMAC o token estático).

Una vez despejadas estas 4 condiciones, se puede emitir la **spec atómica** del Sprint correspondiente siguiendo el protocolo SDD establecido en `AGENTS.md`.
