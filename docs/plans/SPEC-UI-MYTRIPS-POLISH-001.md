# SPEC-UI-MYTRIPS-POLISH-001

## Spec Atómica: Polish UI & Accesibilidad — Módulo Mis Viajes

> **Generada por:** Nodo 2 — Planner (Impeccable critique `MyTrips.tsx` · score 32/40)
> **Fecha:** 2026-07-26
> **Sprint:** S05 — Admin Tools & Maintenance
> **Prioridad:** P2 (mejoras de craft y usabilidad)
> **Estado:** ESPERANDO APROBACIÓN DEL USUARIO

---

### Objetivo

Como huésped de VeneStay, quiero que el módulo Mis Viajes tenga colores de marca 100% consistentes con el sistema de diseño, accesibilidad por teclado y botones de acción limpios en móviles, para gestionar mis reservas con una experiencia de nivel fintech premium.

---

### Alcance

**Incluye:**

- **Normalización de Tokens de Color**:
  - Reemplazar clases de color hexadecimal hardcodeado `text-[#b08f23]` en `getStatusDisplay` por `text-brand-gold` / `text-amber-600`.
  - Estandarizar fondos de estado a tokens oficiales de VeneStay.
- **Accesibilidad & Touch Targets**:
  - Añadir `aria-label="Volver al inicio"` y foco visible al botón de regreso en el header de Mis Viajes.
  - Asegurar `min-h-[44px]` en los botones de acción principales y secundarios para navegación táctil fluida en viewport 375px.
- **Jerarquía y Polish Visual de Tarjetas**:
  - Homogeneizar los padding y estados hover de las tarjetas de reserva y los botones de acción (*Ver Resumen*, *Chat*, *Dejar Reseña*).

**No incluye:**

- Cambios en la lógica de Firebase Firestore, Cloud Functions ni cálculo del UCP 20/80.
- Cambios en las notificaciones del chat ni en el servicio de reseñas.

---

### Archivos Afectados

| Archivo | Capa FSD | Tipo de cambio |
| :--- | :--- | :--- |
| `src/features/bookings/components/MyTrips.tsx` | `features/bookings/components` | **MODIFICAR** (Tokens de color, accesibilidad aria-label, touch targets) |

---

### Criterios de Aceptación (QA Gate)

- [ ] **CA-1**: `MyTrips.tsx` no utiliza valores hexadecimales quemados (`text-[#b08f23]`); utiliza los tokens del sistema de diseño (`text-brand-gold`).
- [ ] **CA-2**: El botón de regreso en el header incluye `aria-label="Volver"` y foco visible por teclado.
- [ ] **CA-3**: Todos los botones interactivos dentro de las tarjetas de reserva en pantalla móvil cumplen con la altura mínima de toque (touch target ≥ 44px).
- [ ] **CA-4**: `node .agents/skills/impeccable/scripts/detect.mjs --json src/features/bookings/components/MyTrips.tsx` compila con **0 hallazgos**.
- [ ] **CA-5**: `npx tsc --noEmit` compila con **0 errores de TypeScript**.
- [ ] **CA-6**: `npm run lint` pasa con **0 errores severos**.

---

### Validación Técnica

- `node .agents/skills/impeccable/scripts/detect.mjs --json src/features/bookings/components/MyTrips.tsx`
- `npx tsc --noEmit`
- `npm run lint`
- Verificación manual en `localhost:3000/mis-viajes`
