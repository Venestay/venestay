# Prompt: Filtro de Historial — Módulo "Mis Viajes"
## VeneStay v2.3.0 · Sprint S04

---

## Contexto

El módulo `Mis Viajes` ya tiene el layout de dos columnas implementado.
La columna izquierda muestra todas las reservas bajo el título estático
"VIAJES ACTIVOS Y RECIENTES". Hay espacio horizontal suficiente en esa
barra de título para convertirla en una fila de filtros funcional.

El objetivo es separar las reservas en dos grupos lógicos basados en
antigüedad y estado, sin añadir altura extra ni cambiar el layout existente.

---

## Regla de negocio: qué va en cada filtro

```
ACTIVOS (default)
  Reservas con updatedAt o createdAt dentro de las últimas 48 horas,
  O reservas con status: PENDING_APPROVAL | PENDING_PAYMENT |
  AWAITING_VERIFICATION | CONFIRMED (con check-in futuro).

  Incluye también cualquier reserva con chat no leído,
  independientemente de su antigüedad.

HISTORIAL
  Reservas con updatedAt > 48 horas atrás
  Y status: CONFIRMED (check-in pasado) | REJECTED | EXPIRED |
  CANCELLED_BY_GUEST.

  Son reservas que ya no requieren acción del usuario.
```

**Regla especial de chat no leído:** si una reserva de más de 48 horas
tiene mensajes no leídos, aparece en ACTIVOS hasta que el usuario los lea.
Esto evita que mensajes importantes queden enterrados en el historial.

---

## Cambio de UI — reemplazar el título estático por una barra de filtros

El header actual:
```
VIAJES ACTIVOS Y RECIENTES
```

Reemplazarlo por:
```
┌─────────────────────────────────────────────────────────────────┐
│  [Activos  N]    [Historial  N]             [🔍 Buscar reserva] │
└─────────────────────────────────────────────────────────────────┘
```

Especificación visual:

- Los filtros son tabs tipo pill, no tabs con línea inferior.
- El tab activo: fondo `var(--color-navy)` + texto blanco.
- El tab inactivo: fondo transparente + texto `text-secondary` + borde `border-tertiary`.
- Los contadores `N` muestran el número de reservas en cada grupo.
  Si el grupo HISTORIAL tiene 0 reservas, el tab existe pero el contador no aparece.
- El buscador `🔍 Buscar reserva` es un `<input>` compacto que filtra por nombre
  de propiedad o número de referencia dentro del tab activo.
  En móvil el buscador colapsa a un icono que expande el campo al tocar.
- En móvil (< 1024px) los tres elementos van en dos filas:
  fila 1 → tabs | fila 2 → buscador (ancho completo).

---

## Comportamiento del filtro

```typescript
// Lógica de clasificación (hook useTripFilters)

const ACTIVOS_HOURS = 48;

function classifyBooking(booking: Booking, hasUnreadChat: boolean): 'activos' | 'historial' {
  const now = Date.now();
  const updatedMs = new Date(booking.updatedAt).getTime();
  const hoursAgo = (now - updatedMs) / (1000 * 60 * 60);

  const terminalStatuses = ['CONFIRMED_PAST', 'REJECTED', 'EXPIRED', 'CANCELLED_BY_GUEST'];
  const isTerminal = terminalStatuses.includes(booking.status);

  // Chat no leído → siempre activo
  if (hasUnreadChat) return 'activos';

  // Reserva terminal y antigua → historial
  if (isTerminal && hoursAgo > ACTIVOS_HOURS) return 'historial';

  return 'activos';
}
```

**Transición animada al cambiar de tab:**
- Las tarjetas entran con `opacity: 0 → 1` + `translateY(4px → 0)` en 150ms.
- Usar `framer-motion` (ya instalado) con `AnimatePresence` para la transición.

**Estado vacío de cada tab:**
- ACTIVOS vacío: `"No tienes reservas activas en este momento."` + icono `ti-calendar-off`.
- HISTORIAL vacío: `"Tu historial de reservas aparecerá aquí."` + icono `ti-history`.

---

## Hook requerido: `useTripFilters`

```typescript
// src/features/bookings/hooks/useTripFilters.ts

interface TripFiltersResult {
  activeTab: 'activos' | 'historial';
  setActiveTab: (tab: 'activos' | 'historial') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredBookings: Booking[];
  activosCount: number;
  historialCount: number;
}

export function useTripFilters(
  bookings: Booking[],
  unreadChatMap: Record<string, boolean>
): TripFiltersResult;
```

El hook mantiene el tab seleccionado en `sessionStorage` (no `localStorage`)
para que al volver a la página en la misma sesión recuerde el filtro, pero
no lo persista entre sesiones donde el estado puede haber cambiado.

La búsqueda filtra por:
- `booking.listingTitle` (nombre de la propiedad, insensible a mayúsculas)
- `booking.id` (últimos 8 caracteres, que es el REF visible)

---

## Modificaciones de componentes

### [MODIFY] `MyTrips.tsx`

- Importar `useTripFilters`.
- Reemplazar el título estático por el componente `TripFilterBar`.
- Pasar `filteredBookings` en lugar de `bookings` al listado de tarjetas.

### [NEW] `TripFilterBar.tsx`

```
src/features/bookings/components/TripFilterBar.tsx
```

Props:
```typescript
interface TripFilterBarProps {
  activeTab: 'activos' | 'historial';
  onTabChange: (tab: 'activos' | 'historial') => void;
  activosCount: number;
  historialCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}
```

### [NEW] `useTripFilters.ts`

```
src/features/bookings/hooks/useTripFilters.ts
```

---

## Criterios de aceptación

- [ ] CA-01: Las reservas con `updatedAt` > 48h y estado terminal aparecen
      solo en el tab HISTORIAL, no en ACTIVOS.
- [ ] CA-02: Una reserva con chat no leído aparece en ACTIVOS aunque tenga
      más de 48 horas de antigüedad.
- [ ] CA-03: El contador de cada tab refleja el número real de reservas en ese grupo.
- [ ] CA-04: La búsqueda filtra correctamente por nombre de propiedad y REF.
- [ ] CA-05: Cambiar de tab anima las tarjetas (150ms, opacity + translateY).
- [ ] CA-06: En móvil el buscador ocupa el ancho completo en su propia fila.
- [ ] CA-07: El tab activo se recuerda al navegar hacia atrás y volver a la página.
- [ ] CA-08: `tsc --noEmit` sin errores.
- [ ] CA-09: El layout existente (dos columnas, chat fijo) no fue afectado.
- [ ] CA-10: No se introdujeron nuevas dependencias npm.

---

*Sprint S04 · Módulo: Mis Viajes · Feature: Trip History Filter*
*División de Ingeniería de IA — Antigravity · Mayo 2026*
