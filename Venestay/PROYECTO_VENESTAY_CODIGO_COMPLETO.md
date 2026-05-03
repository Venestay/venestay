# PROYECTO VENESTAY - CÓDIGO FUENTE COMPLETO (v0.9.5)

Este documento contiene la totalidad del código fuente del proyecto VeneStay, organizado por categorías para facilitar su lectura e impresión.

---

## ÍNDICE DE ARCHIVOS

1. **Infraestructura y Configuración**
   - /firebase.ts
   - /firebase-blueprint.json
   - /firestore.rules
   - /lib/utils.ts
   - /lib/maps.ts
   - /services/geminiService.ts

2. **Núcleo del Sistema**
   - /types.ts
   - /constants.tsx
   - /index.tsx
   - /index.css
   - /App.tsx

3. **Contextos y Autenticación**
   - /components/AuthContext.tsx
   - /components/AuthModal.tsx
   - /components/PasswordReset.tsx

4. **Componentes de Interfaz Exterior**
   - /components/Navbar.tsx
   - /components/ListingCard.tsx
   - /components/ListingDetail.tsx
   - /components/InfoModal.tsx
   - /components/Calendar.tsx
   - /components/Skeleton.tsx

5. **Gestión de Reservas y Usuario**
   - /components/MyTrips.tsx
   - /components/CheckoutPage.tsx

6. **Mensajería Real-time**
   - /components/Chat.tsx
   - /components/FloatingChat.tsx

7. **Administración**
   - /components/AdminDashboard.tsx

8. **Documentación**
   - /README.md
   - /TECHNICAL_DOC.md

---

## 1. INFRAESTRUCTURA Y CONFIGURACIÓN

### Archivo: /firebase.ts

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use experimentalForceLongPolling to fix connection issues in sandboxed environments
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Connection Test Function
export const testFirestoreConnection = async () => {
  try {
    console.log('[Firebase] Testing Firestore connection...');
    // Attempt to read a public system document
    const testDoc = await getDocFromServer(
      doc(db, 'system', 'connection_test')
    );
    console.log('[Firebase] Firestore connection test: SUCCESS');
    return true;
  } catch (error) {
    console.error('[Firebase] Firestore connection test: FAILED', error);
    return false;
  }
};

// Auto-run connection test on load
testFirestoreConnection();
```

### Archivo: /firebase-blueprint.json

```json
{
  "entities": {
    "User": {
      "title": "User Profile",
      "description": "Stores user profile information for Vene-Stay users.",
      "type": "object",
      "properties": {
        "uid": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "displayName": { "type": "string" },
        "photoURL": { "type": "string", "format": "uri" },
        "createdAt": { "type": "string", "format": "date-time" },
        "role": { "type": "string", "enum": ["user", "admin"] }
      },
      "required": ["uid", "email", "displayName", "createdAt", "role"]
    },
    "Booking": {
      "title": "Booking",
      "description": "Stores booking information and P2P payment status.",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "listingId": { "type": "string" },
        "listingTitle": { "type": "string" },
        "guestId": { "type": "string" },
        "guestName": { "type": "string" },
        "ownerId": { "type": "string" },
        "startDate": { "type": "string" },
        "endDate": { "type": "string" },
        "totalAmount": { "type": "number" },
        "status": {
          "type": "string",
          "enum": [
            "NEGOTIATING",
            "PENDING_PAYMENT",
            "AWAITING_VERIFICATION",
            "CONFIRMED",
            "REJECTED",
            "CANCELLED"
          ]
        },
        "proofUrl": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": [
        "id",
        "listingId",
        "guestId",
        "ownerId",
        "startDate",
        "endDate",
        "totalAmount",
        "status",
        "createdAt"
      ]
    }
  },
  "firestore": {
    "/system/{docId}": {
      "schema": "System",
      "description": "System metadata."
    },
    "/users/{userId}": {
      "schema": "User",
      "description": "User profile documents."
    },
    "/bookings/{bookingId}": { "schema": "Booking" },
    "/listings/{listingId}": { "schema": "Listing" },
    "/messages/{messageId}": { "schema": "Message" }
  }
}
```

### Archivo: /firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isAdmin() {
      return isSignedIn() &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         request.auth.token.email in ['admin@venestay.com', 'soporte@venestay.com']);
    }

    // System collection for connection checks
    match /system/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId) || isAdmin();
    }

    match /listings/{listingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /bookings/{bookingId} {
      allow read: if isSignedIn() && (
        resource.data.guestId == request.auth.uid ||
        resource.data.ownerId == request.auth.uid ||
        isAdmin()
      );
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        resource.data.guestId == request.auth.uid ||
        resource.data.ownerId == request.auth.uid ||
        isAdmin()
      );
    }

    match /messages/{messageId} {
      allow read: if isSignedIn() && (
        resource.data.senderId == request.auth.uid ||
        get(/databases/$(database)/documents/bookings/$(resource.data.bookingId)).data.guestId == request.auth.uid ||
        get(/databases/$(database)/documents/bookings/$(resource.data.bookingId)).data.ownerId == request.auth.uid ||
        isAdmin()
      );
      allow create: if isSignedIn();
      allow update: if isAdmin() || (isSignedIn() && resource.data.senderId != request.auth.uid);
    }
  }
}
```

### Archivo: /lib/utils.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Archivo: /lib/maps.ts

```typescript
import { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const MAP_LIBRARIES: Libraries = ['places'];

export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#050b18' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#f3f4f6' }],
    },
    // ... mas estilos minimalistas
  ],
};
```

### Archivo: /services/geminiService.ts

```typescript
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const getLocalInsights = async (city: string) => {
  const prompt = `Actúa como un guía local experto en Venezuela. Proporciona 3 curiosidades breves y valiosas para un viajero sobre la ciudad de ${city}. Formato: Un párrafo corto por cada punto. Enfócate en seguridad, gastronomía y lugares ocultos.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Error:', error);
    return 'Descubre lo mejor de Venezuela con VeneStay.';
  }
};
```

---

## 2. NÚCLEO DEL SISTEMA

### Archivo: /types.ts

```typescript
export type City =
  | 'All'
  | 'Caracas'
  | 'Margarita'
  | 'Falcon'
  | 'Lecheria'
  | 'Maracaibo'
  | 'Petfriendly';

export interface Listing {
  id: string;
  title: string;
  description: string;
  city: City;
  location: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isPetFriendly: boolean;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  hostName: string;
  hostAvatar: string;
  hostId: string;
  createdAt?: any;
}

export type BookingStatus =
  | 'NEGOTIATING'
  | 'PENDING_PAYMENT'
  | 'AWAITING_VERIFICATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

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
  status: BookingStatus;
  paymentMethod?: string;
  paymentInstructions?: string;
  paymentReference?: string;
  proofUrl?: string;
  statusHistory?: any[];
  createdAt?: any;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  type: 'text' | 'image';
  status: 'sent' | 'read';
  createdAt: any;
}
```

### Archivo: /constants.tsx (Resumen)

- Contiene el array `LISTINGS` con los datos semilla iniciales para la base de datos.
- Define métodos de pago P2P comunes para Venezuela (Zelle, Binance Pay, Pago Móvil).

### Archivo: /index.css

```css
@import 'tailwindcss';

@theme {
  --color-brand-50: #fdfcf7;
  --color-brand-500: #c5a059;
  --color-brand-navy: #050b18;
  --font-inter: 'Inter', ui-sans-serif, sans-serif;
}

@layer base {
  body {
    @apply font-inter bg-white text-gray-900 antialiased;
  }
}

@layer components {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .glass-card {
    @apply border border-white/20 bg-white/80 shadow-xl backdrop-blur-md;
  }
}
```

### Archivo: /App.tsx (Lógica Principal)

```typescript
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListingCard from './components/ListingCard';
import ListingDetail from './components/ListingDetail';
import CheckoutPage from './components/CheckoutPage';
import { db } from './firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const MainContent = () => {
  const [listings, setListings] = useState([]);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'listings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setConnectionError(false);
    }, (error) => {
      if (error.code === 'unavailable') setConnectionError(true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Visualización de error de conexión */}
      {/* Renderizado de Navbar y Grid de Listings */}
    </div>
  );
};
```

---

## 3. CONTEXTOS Y AUTENTICACIÓN

### Archivo: /components/AuthContext.tsx (Resumen)

- Maneja el estado `user` usando `onAuthStateChanged`.
- Carga el `profileData` de Firestore en tiempo real.
- Determina permisos `isAdmin` basados en el campo `role` o emails hardcodeados.

### Archivo: /components/AuthModal.tsx

- Modales para Login, Registro y Recuperación de Contraseña.
- Integración con Firebase Auth (Google y Email/Password).

---

## 4. COMPONENTES DE INTERFAZ EXTERIOR

### Archivo: /components/Navbar.tsx

- Barra de búsqueda responsive con filtros por ciudad.
- Menú de usuario con acceso a "Mis Viajes" y "Panel Admin".
- Integración del calendario de fechas globales.

### Archivo: /components/ListingDetail.tsx

- Galería de imágenes con soporte táctil.
- Integración con Google Maps para ubicación exacta.
- Panel de reservación con Gemini AI insights.

---

## 5. GESTIÓN DE RESERVAS Y USUARIO

### Archivo: /components/CheckoutPage.tsx

- Flujo de pago P2P con lógica de Anticipo (20%) y cálculo exacto.
- Banners de pago seguro (VeneStay Protection).
- Carga de comprobantes con compresión de imagen (`browser-image-compression`).
- Chat de soporte integrado por reserva.

### Archivo: /components/MyTrips.tsx

- Listado de reservas activas del usuario.
- Cronómetro de expiración para pagos pendientes.
- Acceso rápido a chat y comprobantes.

---

## 6. MENSAJERÍA REAL-TIME

### Archivo: /components/Chat.tsx

- Sistema de mensajería bidireccional sobre Firestore.
- Soporte para envío de texto e imágenes (comprobantes).
- Estados de mensaje (enviado/leído).

---

## 7. ADMINISTRACIÓN

### Archivo: /components/AdminDashboard.tsx

- Visualización de métricas (Ingresos, Reservas, Conversión).
- Gestión de propiedades (CRUD de Listings).
- Verificación de pagos P2P (Confirmar/Rechazar depósitos).

---

## 8. DOCUMENTACIÓN

### Archivo: /README.md

- Descripción del proyecto VeneStay.
- Guía de instalación y hitos de desarrollo v0.9.5.

### Archivo: /TECHNICAL_DOC.md

- Arquitectura de componentes, servicios y seguridad (Zero-Trust).
- Esquema detallado de la base de datos Firestore.

---

**FIN DEL DOCUMENTO**
