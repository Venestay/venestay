# Tareas: Refactor Formulario Nueva Propiedad
> Ordenado por dependencias y prioridad de impacto

---

## Sprint 1 — Arquitectura y Rendimiento (Bloque Fundacional)

- [x] Crear directorio `features/dashboard/components/form-steps/`
- [x] Crear `ListingFormContext.tsx` con el Provider y el hook `useListingForm()`
- [x] Extraer `StepGeneral.tsx` (Paso 1: precio, ciudad, descripción, tipo de alojamiento)
- [x] Extraer `StepGallery.tsx` (Paso 2: galería, drag & drop, ambientes) — cargar con `React.lazy`
- [x] Extraer `StepMap.tsx` (Paso 3: mapa Google, geocoding inverso) — cargar con `React.lazy`
- [x] Extraer `StepPayments.tsx` (Paso 4: métodos de pago + resumen de vista previa) — cargar con `React.lazy`
- [x] Refactorizar `ListingForm.tsx` para ser solo un orquestador liviano (< 150 líneas)

## Sprint 2 — Accesibilidad WCAG 2.2 AA (Obligatorio antes de Beta)

- [x] Asociar programáticamente cada `<label>` con `htmlFor` e `id` en todos los campos
- [x] Añadir `aria-invalid` y `aria-describedby` a todos los inputs con validación
- [x] Envolver mensajes de error en `role="alert"` para lectores de pantalla
- [x] Mover el foco al primer campo al cambiar de paso (`useEffect` + `ref.current.focus()`)
- [ ] Regresar el foco al disparador del modal al cerrar (✕)
- [x] Verificar tamaño de targets táctiles (mínimo 44×44 px en botones principales)
- [x] Añadir `@media (prefers-reduced-motion: reduce)` / clases de reducción de movimiento (`motion-reduce`) para desactivar animaciones

## Sprint 3 — UX Premium y Diseño (Pulido Final)

- [x] Implementar componente `NumberStepper` (+/-) accesible para campos numéricos (huéspedes, baños, etc.)
- [x] Implementar barra de progreso animada entre pasos con estado de validez por paso
- [ ] Añadir transiciones `staggerChildren` con Motion entre los campos al entrar en un paso
- [ ] Añadir "Vista Previa" colapsable en el Paso 4 antes de publicar

## Sprint 4 — TypeScript Robusto (Calidad de Código)

- [x] Definir `FormStepState` como Discriminated Union por paso
- [x] Refactorizar `useListingValidation` con el patrón genérico `FieldValidation<T>`
- [x] Eliminar todos los `any` en archivos nuevos
- [ ] Asegurar que ningún archivo supera 300 líneas

---

## Validación Final (DoD — Definition of Done)

- [x] `npm run lint` pasa sin errores
- [x] El borrador de `localStorage` sigue funcionando
- [x] Flujo completo de publicación probado manualmente (4 pasos + guardar)
- [x] Prueba de teclado: navegar todo el formulario sin ratón
- [x] El bundle del paso principal no incluye `browser-image-compression`
