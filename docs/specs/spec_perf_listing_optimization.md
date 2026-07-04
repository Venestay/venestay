# SPEC ATÓMICA — Optimización de Enrutamiento y Red en Listings

**ID:** SPEC-PERF-LISTING-OPTIMIZATION-001  
**Sprint:** S05 — Admin Tools & Maintenance  
**Prioridad:** P0 (Quick Win de Enrutamiento & Reducción de Red)  
**Autor:** Antigravity AI (Planner Node)  
**Estado:** PENDIENTE DE APROBACIÓN  
**Fecha:** 2026-07-04  

---

## Contexto

La auditoría de rendimiento E2E (`PERF-LISTING-LOAD-001`) reveló que el 80% del tiempo de carga al pasar del Home al detalle de un alojamiento (1,787 ms de 2,225 ms totales) se desperdicia en un cuello de botella de enrutamiento indirecto. Las tarjetas de alojamiento (`ListingCard`) enlazan a la ruta heredada `/?listingId=:id`, lo que provoca que el navegador recargue el Home, consulte el listado en vivo a Firestore (~1,000 ms) y recién entonces ejecute un `navigate('/listing/:id')`. 

Adicionalmente, se detectó que cada tarjeta (`ListingCard`) ejecuta incondicionalmente el hook `useBcvRate()`, generando múltiples peticiones HTTP concurrentes e innecesarias a `dolarapi.com` durante la carga del listado, a pesar de que la visualización de precios en BCV está desactivada (`HIDE_BCV_PRICES === true`).

---

## Alcance

- **Capa FSD:** `features`
- **Archivos afectados:**
  - [ListingCard.tsx](file:///c:/Proyecto%20Venestay/VeneStay/src/features/listings/components/ListingCard.tsx)
- **Función / Componente:** Componente `ListingCard`
- **Tipo de cambio:** MODIFICAR / OPTIMIZAR

---

## Qué debe hacer

1. **Optimización de Enrutamiento en `ListingCard.tsx`:**
   - Reemplazar en el componente `<Link>` el atributo `to={`/?listingId=${listing.id}`}` por `to={`/listing/${listing.id}`}`.
   - En el manejador de clic del botón flotante *"Explorar Estancia"*, actualizar `window.open(`/?listingId=${listing.id}`, '_blank')` por `window.open(`/listing/${listing.id}`, '_blank')`.
   - Garantizar que cualquier clic o interacción sobre la tarjeta lleve directamente a la página de detalle del alojamiento sin pasar por la recarga y suscripción de Home.

2. **Eliminación de Peticiones Innecesarias a Tasa BCV en `ListingCard.tsx`:**
   - Eliminar la invocación del hook `useBcvRate()` (`const { bcvRate } = useBcvRate();`) y su importación en `ListingCard.tsx`.
   - Eliminar el bloque de renderizado condicional `{!HIDE_BCV_PRICES && (...)}` o evitar que intente consumir la tasa BCV, eliminando por completo las peticiones HTTP concurrentes hacia `dolarapi.com` al cargar las tarjetas.

---

## Qué NO debe hacer (límites)

- **NO eliminar ni modificar** la lógica de compatibilidad heredada en `Home.tsx` (`if (listingId) navigate(...)`), para asegurar que enlaces externos o marcadores guardados en navegadores antiguos sigan funcionando.
- **NO alterar** el diseño visual, estilos, animaciones ni estructura JSX general de `ListingCard.tsx`.
- **NO modificar** servicios externos ni el archivo `exchange-service.ts`.

---

## Tipos requeridos

```typescript
// No se requieren nuevos tipos en el dominio.
```

---

## Schema Zod requerido

```typescript
// No aplica validación Zod para esta tarea de optimización de ruteo y red.
```

---

## Criterios de aceptación (QA Gate los verificará)

- [ ] **CA-1:** En el DOM del Home, las tarjetas de alojamiento (`ListingCard`) tienen sus atributos `href` apuntando directamente a `/listing/:id` en lugar de `/?listingId=:id`.
- [ ] **CA-2:** Al hacer clic en el botón "Explorar Estancia" o en la tarjeta, se abre directamente la ruta `/listing/:id` en una nueva pestaña sin montar de nuevo `Home.tsx` ni ejecutar consultas redundantes a Firestore antes del cambio de vista.
- [ ] **CA-3:** Al cargar el listado de propiedades en el Home, **no se realiza ninguna petición HTTP** a `dolarapi.com` desde las tarjetas de alojamiento, eliminando el tráfico de red innecesario.
- [ ] **CA-4:** La re-ejecución de la suite de rendimiento en Playwright (`perf-listing-load.spec.ts`) evidencia una reducción drástica del tiempo de enrutamiento y la desaparición de peticiones a `dolares`.
- [ ] **CA-5:** TypeScript compila sin errores (`npx tsc --noEmit`).
- [ ] **CA-6:** ESLint compila sin errores ni advertencias (`npm run lint`).

---

## Dependencias

- **Requiere:** Auditoría previa completada (`PERF-LISTING-LOAD-001`).
- **Bloquea:** Ninguna.
