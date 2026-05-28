# Plan de Implementación: Dashboard de Verificación de Solicitud de Reserva

## Contexto del Proyecto
| Campo | Valor |
|:---|:---|
| Sprint activo | S03 — Loyalty System + Reserva Async + Authenticator v2.0 |
| QA Gate | OK (Fases 1 a 5 de Reserva Async completadas) |
| Bloqueante | ninguno |
| Prioridad | P1 — Experiencia crítica para el flujo de negocio del anfitrión |

El anfitrión necesita inspeccionar con confianza las solicitudes de reserva (`PENDING_APPROVAL`) antes de tomar una decisión. El sistema actual en `BookingList.tsx` sólo muestra botones de aprobar/rechazar con información mínima. La solución se implementa en **5 specs atómicas** para asegurar que cada entrega sea funcional, testeable y sin regresiones.

---

## Análisis del Estado Actual

### Lo que ya existe (no se toca)
- `subscribeToUserProfile(uid, onUpdate)` — **ya implementado** en `user-service.ts`. No requiere cambios.
- `KYCStatus`, `UserProfile`, `trustScore`, `isIdentityVerified` — tipos **ya definidos** en `src/features/auth/types/index.ts`.
- `calculateCommission()` y `getCommissionTier()` — ya disponibles en `src/lib/commission`.
- `PromptDialog` y `ConfirmDialog` — ya disponibles en `src/components/ui/`.
- Detección de solapamiento de fechas — lógica **ya existe** en `BookingList.tsx` (variable `isConflicting`).

### Lo que falta (a implementar)
1. Un **hook reutilizable** `useGuestProfile` que encapsule la suscripción reactiva al perfil del huésped.
2. El **componente Drawer** `GuestRequestVerificationDrawer.tsx` con todas las secciones informativas.
3. Un **botón de acceso rápido** en la tarjeta de reserva `BookingList.tsx`.
4. La **integración** del estado del drawer en `AdminDashboard.tsx`.

---

## Decisión de Diseño Aprobada

> [!IMPORTANT]
> **Lógica de transición de estado al Aprobar:**
> El botón "Aprobar" del drawer ejecutará la misma lógica ya presente en `BookingList.tsx`:
> - Si `booking.proofUrl || booking.paymentReference` → transiciona a `AWAITING_VERIFICATION`
> - Si no hay comprobante → transiciona a `CONFIRMED`
>
> Esto no cambia el contrato de negocio, sólo centraliza la acción en el nuevo componente.

---

## Specs Atómicas (Formato BLOQUE 6 — SDD Compliant)

---

## SPEC ATÓMICA — 2026-05-28
**ID:** SPEC-DASH-01
**Sprint:** S03
**Prioridad:** P1

### Contexto
El `GuestRequestVerificationDrawer` necesitará datos reactivos del perfil del huésped desde Firestore, por lo que se requiere un hook reutilizable que encapsule el ciclo de vida del listener antes de que exista el componente que lo consume.

### Alcance
- **Capa FSD:** `features`
- **Archivo afectado:** `src/features/dashboard/hooks/useGuestProfile.ts`
- **Función / Componente:** `useGuestProfile`
- **Tipo de cambio:** CREAR

### Qué debe hacer
Recibir un `guestId` string (o null), suscribirse reactivamente al documento `users/{guestId}` en Firestore usando `subscribeToUserProfile` del servicio existente, calcular el `trustScore` con `calculateTrustScore`, y exponer `{ guestProfile, trustScore, isLoading }`. Debe limpiar el listener al desmontar o cuando cambie el `guestId`.

### Qué NO debe hacer (límites)
- No debe hacer llamadas directas a Firestore (`onSnapshot`, `getDoc`) — sólo usar `subscribeToUserProfile` del servicio.
- No debe tener ningún JSX ni lógica de renderizado.
- No debe modificar el perfil del usuario — sólo lectura.
- No debe acceder a datos de reservas (`bookings`) — sólo perfil de usuario.

### Tipos requeridos
```typescript
import { UserProfile } from '@/features/auth/types';
import { calculateTrustScore, subscribeToUserProfile } from '@/services/user-service';

interface UseGuestProfileReturn {
  guestProfile: UserProfile | null;
  trustScore: number;
  isLoading: boolean;
}
```

### Schema Zod requerido
No aplica — este hook es de sólo lectura, no procesa input del usuario hacia Firestore.

### Criterios de aceptación
- [ ] CA-1.1: Al recibir un `guestId` válido, el hook retorna el perfil del usuario desde Firestore en menos de 2 segundos.
- [ ] CA-1.2: Al cambiar `guestId`, el hook cancela el listener anterior y suscribe al nuevo sin memory leaks.
- [ ] CA-1.3: Si `guestId` es `null`, el hook retorna `guestProfile: null`, `trustScore: 0` e `isLoading: false` sin lanzar errores.
- [ ] CA-1.4: TypeScript compila sin errores (`tsc --noEmit`).
- [ ] CA-1.5: ESLint sin errores severos (`npm run lint`).

### Dependencias
- **Requiere:** `subscribeToUserProfile` en `src/services/user-service.ts` (ya existe ✅)
- **Bloquea:** SPEC-DASH-03 (no puede integrarse el Pasaporte sin este hook)

---

## SPEC ATÓMICA — 2026-05-28
**ID:** SPEC-DASH-02
**Sprint:** S03
**Prioridad:** P1

### Contexto
El anfitrión necesita un panel de inspección detallado de la solicitud antes de decidir aprobar o rechazar, ya que la tarjeta actual en `BookingList` no presenta suficiente información para tomar una decisión informada.

### Alcance
- **Capa FSD:** `features`
- **Archivo afectado:** `src/features/dashboard/components/GuestRequestVerificationDrawer.tsx`
- **Función / Componente:** `GuestRequestVerificationDrawer`
- **Tipo de cambio:** CREAR

### Qué debe hacer
Crear un panel lateral animado (`framer-motion`, slide desde la derecha) que muestre: cabecera con título del listing y referencia, badge de estado con colores, temporizador de expiración en cuenta regresiva, detalle del viaje (fechas, noches, huéspedes), alerta de solapamiento de fechas, mensaje de presentación del huésped, desglose financiero UCP 20/80, y botones de acción (Aprobar, Rechazar via `PromptDialog`, Chat). En esta fase NO incluye datos del perfil/Pasaporte del huésped (eso es SPEC-DASH-03).

### Qué NO debe hacer (límites)
- No debe llamar directamente a Firestore — sólo recibe `booking` como prop y dispara callbacks.
- No debe incluir la sección del Pasaporte del huésped en esta fase.
- No debe duplicar la lógica de `calculateCommission` — importarla desde `src/lib/commission`.
- No debe tener estado de negocio propio — sólo estado de UI (¿está abierto el `PromptDialog`?).
- No debe modificar `AdminDashboard.tsx` ni `BookingList.tsx` en esta fase.

### Tipos requeridos
```typescript
import { Booking } from '@/features/bookings/types';
import { CommissionTier } from '@/lib/commission';

interface GuestRequestVerificationDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (booking: Booking) => void;
  onReject: (booking: Booking, reason: string) => void;
  onOpenChat: (booking: Booking) => void;
  allBookings: Booking[];
  tier: CommissionTier;
}
```

### Schema Zod requerido
```typescript
// Valida el motivo de rechazo antes de disparar onReject
// Se aplica en el submit del PromptDialog interno
import { z } from 'zod';

export const rejectionReasonSchema = z.string()
  .min(10, 'El motivo debe tener al menos 10 caracteres.')
  .max(300, 'El motivo no puede superar 300 caracteres.');
```

### Criterios de aceptación
- [ ] CA-2.1: El drawer se abre con animación slide-in desde la derecha al recibir `isOpen: true`.
- [ ] CA-2.2: El drawer se cierra al presionar el overlay, el botón X, o después de confirmar Aprobar/Rechazar.
- [ ] CA-2.3: La sección de desglose financiero muestra valores correctos usando `calculateCommission(booking.totalAmount, tier)`.
- [ ] CA-2.4: La alerta de solapamiento de fechas aparece en rojo cuando otra reserva activa colisiona con las fechas de la solicitud.
- [ ] CA-2.5: El temporizador de expiración cuenta regresivamente en tiempo real (actualización cada 1 segundo).
- [ ] CA-2.6: El motivo de rechazo es validado con `rejectionReasonSchema` antes de disparar `onReject`. Si falla, se muestra un mensaje de error sin cerrar el diálogo.
- [ ] CA-2.7: Todos los botones tienen `aria-label` descriptivo (WCAG 2.2 AA).
- [ ] CA-2.8: TypeScript compila sin errores (`tsc --noEmit`).
- [ ] CA-2.9: ESLint sin errores severos (`npm run lint`).

### Dependencias
- **Requiere:** `src/lib/commission` (ya existe ✅), `PromptDialog` en `src/components/ui/` (ya existe ✅)
- **Bloquea:** SPEC-DASH-03, SPEC-DASH-04-A

---

## SPEC ATÓMICA — 2026-05-28
**ID:** SPEC-DASH-03
**Sprint:** S03
**Prioridad:** P1

### Contexto
El anfitrión necesita ver el Trust Score y el estado de identidad del huésped para tomar una decisión informada sobre su solicitud, lo que requiere integrar los datos del Pasaporte VeneStay dentro del drawer ya creado en SPEC-DASH-02.

### Alcance
- **Capa FSD:** `features`
- **Archivo afectado:** `src/features/dashboard/components/GuestRequestVerificationDrawer.tsx`
- **Función / Componente:** `GuestRequestVerificationDrawer` (sección Pasaporte)
- **Tipo de cambio:** MODIFICAR

### Qué debe hacer
Añadir la sección "Pasaporte del Huésped" al drawer usando el hook `useGuestProfile` (SPEC-DASH-01). La sección debe mostrar: avatar (con fallback de inicial), nombre, Trust Score como barra radial SVG animada con colores adaptativos por rango (< 40% rojo, 40–79% ámbar, ≥ 80% emerald), insignias de verificación (`isEmailVerified`, `isPhoneVerified`, `isIdentityVerified`), badge de estado KYC (`kycStatus`), e intereses del viajero. Mientras `isLoading` es `true`, mostrar componentes `Skeleton` en cada campo.

### Qué NO debe hacer (límites)
- No debe modificar la lógica de acciones (Aprobar/Rechazar/Chat) — sólo añadir la sección visual.
- No debe mostrar datos financieros del huésped (métodos de pago, etc.) — sólo datos de identidad y confianza.
- No debe hacer llamadas directas a Firestore — sólo consumir `useGuestProfile`.
- No debe modificar `user-service.ts` — el hook ya abstrae todo.

### Tipos requeridos
```typescript
import { useGuestProfile } from '@/features/dashboard/hooks/useGuestProfile';
// useGuestProfile recibe booking.guestId (campo que debe existir en Booking)
```

### Schema Zod requerido
No aplica — esta spec es de sólo lectura, no procesa input del usuario.

### Criterios de aceptación
- [ ] CA-3.1: La sección "Pasaporte" muestra datos reales del huésped desde Firestore cuando el drawer está abierto.
- [ ] CA-3.2: El Trust Score radial anima de 0% al valor real al montar la sección (usando `framer-motion`).
- [ ] CA-3.3: Los esqueletos `Skeleton` se muestran correctamente mientras `isLoading` es `true`.
- [ ] CA-3.4: Un huésped sin `photoURL` muestra su inicial en un avatar circular con fondo `--color-navy`.
- [ ] CA-3.5: El badge de KYC muestra `VERIFIED` en emerald, `PENDING_REVIEW` en ámbar, y `UNVERIFIED` en gris.
- [ ] CA-3.6: La sección tiene `aria-label="Pasaporte del huésped"` para lectores de pantalla (WCAG 2.2 AA).
- [ ] CA-3.7: TypeScript compila sin errores (`tsc --noEmit`).
- [ ] CA-3.8: ESLint sin errores severos (`npm run lint`).

### Dependencias
- **Requiere:** SPEC-DASH-01 (hook `useGuestProfile`) ✅, SPEC-DASH-02 (drawer base) ✅
- **Bloquea:** SPEC-DASH-04-B

---

## SPEC ATÓMICA — 2026-05-28
**ID:** SPEC-DASH-04-A
**Sprint:** S03
**Prioridad:** P1

### Contexto
El botón de acceso al drawer de verificación debe presentarse en las tarjetas de reserva con `PENDING_APPROVAL` dentro de `BookingList.tsx`, reemplazando los botones inline de Aprobar/Rechazar que presentan información insuficiente para el anfitrión.

### Alcance
- **Capa FSD:** `features`
- **Archivo afectado:** `src/features/dashboard/components/BookingList.tsx`
- **Función / Componente:** `BookingList` (bloque `PENDING_APPROVAL`)
- **Tipo de cambio:** MODIFICAR

### Qué debe hacer
Añadir la prop `onVerifyRequest: (booking: Booking) => void` a la interfaz `BookingListProps`. En el bloque condicional `booking.status === 'PENDING_APPROVAL'`, reemplazar los botones de "Aprobar Solicitud" y "Rechazar" por un único botón **"Verificar Solicitud →"** que dispara `onVerifyRequest(booking)`. El botón usa el color `--color-gold` como acento y `--color-navy` como texto. El bloque `AWAITING_VERIFICATION` (Validar Pago / Rechazar Pago) no se modifica.

### Qué NO debe hacer (límites)
- No debe importar ni renderizar `GuestRequestVerificationDrawer` — eso es responsabilidad de `AdminDashboard`.
- No debe modificar la lógica de `AWAITING_VERIFICATION`.
- No debe modificar el `PromptDialog` de rechazo ya existente — ese permanece para `AWAITING_VERIFICATION`.
- No debe añadir estado local nuevo — sólo callback prop.

### Tipos requeridos
```typescript
// Añadir a BookingListProps existente
onVerifyRequest: (booking: Booking) => void;
```

### Schema Zod requerido
No aplica — esta spec sólo añade un callback, no procesa input del usuario.

### Criterios de aceptación
- [ ] CA-4A.1: Las tarjetas `PENDING_APPROVAL` muestran el botón "Verificar Solicitud →" en lugar de los botones inline de Aprobar/Rechazar.
- [ ] CA-4A.2: Al hacer clic en el botón, se dispara `onVerifyRequest(booking)` con el objeto correcto.
- [ ] CA-4A.3: Las tarjetas `AWAITING_VERIFICATION` siguen mostrando "Validar Pago" y "Rechazar" sin cambios (sin regresión).
- [ ] CA-4A.4: El botón tiene `aria-label="Verificar solicitud de reserva"` (WCAG 2.2 AA).
- [ ] CA-4A.5: TypeScript compila sin errores (`tsc --noEmit`).
- [ ] CA-4A.6: ESLint sin errores severos (`npm run lint`).

### Dependencias
- **Requiere:** SPEC-DASH-02 (la interfaz del drawer que recibirá el booking) ✅
- **Bloquea:** SPEC-DASH-04-B (AdminDashboard necesita que BookingList exponga el callback)

---

## SPEC ATÓMICA — 2026-05-28
**ID:** SPEC-DASH-04-B
**Sprint:** S03
**Prioridad:** P1

### Contexto
El `AdminDashboard.tsx` debe orquestar el estado del drawer de verificación y conectar las acciones del drawer (aprobar, rechazar, chat) con los handlers ya existentes en el dashboard.

### Alcance
- **Capa FSD:** `features`
- **Archivo afectado:** `src/features/dashboard/components/AdminDashboard.tsx`
- **Función / Componente:** `AdminDashboard`
- **Tipo de cambio:** MODIFICAR

### Qué debe hacer
Añadir el estado `selectedBookingForVerification: Booking | null` (inicia en `null`). Pasar `setSelectedBookingForVerification` como prop `onVerifyRequest` al componente `BookingList`. Renderizar `<GuestRequestVerificationDrawer>` al final del árbol (mismo nivel que `<FloatingChat>`), conectado al estado. Conectar `onApprove` y `onReject` del drawer al `handleUpdateStatus` existente. Conectar `onOpenChat` del drawer al `setActiveChatId` / `setActiveChatBooking` existentes.

### Qué NO debe hacer (límites)
- No debe duplicar `handleUpdateStatus` — reutilizar el existente.
- No debe crear nuevas rutas ni páginas.
- No debe modificar la lógica de filtrado de reservas (`filteredBookings`).
- No debe modificar `BookingList.tsx` — eso es SPEC-DASH-04-A.

### Tipos requeridos
```typescript
// Nuevo estado
const [selectedBookingForVerification, setSelectedBookingForVerification] =
  useState<Booking | null>(null);
```

### Schema Zod requerido
No aplica — los datos fluyen hacia `handleUpdateStatus` que ya tiene su propio manejo.

### Criterios de aceptación
- [ ] CA-4B.1: Al hacer clic en "Verificar Solicitud" desde una tarjeta, el drawer se abre mostrando los datos de esa reserva específica.
- [ ] CA-4B.2: Al aprobar desde el drawer, el estado de la reserva en Firestore se actualiza y el drawer se cierra (`selectedBookingForVerification → null`).
- [ ] CA-4B.3: Al rechazar con motivo desde el drawer, el estado cambia a `REJECTED` con `rejectionReason` guardado en Firestore.
- [ ] CA-4B.4: El botón de chat en el drawer abre el `FloatingChat` existente con los datos correctos de la reserva.
- [ ] CA-4B.5: Presionar el overlay o el botón X del drawer lo cierra sin cambiar el estado de la reserva en Firestore.
- [ ] CA-4B.6: TypeScript compila sin errores (`tsc --noEmit`).
- [ ] CA-4B.7: ESLint sin errores severos (`npm run lint`).
- [ ] CA-4B.8: Flujo manual E2E completo validado (ver sección de verificación global).

### Dependencias
- **Requiere:** SPEC-DASH-03 (drawer completo) ✅, SPEC-DASH-04-A (BookingList con callback) ✅
- **Bloquea:** — (Entrega final del módulo)

---

## Diagrama de Flujo de las Specs

```
SPEC-DASH-01          SPEC-DASH-02          SPEC-DASH-03          SPEC-DASH-04-A
useGuestProfile  →  Drawer (layout)  →  Pasaporte integrado  →  BookingList (botón)
     hook               +datos reserva       +Trust Score              [MODIFICAR]
   [NUEVO]              +Schema Zod          [MODIFICAR]                    ↓
                        [NUEVO]                   ↓               SPEC-DASH-04-B
                                                  └──────────→  AdminDashboard
                                                                 (orquestación)
                                                                  [MODIFICAR]
```

---

## Verification Plan Global

### Automated (después de cada spec)
```powershell
npx tsc --noEmit
npm run lint
```

### Manual E2E (SPEC-DASH-04-B completa)
1. Como **huésped**: crear solicitud de reserva con `bookingMode === 'request'` e ingresar un mensaje de presentación personalizado.
2. Como **anfitrión**: ir a `/admin` → pestaña Reservas → encontrar la tarjeta `Solicitud Pendiente`.
3. Confirmar que la tarjeta muestra el botón **"Verificar Solicitud →"** y NO los botones inline de Aprobar/Rechazar.
4. Hacer clic → el drawer aparece deslizándose desde la derecha.
5. Validar: nombre del huésped, Trust Score (barra radial), insignias de verificación, fechas, mensaje de presentación y desglose financiero UCP.
6. Probar el botón de **Chat** → se abre `FloatingChat` correctamente.
7. Probar el botón de **Rechazar** → aparece `PromptDialog` → ingresar motivo con menos de 10 caracteres → verificar que Zod bloquea el envío con mensaje de error. Ingresar motivo válido → confirmar → estado cambia a `REJECTED`, drawer se cierra.
8. Repetir con una nueva solicitud y probar **Aprobar** → estado transiciona correctamente según la regla de negocio (con/sin comprobante).

---

## Tabla de Dependencias entre Specs

| Spec | Depende de | Bloquea |
|:---|:---|:---|
| SPEC-DASH-01 | Nada (servicios ya existen) | SPEC-DASH-03 |
| SPEC-DASH-02 | Nada (tipos y libs ya existen) | SPEC-DASH-03, SPEC-DASH-04-A |
| SPEC-DASH-03 | SPEC-DASH-01 + SPEC-DASH-02 | SPEC-DASH-04-B |
| SPEC-DASH-04-A | SPEC-DASH-02 | SPEC-DASH-04-B |
| SPEC-DASH-04-B | SPEC-DASH-03 + SPEC-DASH-04-A | — (Entrega final) |

---

## Actualización MEMORY_HOT.md requerida al iniciar implementación

Al comenzar la implementación, agregar a `docs/ai_harness/MEMORY_HOT.md`:

```markdown
| useGuestProfile (hook) | src/features/dashboard/hooks/useGuestProfile.ts | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| GuestRequestVerificationDrawer | src/features/dashboard/components/GuestRequestVerificationDrawer.tsx | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| BookingList — botón Verificar | src/features/dashboard/components/BookingList.tsx | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| AdminDashboard — orquestación drawer | src/features/dashboard/components/AdminDashboard.tsx | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
```

---

### FASE 1 — Hook de datos del huésped
**Objetivo:** Encapsular la suscripción reactiva al perfil del huésped en un hook reutilizable que gestione el ciclo de vida del listener de Firestore.

**SPEC-DASH-01 · Prioridad P1**

#### [NEW] [useGuestProfile.ts](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/hooks/useGuestProfile.ts)
- **Capa FSD:** `features/dashboard/hooks`
- **Tipo de cambio:** CREAR

**Responsabilidades:**
- Recibe `guestId: string | null | undefined`.
- Suscribe a `users/{guestId}` vía `subscribeToUserProfile` del servicio ya existente.
- Calcula el `trustScore` llamando a `calculateTrustScore(profile)` (ya existe en `user-service.ts`).
- Expone: `{ guestProfile, trustScore, isLoading }`.
- Limpia el listener con el `return` del `useEffect` al desmontar o cambiar `guestId`.

**Tipos requeridos (ya existen — sólo referenciar):**
```typescript
import { UserProfile } from '@/features/auth/types';
import { calculateTrustScore, subscribeToUserProfile } from '@/services/user-service';
```

**Criterios de aceptación Fase 1:**
- [ ] CA-1.1: Al recibir un `guestId` válido, el hook retorna el perfil del usuario desde Firestore en menos de 2 segundos.
- [ ] CA-1.2: Al cambiar `guestId`, el hook cancela el listener anterior y suscribe al nuevo.
- [ ] CA-1.3: Si `guestId` es `null`, el hook retorna `guestProfile: null` e `isLoading: false` sin errores.
- [ ] CA-1.4: `tsc --noEmit` sin errores. ESLint sin errores severos.

---

### FASE 2 — Drawer de Verificación (estructura y layout)
**Objetivo:** Construir el componente visual `GuestRequestVerificationDrawer.tsx` con el layout completo y los datos de la reserva. El perfil del huésped se integrará en la Fase 3.

**SPEC-DASH-02 · Prioridad P1**

#### [NEW] [GuestRequestVerificationDrawer.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/components/GuestRequestVerificationDrawer.tsx)
- **Capa FSD:** `features/dashboard/components`
- **Tipo de cambio:** CREAR

**Props del componente:**
```typescript
interface GuestRequestVerificationDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (booking: Booking) => void;
  onReject: (booking: Booking) => void;
  onOpenChat: (booking: Booking) => void;
  allBookings: Booking[]; // Para calcular solapamiento
  tier: CommissionTier;
}
```

**Secciones del layout (Fase 2 — datos de reserva únicamente):**

| Sección | Contenido |
|:---|:---|
| Overlay | `div` de fondo oscuro semitransparente con `onClick → onClose` |
| Cabecera | Título del listing, referencia abreviada (`REF: id.slice(0,8)`), botón cerrar |
| Badge de estado | Reutilizar la lógica de colores ya existente en `BookingList.tsx` |
| Temporizador | `CountdownTimer` extraído o reutilizado desde `BookingList.tsx` |
| Detalle del viaje | Fechas, noches calculadas, número de huéspedes |
| Alerta solapamiento | Usa la lógica `isConflicting` ya existente aplicada a `allBookings` |
| Mensaje del huésped | Cuadro ámbar premium con `booking.guestMessage` |
| Desglose financiero | Reutiliza `calculateCommission(booking.totalAmount, tier)` ya existente |
| Acciones | Aprobar (Emerald), Rechazar (Red → `PromptDialog`), Chat (MessageSquare) |

**Animación (Framer Motion):**
```typescript
// El drawer se desliza desde la derecha
variants={{ hidden: { x: '100%' }, visible: { x: 0 } }}
// El overlay hace fade-in
variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.5 } }}
```

**Criterios de aceptación Fase 2:**
- [ ] CA-2.1: El drawer se abre con animación slide-in desde la derecha al recibir `isOpen: true`.
- [ ] CA-2.2: El drawer se cierra al presionar el overlay, el botón X, o al aprobar/rechazar.
- [ ] CA-2.3: La sección de desglose financiero muestra valores correctos calculados con `calculateCommission`.
- [ ] CA-2.4: La alerta de solapamiento aparece en rojo si `isConflicting` es `true`.
- [ ] CA-2.5: El temporizador de expiración cuenta regresivamente en tiempo real.
- [ ] CA-2.6: Todos los botones tienen `aria-label` descriptivo. `tsc --noEmit` sin errores.

---

### FASE 3 — Integración del Pasaporte del Huésped
**Objetivo:** Enriquecer el drawer con los datos de identidad y confianza del huésped usando el hook `useGuestProfile` creado en la Fase 1.

**SPEC-DASH-03 · Prioridad P1**

#### [MODIFY] [GuestRequestVerificationDrawer.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/components/GuestRequestVerificationDrawer.tsx)
- **Tipo de cambio:** MODIFICAR (añadir sección de Pasaporte)

**Nueva sección "Pasaporte del Huésped"** (se inserta entre Cabecera y Detalle del Viaje):

| Elemento | Detalle |
|:---|:---|
| Avatar | `photoURL` del perfil, o inicial del nombre como fallback (fondo `--color-navy`) |
| Nombre | `guestProfile.displayName` — esqueleto `Skeleton` mientras carga |
| Trust Score | Barra radial SVG animada. Colores: `< 40%` → rojo, `40–79%` → ámbar, `≥ 80%` → emerald |
| Insignias | `isEmailVerified`, `isPhoneVerified`, `isIdentityVerified` (KYC) con íconos Lucide |
| Estado KYC | Badge con `kycStatus`: `VERIFIED` (emerald), `PENDING_REVIEW` (ámbar), `UNVERIFIED` (gris) |
| Intereses | Lista compacta de `selectedInterests` del huésped |

**Estado de carga:** Mientras `isLoading` del hook sea `true`, mostrar esqueletos (`Skeleton`) en cada campo del perfil.

**Criterios de aceptación Fase 3:**
- [ ] CA-3.1: La sección "Pasaporte" muestra datos reales del huésped desde Firestore cuando el drawer está abierto.
- [ ] CA-3.2: El Trust Score radial anima de 0% al valor real al montar la sección.
- [ ] CA-3.3: Los esqueletos de carga se muestran correctamente mientras `isLoading` es `true`.
- [ ] CA-3.4: Un huésped sin `photoURL` muestra su inicial en un avatar con fondo `--color-navy`.
- [ ] CA-3.5: `tsc --noEmit` sin errores. ESLint sin errores severos.

---

### FASE 4 — Integración en Dashboard y BookingList
**Objetivo:** Conectar el Drawer con el `AdminDashboard.tsx` y actualizar `BookingList.tsx` para que el botón "Verificar Solicitud" active el panel en lugar de mostrar las acciones inline.

**SPEC-DASH-04 · Prioridad P1**

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/components/AdminDashboard.tsx)
- **Tipo de cambio:** MODIFICAR

**Cambios:**
- Añadir estado: `const [selectedBookingForVerification, setSelectedBookingForVerification] = useState<Booking | null>(null)`
- Pasar `setSelectedBookingForVerification` a `BookingList` como prop `onVerifyRequest`.
- Renderizar `<GuestRequestVerificationDrawer>` al final del árbol de componentes (mismo nivel que `<FloatingChat>`), conectado al estado `selectedBookingForVerification`.
- `onApprove` y `onReject` del drawer invocan el `handleUpdateStatus` ya existente.
- `onOpenChat` del drawer invoca el `setActiveChatId` / `setActiveChatBooking` ya existentes.

#### [MODIFY] [BookingList.tsx](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/features/dashboard/components/BookingList.tsx)
- **Tipo de cambio:** MODIFICAR

**Cambios:**
- Añadir prop: `onVerifyRequest: (booking: Booking) => void`
- En las tarjetas con `status === 'PENDING_APPROVAL'`: reemplazar los botones de "Aprobar/Rechazar" inline por un único botón de **"Verificar Solicitud →"** (fondo `--color-gold` / `--color-navy`) que dispara `onVerifyRequest(booking)`.
- Mantener el bloque `AWAITING_VERIFICATION` (Validar Pago) sin cambios — esa acción sigue siendo directa desde la tarjeta.

**Criterios de aceptación Fase 4:**
- [ ] CA-4.1: Al hacer clic en "Verificar Solicitud" en una tarjeta `PENDING_APPROVAL`, el drawer se abre con los datos de esa reserva.
- [ ] CA-4.2: Al aprobar desde el drawer, el estado de la reserva en Firestore cambia y el drawer se cierra.
- [ ] CA-4.3: Al rechazar desde el drawer, se abre el `PromptDialog` para ingresar el motivo. Al confirmar, el estado cambia a `REJECTED` con la razón guardada.
- [ ] CA-4.4: El botón de chat en el drawer abre el `FloatingChat` existente correctamente.
- [ ] CA-4.5: Las tarjetas `AWAITING_VERIFICATION` siguen funcionando con "Validar Pago" sin regresión.
- [ ] CA-4.6: `tsc --noEmit` sin errores. `npm run lint` sin errores severos. Flujo manual E2E validado.

---

## Diagrama de Flujo de las Fases

```
FASE 1                FASE 2                FASE 3                FASE 4
useGuestProfile  →  Drawer (layout)  →  Pasaporte integrado  →  Integración Dashboard
     hook               +datos reserva       +Trust Score              +BookingList
   [NUEVO]              [NUEVO]              [MODIFICAR]           [MODIFICAR x2]

  Sin UI propia    Drawer funcional     Drawer completo        Flujo E2E completo
  Testeable solo   sin datos de         con identidad          Entrega a producción
  con unit tests   identidad aún        del huésped
```

---

## Verification Plan Global

### Automated (después de cada fase)
```powershell
npx tsc --noEmit
npm run lint
```

### Manual E2E (Fase 4 completa)
1. Como **huésped**: crear solicitud de reserva con `bookingMode === 'request'` e ingresar un mensaje de presentación personalizado.
2. Como **anfitrión**: ir a `/admin` → pestaña Reservas → encontrar la tarjeta `Solicitud Pendiente`.
3. Confirmar que la tarjeta muestra el botón **"Verificar Solicitud →"** y NO los botones inline de Aprobar/Rechazar.
4. Hacer clic → el drawer aparece deslizándose desde la derecha.
5. Validar: nombre del huésped, Trust Score (barra radial), insignias de verificación, fechas, mensaje de presentación y desglose financiero UCP.
6. Probar el botón de **Chat** → se abre `FloatingChat` correctamente.
7. Probar el botón de **Rechazar** → aparece `PromptDialog` → ingresar motivo → confirmar → estado cambia a `REJECTED`, drawer se cierra.
8. Repetir con una nueva solicitud y probar **Aprobar** → estado transiciona correctamente según la regla de negocio (con/sin comprobante).

---

## Dependencias entre Fases

| Fase | Depende de | Bloquea |
|:---|:---|:---|
| Fase 1 (hook) | Nada (servicios ya existen) | Fase 3 |
| Fase 2 (Drawer layout) | Nada (tipos y libs ya existen) | Fase 3 y 4 |
| Fase 3 (Pasaporte) | Fase 1 + Fase 2 | Fase 4 |
| Fase 4 (Integración) | Fase 2 + Fase 3 | — (Entrega final) |

---

## Decisiones de Diseño y Análisis Adicionales (28 de Mayo de 2026)

> [!NOTE]
> **1. Alineación Definitiva de la Firma `onReject`**
> Para garantizar un flujo de datos robusto y la trazabilidad del motivo de rechazo hacia Firestore, se unifica la firma del callback en todas las specs:
> * `onReject: (booking: Booking, reason: string) => void;`

> [!TIP]
> **2. Estrategia de Diálogo de Rechazo con Validación Zod**
> Dado que el componente genérico `PromptDialog.tsx` posee un sistema de validación simple de campo requerido, se implementará un **diálogo de rechazo modal inline premium** directamente dentro de `GuestRequestVerificationDrawer.tsx`. Esto permite:
> * Validar en tiempo real mediante `rejectionReasonSchema` de Zod (mínimo 10, máximo 300 caracteres).
> * Mostrar mensajes de error dinámicos y estilizados con la paleta de diseño sin acoplar ni modificar el componente compartido de la app.
> * Mantener total conformidad con las pautas de accesibilidad WCAG 2.2 AA (foco controlado por teclado, overlay accesible y tecla `Escape`).

> [!IMPORTANT]
> **3. Estado de Listo para Desarrollo (Ready to Build)**
> Las especificaciones atómicas (`SPEC-DASH-01` a `SPEC-DASH-04-B`) han sido completamente auditadas contra el pipeline SDD y se ha verificado que todos los campos requeridos (como `guestId` en `Booking`) y funciones de servicios auxiliares están disponibles. El plan está 100% listo para ser ejecutado a partir de la Fase 1.

