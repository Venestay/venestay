# Mapa de Integración: Módulo Pasaporte VeneStay
**Versión**: 1.0 | **Fecha**: 2026-05-16 | **Estado**: Pre-refactorización v2.2

> Este documento analiza TODOS los puntos de contacto del módulo Pasaporte (`ProfileSettings`, `UserProfile`, `trustScore`, `paymentMethods`, etc.) con el resto de la plataforma. Debe leerse ANTES de ejecutar cualquier sprint de refactorización o funcionalidades marketplace.

---

## 1. Mapa de Dependencias Actuales

```
AuthContext (fuente de verdad global)
    │
    ├─► Navbar.tsx              → photoURL, displayName, avatar
    ├─► AdminDashboard.tsx      → role, isVerified, commissionTier
    ├─► ListingDetail.tsx       → displayName (como guestName al reservar)
    ├─► CheckoutPage.tsx        → profileData completo, paymentMethods, checkProfileCompletion
    ├─► UserProfileSetup.tsx    → profileData completo (duplica lógica de ProfileSettings)
    └─► ProfileSettings.tsx     → PROPIETARIO del Pasaporte (lectura/escritura)
```

### Diagrama de flujo de datos del Perfil

```
Firestore /users/{uid}
        │
        ▼
authService.subscribeToProfile()  ← auth-service.ts
        │
        ▼
AuthContext.profileData  (suscripción reactiva en tiempo real)
        │
        ├──► useAuth()  →  6 componentes consumidores
        │
        └──► useUserProfile()  →  ProfileSettings  (suscripción paralela DUPLICADA)
                                   └─► user-service.ts
```

> ⚠️ **PROBLEMA DETECTADO**: Hay **dos suscripciones paralelas a Firestore** para el mismo documento. `AuthContext` y `useUserProfile` abren listeners independientes. Esto es deuda técnica que el plan de integración debe resolver.

---

## 2. Inventario de Consumidores del Perfil

### 2.1 Navbar (`src/components/ui/Navbar.tsx`)

| Campo consumido | Uso | Impacto si cambia |
|:---|:---|:---:|
| `profileData.photoURL` | Avatar del menú desplegable | Alto |
| `profileData.displayName` | Nombre en el menú | Alto |
| `user.photoURL` (fallback) | Si no hay foto en Firestore | Medio |

**Brecha actual**: El Navbar NO enlaza a `/perfil` ni al Pasaporte. La opción "Mi Perfil" va a `/dashboard`. El usuario no puede acceder directamente al Pasaporte desde el menú principal.

---

### 2.2 AdminDashboard (`src/features/dashboard/components/AdminDashboard.tsx`)

| Campo consumido | Uso | Impacto si cambia |
|:---|:---|:---:|
| `profileData.role` | Determina si el usuario es `host` | Crítico |
| `profileData.isVerified` | Calcula `commissionTier` (8% vs 12%) | Crítico |
| `profileData.isVerified` | Muestra badge en `StatsCards` | Medio |

**Brecha actual**: El `commissionTier` se calcula con `isVerified` (campo booleano genérico), pero la verificación real es `isIdentityVerified` (KYC). Estos dos campos no están sincronizados.

---

### 2.3 CheckoutPage (`src/features/bookings/components/checkout/CheckoutPage.tsx`)

| Campo consumido | Uso | Impacto si cambia |
|:---|:---|:---:|
| `profileData` completo | `checkProfileCompletion()` para gate de reserva | Crítico |
| `listing.paymentMethods` | Selector del método de pago al reservar | Crítico |
| `profileData.currency` | No consumido actualmente — **campo huérfano** | Bajo |

**Brecha crítica**: El Checkout usa `listing.paymentMethods` (métodos del **host/alojamiento**), no los `paymentMethods` del **perfil del huésped**. Son dos colecciones diferentes:

```
UserProfile.paymentMethods  → Cómo el HUÉSPED quiere pagar
Listing.paymentMethods      → Cómo el HOST acepta pagos
```

En el flujo actual, el huésped elige el método de pago del HOST, no el suyo. El campo `UserProfile.paymentMethods` está almacenado pero **nunca se usa en el checkout**. Es deuda funcional mayor.

---

### 2.4 ListingDetail (`src/features/listings/components/ListingDetail.tsx`)

| Campo consumido | Uso | Impacto si cambia |
|:---|:---|:---:|
| `profileData.displayName` | Se usa como `guestName` al crear la reserva | Crítico |

**Brecha actual**: Si el usuario no tiene `displayName` en su Pasaporte, la reserva se crea con `'Huésped'` como nombre. Esto rompe la trazabilidad en el Dashboard del admin.

---

### 2.5 UserProfileSetup (`src/features/auth/components/UserProfileSetup.tsx`)

**Situación**: Es un componente paralelo a `ProfileSettings` que **duplica** parte de su funcionalidad. Maneja el perfil desde la pestaña del Dashboard (`activeTab === 'profile'`).

| Funcionalidad | ProfileSettings | UserProfileSetup |
|:---|:---:|:---:|
| Editar nombre/bio | ✅ | ✅ |
| Foto de avatar | ✅ (botón inactivo) | ✅ (funcional) |
| Idiomas | ✅ | ✅ |
| Pasaporte/Trust Score | ✅ | ❌ |
| Métodos de pago | ✅ | ❌ |
| KYC Verificación | ✅ | ❌ |

**Deuda técnica**: Dos componentes mantienen el mismo perfil de usuario de forma desincronizada.

---

### 2.6 checkProfileCompletion (función utilitaria)

**Archivo**: `src/lib/user-utils.ts`

Consumida por: `UserProfileSetup`, `CheckoutPage`, `ListingDetail`

```typescript
// Evalúa: photoURL + phoneNumber + about  →  max 100%
// NO evalúa: trustScore, isIdentityVerified, paymentMethods
```

**Brecha crítica**: La función `checkProfileCompletion` (en `user-utils.ts`) y `calculateTrustScore` (en `user-service.ts`) usan **campos distintos** y producen **porcentajes distintos**. El Checkout bloquea al usuario basándose en `checkProfileCompletion`, mientras que el Pasaporte muestra `trustScore`. El usuario ve dos números de "completitud" diferentes.

---

## 3. Ruta Actual del Pasaporte

```
/test-profile → ProfileSettings.tsx  (sin protección de autenticación)
/dashboard    → AdminDashboard → [tab=profile] → UserProfileSetup.tsx
```

**Problema**: La ruta `/test-profile` es un artefacto de desarrollo. No tiene `ProtectedRoute`, cualquier visitante puede acceder. No existe una ruta canónica limpia como `/perfil` o `/mi-cuenta`.

---

## 4. Plan de Integración por Fase

### Fase A: Pre-condición (durante refactorización v2.2)

Estas acciones deben hacerse mientras se ejecutan los Sprints 1-3 de refactorización para no crear más deuda.

| Tarea | Archivo | Prioridad |
|:---|:---|:---:|
| Unificar `checkProfileCompletion` y `calculateTrustScore` en un único `getProfileScore()` en `user-service.ts` | `user-utils.ts` + `user-service.ts` | Alta |
| Eliminar la suscripción duplicada de `useUserProfile` — usar solo `AuthContext.profileData` | `useUserProfile.ts` | Alta |
| Eliminar `SavedPaymentMethod` (interfaz muerta en `ProfileSettings`) | `ProfileSettings.tsx` | Baja |

---

### Fase B: Post-funcionalidades Marketplace (Sprint 4+)

Estas integraciones se ejecutan después de que el Pasaporte sea funcionalmente completo.

#### B.1 Routing — Ruta canónica del Pasaporte

**Cambio en `App.tsx`**:
```
// QUITAR:
<Route path="/test-profile" element={<ProfileSettings />} />

// AGREGAR:
<Route path="/mi-pasaporte" element={
  <ProtectedRoute>
    <ProfileSettings />
  </ProtectedRoute>
} />
```

#### B.2 Navbar — Enlace directo al Pasaporte

El menú de usuario debe incluir acceso directo:
```
Mi Perfil  →  /mi-pasaporte  (en lugar de /dashboard)
```

Considerar también un indicador visual si el Trust Score es bajo (ej. badge naranja en el avatar).

#### B.3 Checkout — Gate de reserva unificado

Reemplazar la llamada a `checkProfileCompletion` en `CheckoutPage` por `calculateTrustScore`, con un umbral mínimo definido (ej. `trustScore >= 40`).

Mostrar al huésped qué le falta completar en su Pasaporte para poder reservar, con un link a `/mi-pasaporte`.

#### B.4 ListingDetail — Mostrar perfil del anfitrión

Cuando el huésped ve el detalle del alojamiento, puede ver el perfil público del host. Esto requiere la **Vista Pública** del Pasaporte (actualmente cosmética).

#### B.5 AdminDashboard — Sincronizar isVerified con isIdentityVerified

```typescript
// ACTUAL (incorrecto):
const currentTier = profileData?.isVerified ? 8 : 12;

// CORRECTO:
const currentTier = profileData?.isIdentityVerified ? 8 : 12;
```

#### B.6 UserProfileSetup — Decisión arquitectónica

Dos opciones:
1. **Absorber**: `UserProfileSetup` se elimina y el Dashboard usa `ProfileSettings` como la tab de perfil.
2. **Especializar**: `UserProfileSetup` queda para el onboarding inicial (nuevo usuario), `ProfileSettings` para el Pasaporte completo.

> **Recomendación**: Opción 2 (Especializar) — menos riesgo de regresión y flujo de UX más claro.

---

## 5. Checklist de Integración Completa

### Antes de refactorizar (Fase A)
- [ ] Unificar funciones de scoring de perfil
- [ ] Eliminar suscripción Firestore duplicada en `useUserProfile`
- [ ] Eliminar tipos locales duplicados en `ProfileSettings`

### Después de funcionalidades marketplace (Fase B)
- [ ] Ruta `/mi-pasaporte` con `ProtectedRoute`
- [ ] Navbar enlaza al Pasaporte
- [ ] Checkout usa `trustScore` como gate, no `checkProfileCompletion`
- [ ] `isVerified` → `isIdentityVerified` en AdminDashboard
- [ ] Vista pública funcional del Pasaporte para hosts
- [ ] Decisión tomada sobre `UserProfileSetup` vs `ProfileSettings`

---

## 6. Orden de Ejecución Recomendado

```
[AHORA]       Fase A (limpieza pre-refactorización)
     ↓
[Sprint 1-3]  Refactorización v2.2 (arquitectura + componentes + VFX)
     ↓
[Sprint 4]    Funcionalidades marketplace (avatar, KYC real, eliminar pago, vista pública)
     ↓
[Fase B]      Integración completa con el ecosistema (routing, checkout gate, navbar, dashboard)
     ↓
[PRODUCCIÓN]  Lanzamiento Lechería con Pasaporte completamente integrado
```

---

*Documento generado por análisis estático de código. Última revisión: 2026-05-16.*
