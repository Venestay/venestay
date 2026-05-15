# Plan de Implementación: Refactor y Mejora de Sección Nueva Propiedad
> Skills aplicados: `vercel-react-best-practices`, `vercel-composition-patterns`, `accessibility` (WCAG 2.2), `typescript-advanced-types`, `frontend-design`

Este plan detalla la reestructuración completa del formulario de "Nueva Propiedad" para mejorar su **mantenibilidad**, **rendimiento**, **accesibilidad** y **experiencia de usuario premium**.

---

## Estado Actual vs. Estado Objetivo

| Dimensión | ❌ Ahora | ✅ Después |
| :--- | :--- | :--- |
| **Arquitectura** | Monolítico (1120+ líneas en un solo archivo) | Dividido en 4 sub-componentes por paso + Provider |
| **Rendimiento** | Todo carga al montar el modal | `React.lazy` + `Suspense` por cada paso |
| **TypeScript** | Tipos `any` esparcidos; validaciones parciales | Tipos discriminados y genéricos para validación |
| **Accesibilidad** | Sin `aria-describedby`, sin `aria-invalid` | Cumple WCAG 2.2 AA (roles, etiquetas, contraste) |
| **UX** | Inputs numéricos nativos sin feedback | Controles +/- custom con micro-animaciones |
| **Seguridad** | Sin cambios | Sin cambios (ya es correcto) |

---

## Fase 1 — Reestructuración Arquitectónica
> Patrón aplicado: `architecture-compound-components`, `state-lift-state` (composition-patterns)

### 1.1 Nueva estructura de directorios
```
features/dashboard/components/
  form-steps/
    StepGeneral.tsx      # Paso 1: Info base (precio, ciudad, descripción)
    StepGallery.tsx      # Paso 2: Galería de imágenes
    StepMap.tsx          # Paso 3: Mapa de ubicación
    StepPayments.tsx     # Paso 4: Métodos de pago
  ListingFormProvider.tsx # Context + estado compartido del formulario
  ListingForm.tsx         # Orquestador (ahora ligero, solo coordina pasos)
```

### 1.2 Eliminar prop drilling con Context
Crear un `ListingFormContext` que gestione:
- `editingListing` (draft actual)
- `setEditingListing`
- `errors`, `touched`, `validateField` (del hook `useListingValidation`)
- `step` actual y funciones `nextStep` / `prevStep`

### 1.3 Lazy Loading por paso
```tsx
// Regla: bundle-dynamic-imports (react-best-practices)
const StepGallery  = React.lazy(() => import('./form-steps/StepGallery'));
const StepMap      = React.lazy(() => import('./form-steps/StepMap'));
const StepPayments = React.lazy(() => import('./form-steps/StepPayments'));
```
→ La librería `browser-image-compression` solo se importa dentro de `StepGallery.tsx`, no en el bundle principal.

---

## Fase 2 — UX Premium y Refinado de Interfaz
> Patrón aplicado: `frontend-design` (micro-animaciones), `patterns-explicit-variants` (composition-patterns)

### 2.1 Controles numéricos personalizados (StepGeneral)
Sustituir los `<input type="number">` nativos por un componente `NumberStepper` (+/-) que:
- Sea accesible por teclado (`aria-label`, `aria-valuenow`)
- Tenga animación de rebote en los límites (min/max)
- Respete `prefers-reduced-motion`

### 2.2 Barra de progreso animada
Añadir un indicador de progreso visual entre pasos que muestre:
- Paso actual (numerado y etiquetado)
- Estado de completitud de cada paso (ícono de check si es válido)

### 2.3 Transiciones staggered entre pasos
Usar `AnimatePresence` de Motion con animaciones escalonadas (`staggerChildren`) para que los campos aparezcan uno a uno al entrar en un nuevo paso, no todos al mismo tiempo.

### 2.4 Vista Previa antes de publicar (Step 4)
Añadir un resumen colapsable al final del paso de Pagos que muestre la info ingresada en los pasos anteriores, para generar confianza antes del envío final.

---

## Fase 3 — Accesibilidad WCAG 2.2 AA
> Reglas aplicadas: `accessibility` skill — Secciones 3.3.1, 3.3.2, 2.1, 2.4.7, 2.5.8

### 3.1 Correcciones críticas (fix immediately)
- **Etiquetas de campo**: Asociar programáticamente cada `<label>` a su `<input>` con `htmlFor` e `id` únicos.
- **Errores de validación**: Añadir `aria-invalid="true"` y `aria-describedby="campo-error"` en campos con error.
- **Región de error**: Envolver mensajes de error en `role="alert"` para anuncio automático a lectores de pantalla.

```tsx
// ✅ Ejemplo correcto para cada campo
<div className="space-y-2">
  <label htmlFor="price-input">Precio por Noche</label>
  <input
    id="price-input"
    aria-invalid={!!errors.pricePerNight}
    aria-describedby={errors.pricePerNight ? 'price-error' : undefined}
    ...
  />
  {errors.pricePerNight && (
    <p id="price-error" role="alert" className="...">
      {errors.pricePerNight}
    </p>
  )}
</div>
```

### 3.2 Tamaño de targets táctiles
- Todos los botones del formulario deben ser mínimo **44×44 CSS px** (recomendado) o **24×24 px** (mínimo WCAG 2.5.8).
- Los controles +/- del `NumberStepper` deben cumplir este requisito.

### 3.3 Foco visible en pasos
- Al avanzar al siguiente paso, el foco debe moverse automáticamente al primer campo del nuevo paso.
- Al cerrar el modal (✕), el foco debe regresar al elemento que lo abrió.

### 3.4 Reducción de movimiento
```css
@media (prefers-reduced-motion: reduce) {
  /* Desactivar todas las AnimatePresence transitions */
}
```
Añadir esta media query global y proporcionar versiones sin animación para las transiciones entre pasos.

---

## Fase 4 — Tipos TypeScript Robustos
> Patrón aplicado: `typescript-advanced-types` — Discriminated Unions, Type-Safe Form Validation

### 4.1 Estado del formulario como Discriminated Union
```typescript
// Reemplazar el objeto genérico por un tipo discriminado
type FormStepState =
  | { step: 1; isValid: boolean; data: Pick<Listing, 'title' | 'description' | 'pricePerNight' | 'city'> }
  | { step: 2; isValid: boolean; data: Pick<Listing, 'images'> }
  | { step: 3; isValid: boolean; data: Pick<Listing, 'location' | 'coordinates'> }
  | { step: 4; isValid: boolean; data: Pick<Listing, 'paymentMethods'> };
```

### 4.2 Validación genérica por campo
```typescript
// Basado en el Pattern 5 del skill typescript-advanced-types
type FieldValidation<T> = {
  [K in keyof T]?: Array<{ validate: (v: T[K]) => boolean; message: string }>;
};
```
Refactorizar `useListingValidation` para usar este patrón genérico en lugar de validaciones hardcodeadas.

---

## Criterios de Aceptación

### Funcionalidad (No Regresión)
- [ ] El formulario mantiene su funcionalidad actual de guardado y publicación.
- [ ] El borrador en `localStorage` sigue funcionando.
- [ ] La carga de imágenes y el mapa funcionan igual que antes.

### Rendimiento
- [ ] El tamaño del bundle principal disminuye gracias al code-splitting (`bundle-dynamic-imports`).
- [ ] La librería de compresión no aparece en el bundle inicial.
- [ ] La navegación entre pasos es instantánea (< 100ms de respuesta visual).

### Accesibilidad
- [ ] Todos los campos tienen `label` asociado programáticamente.
- [ ] Los errores de validación son anunciados por lectores de pantalla (`aria-live`).
- [ ] Navegación completa por teclado (Tab / Shift+Tab / Enter).
- [ ] El foco se mueve al primer campo al entrar en cada paso.

### Calidad de Código
- [ ] Pasa `npm run lint` sin errores.
- [ ] No hay tipos `any` en los archivos nuevos.
- [ ] Ningún archivo supera 300 líneas.

### UX y Diseño
- [ ] La barra de progreso de pasos es visible y muestra el estado de validez.
- [ ] Los controles +/- son visibles y accesibles en móvil.
- [ ] Las transiciones entre pasos respetan `prefers-reduced-motion`.
