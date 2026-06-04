# Arquitectura y Estructura del Proyecto VeneStay v2.3.0

Este documento contiene el mapa estructural, reglas de diseño y de capas de la implementación actual de **VeneStay**. Ha sido diseñado para ser interpretado y leído de forma óptima por agentes autónomos y desarrolladores de software que se incorporen al proyecto.

---

## 1. Patrón Arquitectónico: FSD-Lite (Feature-Sliced Design)

VeneStay utiliza una versión optimizada de **Feature-Sliced Design (FSD)** adaptada para simplificar la cohesión de módulos sin añadir sobrecarga excesiva. La jerarquía de dependencias e importación sigue una dirección strictly unidireccional descendente:

```
┌────────────────────────────────────────────────────────┐
│ 1. PAGES (pages/)                                      │  ◄── Solo orquesta vistas principales.
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. FEATURES (features/)                                │  ◄── Lógica de negocio encapsulada por dominio.
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. SERVICES (services/)                                 │  ◄── Capa de integración y abstracción de Firebase.
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. SHARED / INFRA (components/, hooks/, types/, utils/)│  ◄── Utilidades generales y primitivos de UI.
└────────────────────────────────────────────────────────┘
```

### 🚫 Regla de Dependencia Absoluta
*   Un módulo de una capa superior **puede** importar de capas inferiores.
*   Un módulo de una capa inferior **NUNCA** puede importar de una capa superior (ej. un `service` no puede importar nada de `features` ni de `pages`).
*   Los módulos de la misma capa (dentro de `features/`) **no deben** cruzarse directamente. Toda interacción entre características debe orquestarse en la capa de `pages/` o mediante `hooks` inyectados.

---

## 2. Mapa del Directorio de Código (`src/`)

A continuación se detalla la estructura física del código fuente y el propósito de cada subdirectorio:

```
src/
├── App.tsx                     # Orquestación de rutas, Providers y layouts globales.
├── index.css                   # Variables de CSS personalizadas y estilos base de Tailwind.
├── index.tsx                   # Punto de entrada de React 19 y Render del DOM.
│
├── pages/                      # 1. Capa de Vistas y Orquestación
│   ├── Home.tsx                # Ficha e interfaz principal de usuario (con buscador y filtros).
│   └── HostGuide.tsx           # Panel informativo y tutorial para Anfitriones.
│
├── features/                   # 2. Capa de Negocio por Dominios
│   ├── auth/                   # Autenticación, Perfil y Pasaporte VeneStay (Trust Score).
│   ├── bookings/               # Gestión de viajes, Checkout (UCP 20/80) y listado MyTrips.
│   ├── dashboard/              # Panel del anfitrión y stepper de creación de propiedades (ListingForm).
│   ├── listings/               # Visualización de alojamientos, Ficha Detallada (ListingDetail) y Formularios de Reserva.
│   └── reviews/                # Reseñas verificadas y flujos de calificación post-estadía.
│
├── services/                   # 3. Capa de Abstracción de Datos e Integraciones
│   ├── auth-service.ts         # Envoltura del Firebase Auth SDK y gestión de sesión activa.
│   ├── booking-service.ts      # Transacciones de reservas directas e instantáneas y cálculo de fechas.
│   ├── booking-request.service # Acciones de aprobación/rechazo de solicitudes de anfitrión.
│   ├── exchange-service.ts     # Conversión de divisas e inteligencia cambiaria (USD/VES).
│   ├── gemini-service.ts       # Integración con APIs de IA (Guía Local y Asistencia).
│   ├── listing-service.ts      # Lectura y escritura de propiedades en Firestore.
│   ├── review-service.ts       # Sistema de control y confianza de valoraciones.
│   ├── storage-service.ts      # Compresión y subida de archivos (KYC e imágenes < 5MB).
│   └── user-service.ts         # Cálculo dinámico del Trust Score y datos de perfil.
│
├── components/                 # 4. Componentes Compartidos (Primitivos de UI sin Estado de Negocio)
│   └── ui/                     # Botones, entradas de texto, modales de diseño harmonioso y minimalista.
│
├── types/                      # Declaración de Interfaces Estrictas y Tipos TypeScript
│   └── index.ts                # Modelos de Booking, Listing, User, Message, Review y Payment.
│
└── utils/                      # Funciones de Soporte Puras (Sin Efecto Secundario)
    └── dates.ts                # Manipulación de fechas (con parseISO y format locales).
```

---

## 3. Modelo de Datos Clave (Tipos de Dominio en `src/types/`)

El tipado estricto es un pilar de la robustez del proyecto. Todos los flujos se rigen bajo los contratos definidos en `src/types/index.ts`:

### 📄 `Booking` (Reserva)
Representa una transacción de estadía en el sistema vacacional:
```typescript
export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  guestId: string;
  guestName: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  agreedPercentage: number; // Por defecto 20 (Para anticipo UCP)
  status: 'PENDING_PAYMENT' | 'AWAITING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED' | 'PENDING_APPROVAL' | 'EXPIRED' | 'CANCELLED_BY_GUEST';
  guests: number;
  bookingMode: 'request' | 'instant';
  guestMessage?: string;
  expiresAt: string;        # 24 horas para soft-block
  createdAt: any;
  updatedAt: any;
}
```

### 📄 `Listing` (Alojamiento)
```typescript
export interface Listing {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  pricePerNight: number;
  images: string[];
  maxGuests: number;
  hostId: string;
}
```

---

## 4. Flujo Transaccional de Reserva Directa (Request to Book)

Este diagrama conceptual ilustra cómo interactúan las capas de la arquitectura actual al procesar una solicitud de reserva directa:

```
[Usuario] ──► DirectRequestForm (features/listings)
                    │
                    ▼  (Payload tipado: DirectBookingRequestPayload)
              booking-service.ts (services/)
                    │
                    ├─► [TRANSACCIÓN ATÓMICA FIRESTORE]
                    │   ├── 1. getDocs(bookingsQuery) -> Verifica disponibilidad
                    │   └── 2. transaction.set() -> Crea documento en /bookings/ PENDING_APPROVAL
                    │
                    ▼  (Acción Post-Commit)
              Mensajería en Hilo (services/booking-service.ts)
                    ├── A. setDoc() -> Mensaje del Sistema ('system')
                    └── B. setDoc() -> Mensaje Introductorio del Huésped
```

---

## 5. Reglas de Infraestructura y Despliegue de Seguridad

1.  **Reglas de Firestore (`firestore.rules`):**
    *   Toda creación de documento (`allow create`) sobre `/bookings/` requiere autenticación y validación completa via la función auxiliar `isValidBooking(incoming())`.
    *   La lectura pública de reservas para el calendario de disponibilidad se realiza a través de consultas filtradas exclusivamente en estados activos: `['PENDING_PAYMENT', 'AWAITING_VERIFICATION', 'CONFIRMED', 'PENDING_APPROVAL']`.
2.  **Calidad y Compilación (DoD):**
    *   TypeScript estricto (`tsc --noEmit`) debe devolver `0` errores antes de proceder al despliegue.
    *   La herramienta `run-validation.cjs` automatiza la verificación estática local antes de interactuar con el entorno cloud.
