# SPEC-UI-MYTRIPS-POLISH-002

## Spec Atómica: Corrección de Contraste, Colores de Estado & Hover en "Dejar Reseña" — Mis Viajes

> **Generada por:** Nodo 2 — Planner (Análisis de Feedback Visual & Captura de Pantalla)
> **Fecha:** 2026-07-26
> **Sprint:** S05 — Admin Tools & Maintenance
> **Prioridad:** P1 (Legibilidad y Usabilidad Crítica)
> **Estado:** ESPERANDO APROBACIÓN DEL USUARIO

---

### Objetivo

Como huésped de VeneStay en la sección _Mis Viajes_, quiero que los estados de las reservas (especialmente "Estadía Finalizada"), las referencias `REF:` y los textos secundarios tengan un contraste alto y legible conforme a WCAG AA (≥ 4.5:1), y que al pasar el mouse sobre el botón **"Dejar Reseña"**, el icono de la estrella cambie al dorado distintivo de la marca (`#C5A059`), ofreciendo una interfaz pulida y de fácil lectura.

---

### Alcance

**Incluye:**

1. **Ajuste de Badge "Estadía Finalizada" & Colores de Estado (`MyTrips.tsx`)**:
   - Reemplazar la combinación pálida `text-brand-gold bg-brand-gold/[0.1]` por un tono dorado oscuro de alto contraste (`text-[#8a6d29] bg-[#c5a059]/15 border-[#c5a059]/40 font-black`), garantizando legibilidad clara frente al fondo blanco.
   - Ajustar los demás estados (`PENDING_APPROVAL`, `AWAITING_VERIFICATION`, `CONFIRMED`, `CANCELLED`) con combinaciones de texto oscuro sobre fondo claro de alto contraste.

2. **Corrección de Opacidad de Textos Secundarios (`MyTrips.tsx`)**:
   - **`REF: xxx`**: Cambiar `text-gray-300` (ilegible) a `text-slate-600 font-bold`.
   - **Fechas y Viajeros**: Cambiar `text-gray-400/500` a `text-slate-700 font-semibold` con iconos en `text-slate-500`.
   - **Etiquetas Financieras**: Cambiar `text-[8px] text-gray-400` a `text-[9px] text-slate-600 font-extrabold uppercase`.

3. **Micro-interacción Hover en Botón "Dejar Reseña" (`MyTrips.tsx`)**:
   - Al pasar el cursor (`hover`) sobre el botón _Dejar Reseña_, el icono `<Star>` debe transformarse/iluminarse en dorado distintivo (`text-brand-500 fill-brand-500 transition-colors duration-200`).

**No incluye:**

- Cambios en las funciones backend de Firestore ni en la API de reservas.

---

### Archivos Afectados

| Archivo                                        | Capa FSD                       | Tipo de cambio                                                              |
| :--------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------- |
| `src/features/bookings/components/MyTrips.tsx` | `features/bookings/components` | **MODIFICAR** (Contraste de textos, badge de estado, hover en botón reseña) |

---

### Criterios de Aceptación (QA Gate)

- [ ] **CA-1**: El badge "ESTADÍA FINALIZADA" es claramente diferenciable visualmente con un tono dorado oscuro legible de alto contraste.
- [ ] **CA-2**: El texto `REF: [CÓDIGO]` es perfectamente legible (no se ve opaco ni desvanecido).
- [ ] **CA-3**: Las fechas, cantidad de viajeros y etiquetas de desglose (Total, Garantía, Saldo) se leen sin esfuerzo con contraste WCAG AA (≥ 4.5:1).
- [ ] **CA-4**: Al hacer hover sobre el botón "Dejar Reseña", la estrella cambia al color dorado característico (`text-brand-500 fill-brand-500`).
- [ ] **CA-5**: `node .agents/skills/impeccable/scripts/detect.mjs --json src/features/bookings/components/MyTrips.tsx` pasa con **0 hallazgos**.
- [ ] **CA-6**: `npx tsc --noEmit` compila con **0 errores de TypeScript**.
- [ ] **CA-7**: `npm run lint` pasa sin errores severos.

---

### Validación Técnica

- `node .agents/skills/impeccable/scripts/detect.mjs --json src/features/bookings/components/MyTrips.tsx`
- `npx tsc --noEmit`
- `npm run lint`
