# Prompt: Rediseño UX — Módulo "Mis Viajes"
## VeneStay v2.3.0 · Spec-Driven · S04

---

## Contexto del problema

El módulo `Mis Viajes` (`/mis-viajes`) tiene un layout centrado con `max-width` que
desperdicia entre 200px y 300px de espacio en blanco en cada lado de la pantalla en
viewports de escritorio. El chat con el anfitrión está implementado como un panel
flotante superpuesto en lugar de una columna fija del layout, lo que tapa el contenido
de las tarjetas de reserva. En móvil, la vista actual no colapsa correctamente.

Antes de escribir cualquier línea de código, emite una spec atómica completa con los
criterios de aceptación. Solo entonces implementa los cambios.

---

## Bloque de verificación de contexto

Verifica que tienes acceso a los siguientes archivos antes de comenzar:

```
REQUERIDO: src/features/bookings/components/MyTrips.tsx (o la ruta equivalente)
REQUERIDO: src/features/chat/ (componentes del chat activo)
REQUERIDO: src/index.css (variables CSS del sistema de diseño)
OPCIONAL:  src/features/bookings/components/BookingCard.tsx (si existe separado)
```

Si algún archivo requerido no existe, detente e informa su ruta esperada antes de
continuar.

---

## Objetivos del rediseño

### OBJ-1: Layout de dos columnas en desktop (≥ 1024px)

Eliminar el `max-width` centrado del contenedor principal. Implementar un layout
`flex` o `grid` de dos columnas que ocupe el 100% del viewport disponible:

```
┌──────────────────────────────────┬─────────────────┐
│  Lista de reservas               │  Chat activo    │
│  (flex: 1, scroll propio)        │  (380px fijo,   │
│                                  │   sticky top)   │
│  ← ocupa todo el espacio libre → │                 │
└──────────────────────────────────┴─────────────────┘
```

Reglas de la columna izquierda:
- Ocupa todo el espacio disponible (`flex: 1` o `grid-column: 1`).
- Tiene su propio scroll vertical (`overflow-y: auto`).
- Padding horizontal interno de 24px en desktop, 16px en móvil.

Reglas de la columna derecha (chat):
- Ancho fijo de 380px, nunca flexible.
- `position: sticky; top: 0; height: 100vh` para que el chat permanezca visible
  mientras el usuario scrollea la lista de reservas.
- El chat tiene su propio scroll interno para los mensajes (`overflow-y: auto`).
- Si no hay una reserva con chat activo seleccionada, la columna muestra un estado
  vacío: icono + texto "Selecciona una reserva para ver la conversación."

### OBJ-2: Rediseño de las tarjetas de reserva

Cada `BookingCard` debe mostrar la información sin duplicación y con jerarquía clara.

**Estructura de la tarjeta (de arriba a abajo):**

```
┌─────────────────────────────────────────────────────┐
│ [Badge de estado único]              [REF: XXXXXX]  │
│ Nombre de la propiedad                              │
│ ────────────────────────────────────────────────    │
│ 📅 10 jun → 12 jun 2026    👥 2 Viajeros            │
│ ────────────────────────────────────────────────    │
│ Total: $300     Garantía (20%): $60   Saldo: $240   │
│ ────────────────────────────────────────────────    │
│ [Acción contextual según estado]   [Ver chat →]     │
└─────────────────────────────────────────────────────┘
```

Reglas de las tarjetas:
- El badge de estado aparece UNA sola vez (en el header de la tarjeta).
- Si el estado es `REJECTED`, mostrar la nota del anfitrión en una sección
  coloreada en rojo/rosa tenue, pero sin repetir el badge de estado.
- Las fechas y el número de viajeros van en una sola línea separados por `·`.
- El desglose financiero va en una sola línea compacta, no en tres filas separadas.
- El botón de acción principal (pagar, ver detalles, subir comprobante) va a la
  izquierda. El botón "Ver chat" va a la derecha como acción secundaria.
- Al hacer clic en "Ver chat", selecciona esa reserva y abre/muestra el panel de
  chat en la columna derecha — no navega a otra página.

### OBJ-3: Panel de chat rediseñado

El panel de chat (`ChatPanel` o equivalente) debe implementar:

**Header del chat:**
```
┌──────────────────────────────────────────────────┐
│ [Avatar anfitrión]  Chat con [Nombre]            │
│                     REF: 1ML0WR4M   🔒 Seguro   │
└──────────────────────────────────────────────────┘
```

**Mensajes del sistema** — cuando `message.type === 'system_*'`, no renderizar
como texto corrido. Renderizar como una tarjeta estructurada:

```
┌── SISTEMA VENESTAY ──────────────────────────────┐
│ ✅ Solicitud aprobada por el anfitrión           │
│                                                  │
│ Mensaje: "No, lamentablemente no están           │
│ disponibles."                                    │
│                                                  │
│ Método de pago habilitado:                       │
│ ┌────────────────────────────────────────────┐  │
│ │  💳 ZELLE                                  │  │
│ │  Detalles en perfil del anfitrión          │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ → Ve a 'Mis Viajes' para subir tu comprobante   │
└──────────────────────────────────────────────────┘
```

Los mensajes del usuario y del anfitrión usan burbujas estándar (ya implementadas).
Solo los mensajes de sistema necesitan este tratamiento especial.

**Input del chat:**
- Campo de texto + botón de enviar, fijo en la parte inferior del panel.
- El área de mensajes scrollea hacia arriba; el input nunca scrollea fuera de la vista.

### OBJ-4: Comportamiento responsive (móvil < 1024px)

En móvil, el layout de dos columnas colapsa a una sola columna con navegación
por tabs en la parte superior:

```
┌─────────────────────────────────────┐
│  [← Volver]   Mis Viajes           │
│  ┌──────────────┬─────────────────┐ │
│  │  Reservas ●  │     Chat        │ │  ← Tab switcher
│  └──────────────┴─────────────────┘ │
│                                     │
│  [Contenido del tab activo]         │
│                                     │
└─────────────────────────────────────┘
```

Reglas para móvil:
- El tab "Reservas" está activo por defecto.
- Al tocar "Ver chat" en una tarjeta, activa automáticamente el tab "Chat" y
  muestra la conversación de esa reserva.
- Si hay un chat con mensaje no leído, mostrar un indicador (dot naranja) en
  el tab "Chat".
- Las tarjetas en móvil tienen padding de 16px y el desglose financiero puede
  usar dos líneas si no cabe en una.
- El input del chat en móvil debe tener `position: fixed; bottom: 0` para que
  no quede tapado por el teclado virtual. Usar `env(safe-area-inset-bottom)`
  para iPhone con notch.

---

## Restricciones técnicas

- Usar exclusivamente las variables CSS del sistema de diseño definidas en
  `src/index.css`: `--color-navy: #0B1120`, `--color-gold: #C5A059`.
- No introducir nuevas dependencias de UI. Usar Tailwind CSS + Lucide React
  (ya instalados).
- La lógica de estado (reserva seleccionada, tab activo, mensajes) debe
  mantenerse en el componente padre (`MyTrips.tsx`) via `useState`, no en
  `localStorage` ni en estado global.
- El componente de chat existente debe poder ser reutilizado. Si necesita
  adaptarse para funcionar como panel fijo, extraer la lógica de mensajes
  en un hook `useChatMessages(bookingId)` en lugar de duplicar el componente.
- Cada función o componente nuevo debe tener su tipo TypeScript completo.
  Sin `any`. Sin `as unknown`.
- El scroll del panel izquierdo y el scroll del chat deben ser completamente
  independientes. Nunca usar `overflow: hidden` en el contenedor principal.

---

## Criterios de aceptación (Quality Gate)

El cambio se considera completo cuando:

- [ ] CA-01: En desktop (≥ 1024px), el layout ocupa el 100% del ancho disponible
      sin márgenes laterales vacíos visibles.
- [ ] CA-02: El panel de chat permanece visible y en posición fija mientras el
      usuario scrollea la lista de reservas.
- [ ] CA-03: Scrollear la lista de reservas no mueve el chat. Scrollear el chat
      no afecta la lista.
- [ ] CA-04: Cada tarjeta muestra el badge de estado una sola vez.
- [ ] CA-05: Los mensajes de sistema en el chat se renderizan como tarjeta
      estructurada, no como texto corrido.
- [ ] CA-06: En móvil (< 1024px), la vista muestra un tab switcher y colapsa
      a una sola columna.
- [ ] CA-07: Al tocar "Ver chat" en una tarjeta (móvil), el tab de Chat se
      activa automáticamente.
- [ ] CA-08: El input del chat en móvil no queda tapado por el teclado virtual.
- [ ] CA-09: `tsc --noEmit` sin errores.
- [ ] CA-10: `eslint .` sin errores severos.
- [ ] CA-11: Ningún color hardcodeado fuera del sistema de variables CSS.
- [ ] CA-12: Todo elemento interactivo nuevo tiene `aria-label` o `aria-describedby`.

---

## Formato de entrega esperado

1. Spec atómica completa (antes de escribir código).
2. Lista de archivos a crear o modificar con descripción del cambio.
3. Código de cada archivo, completo, listo para copiar.
4. Confirmación de criterios de aceptación cumplidos.

---

*Prompt generado por la División de Ingeniería de IA — Antigravity · Mayo 2026*
*Sprint S04 — UX Optimization · Módulo: Mis Viajes*
