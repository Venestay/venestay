# Plan de Implementación: Listing Form v2 — Alineación Marketplace Premium

> Basado en el [Análisis UX Senior](./analisis-ux-senior-listing.md) y las directrices de los skills invocados: **frontend-design**, **accessibility**, **zod**, **react-best-practices**, **composition-patterns**.

## Contexto

El formulario actual cubre la mecánica base pero omite datos logísticos y de confianza que los marketplaces líderes (Airbnb, Booking.com) consideran esenciales para la conversión. Este plan cierra esas brechas en 4 sprints incrementales, sin romper la funcionalidad existente.

## Decisiones Pendientes

> **Decisión de alcance**: Este plan añade campos nuevos al modelo de datos (`Listing`). Esto impacta:
> - El tipo `Listing` en `features/listings/types/index.ts`
> - El esquema Zod en `dashboard.schema.ts`
> - Los datos mock en `constants.tsx`
> - Las vistas de detalle (`ListingDetail.tsx`)
>
> ¿Los nuevos campos deben ser **opcionales** (retrocompatibles) o **requeridos** (validación estricta desde el inicio)?

> **Impacto en producción**: Los listings existentes en Firebase no tendrán los nuevos campos. Se necesita una estrategia de migración (defaults en lectura) o marcarlos como opcionales en el tipo.

## Preguntas Abiertas

1. **Política de cancelación**: ¿VeneStay maneja reembolsos automatizados o solo es informativo para el huésped?
2. **Distribución de camas**: ¿Queremos un sub-formulario dinámico completo o una versión simplificada (dropdown por habitación)?
3. **Desglose de precios**: ¿Implementamos Limpieza + Depósito ahora, o solo el precio base con un campo de "Tarifas adicionales" libre?
4. **Reglas de la casa**: ¿Las reglas bloquean la reserva (filtro hard) o son solo informativas?

---

## Proposed Changes

### Sprint 5: Identidad y Clasificación de Propiedad

**Objetivo SDD**: Como anfitrión, quiero clasificar mi propiedad con precisión (tipo, subtipo, privacidad) para que los huéspedes encuentren exactamente lo que buscan.

---

#### [MODIFY] `features/listings/types/index.ts`

Añadir campos al tipo `Listing`:
```typescript
propertySubtype?: 'Apartamento' | 'Casa' | 'Loft' | 'Villa' | 'Estudio' | 'Anexo' | 'Penthouse';
accommodationPrivacy?: 'Entero' | 'Habitación Privada' | 'Habitación Compartida';
surfaceArea?: number; // m²
```

#### [MODIFY] `dashboard.schema.ts`

Añadir los campos al esquema Zod con validaciones:
- `propertySubtype`: `z.enum([...])` — reemplaza el `propertyType` hardcodeado.
- `accommodationPrivacy`: `z.enum([...])` — reemplaza `accommodationType`.
- `surfaceArea`: `z.coerce.number().min(10).max(2000).optional()`

#### [MODIFY] `StepGeneral.tsx`

Reemplazar el `select` genérico de ciudad por:
1. **Selector visual de tipo de propiedad** → tarjetas con iconos (Casa, Apartamento, Villa, etc.) usando `architecture-compound-components` del skill de composición.
2. **Selector de privacidad** → 3 botones toggle estilo pill ("Entero", "Habitación Privada", "Compartida").
3. **Campo de superficie** → NumberStepper existente con sufijo "m²".

**Criterios de aceptación:**
- [ ] Al seleccionar un subtipo, se refleja visualmente (tarjeta activa con animación).
- [ ] El tipo de privacidad se guarda en el borrador de localStorage.
- [ ] El campo de superficie es opcional y no bloquea la navegación.
- [ ] `npm run lint` pasa.

---

### Sprint 6: Logística del Viaje (Check-in, Cancelación, Reglas)

**Objetivo SDD**: Como anfitrión, quiero definir horarios de entrada/salida, políticas de cancelación y reglas de convivencia para reducir las consultas previas a la reserva.

---

#### [MODIFY] `features/listings/types/index.ts`

```typescript
checkInTime?: string;    // "14:00"
checkOutTime?: string;   // "11:00"
cancellationPolicy?: 'Flexible' | 'Moderada' | 'Estricta';
houseRules?: {
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "08:00"
  childrenAllowed: boolean;
  petsAllowed: boolean;
  petFee?: number;
  petSizeLimit?: string;
  additionalRules?: string;
};
```

#### [MODIFY] `dashboard.schema.ts`

Nuevo esquema Zod para `houseRules` como `z.object({...}).optional()` con:
- `cancellationPolicy`: `z.enum(['Flexible', 'Moderada', 'Estricta']).default('Moderada')`
- `checkInTime` / `checkOutTime`: `z.string().regex(/^\d{2}:\d{2}$/)` con defaults "14:00" y "11:00"
- `houseRules.petsAllowed` reemplaza el `isPetFriendly` actual (migración interna).
- **Progressive Disclosure**: `petFee` y `petSizeLimit` solo se validan si `petsAllowed === true` (usar `.refine()` condicional del skill Zod).

#### [NEW] `StepRules.tsx`

Nuevo paso del formulario (el formulario pasa de 4 a 5 pasos) dedicado a Logística:
- **Sección 1: Horarios** → Selectores de hora estilizados (dropdowns premium) para check-in/check-out.
- **Sección 2: Política de Cancelación** → 3 tarjetas horizontales (Flexible/Moderada/Estricta) con descripción contextual debajo de cada una.
- **Sección 3: Reglas de Casa** → Toggles premium (switch on/off) para cada regla. Al activar "Mascotas", aparece un sub-panel animado (Progressive Disclosure) para tarifa y restricción de tamaño.

#### [MODIFY] `ListingForm.tsx`

- Actualizar el stepper de 4 a 5 pasos.
- Insertar `StepRules` como paso 4 (actual paso 4 "Pagos" pasa a ser paso 5).
- Actualizar la barra de progreso (`width: ${(step / 5) * 100}%`).
- Actualizar `FormStepState` en `useListingValidation.ts` con el nuevo paso.

#### [MODIFY] `useListingValidation.ts`

Extender `FormStepState` con el paso 5:
```typescript
| { step: 4; data: Partial<Pick<ListingSchema, 'checkInTime' | 'checkOutTime' | 'cancellationPolicy' | 'houseRules'>> }
| { step: 5; data: Partial<Pick<ListingSchema, 'paymentMethods'>> }
```

**Criterios de aceptación:**
- [ ] El stepper muestra 5 pasos y la navegación funciona fluida.
- [ ] Seleccionar "Mascotas: Sí" despliega el sub-panel de tarifa sin saltos visuales.
- [ ] Las 3 tarjetas de cancelación son navegables por teclado (`Tab` + `Enter`).
- [ ] Los horarios tienen un rango válido (no se puede poner check-out antes del check-in).
- [ ] `npm run lint` pasa.

---

### Sprint 7: Desglose de Precios y Amenidades Categorizadas

**Objetivo SDD**: Como anfitrión, quiero desglosar mis tarifas (limpieza, depósito) y categorizar mis amenidades para que el huésped tenga transparencia total antes de reservar.

---

#### [MODIFY] `features/listings/types/index.ts`

```typescript
cleaningFee?: number;
securityDeposit?: number;
weeklyDiscount?: number;  // porcentaje (0-100)
monthlyDiscount?: number; // porcentaje (0-100)
```

#### [MODIFY] `dashboard.schema.ts`

- `cleaningFee`: `z.coerce.number().min(0).optional()`
- `securityDeposit`: `z.coerce.number().min(0).optional()`
- `weeklyDiscount` / `monthlyDiscount`: `z.coerce.number().min(0).max(100).optional()`

#### [MODIFY] `StepGeneral.tsx`

**Precios:**
Reemplazar el campo simple de precio por un bloque expandible "Tarifas":
- Precio por noche (campo principal, ya existe).
- Gastos de limpieza (nuevo, opcional, con tooltip explicativo).
- Depósito de seguridad (nuevo, opcional).
- Descuento semanal/mensual (nuevos, con porcentaje visual).

**Amenidades:**
Reemplazar la lista plana por **categorías colapsables**:

| Categoría | Amenidades |
|---|---|
| Básicos | WiFi, A/A, TV, Cocina equipada |
| Confort & Lujo | Piscina, Gimnasio, Vista al Mar |
| Seguridad | Planta Eléctrica, Tanque de Agua, Elementos de seguridad, Extintor, Botiquín |
| Transporte | Estacionamiento |

Cada categoría se muestra con un header colapsable y un contador de selección.

**Criterios de aceptación:**
- [ ] El desglose de precios se muestra con un resumen visual ("Total estimado por noche: $X").
- [ ] Las categorías de amenidades se pueden expandir/colapsar con animación.
- [ ] El descuento se muestra como porcentaje y el campo se clampea a 0-100.
- [ ] `npm run lint` pasa.

---

### Sprint 8: Distribución de Camas y Title Quality Score

**Objetivo SDD**: Como anfitrión, quiero detallar la distribución de camas por habitación y recibir feedback sobre la calidad de mi título para maximizar las reservas.

---

#### [MODIFY] `features/listings/types/index.ts`

```typescript
bedDistribution?: Array<{
  roomName: string;      // "Habitación Principal", "Habitación 2"
  beds: Array<{
    type: 'King' | 'Queen' | 'Doble' | 'Individual' | 'Litera' | 'Sofá Cama';
    count: number;
  }>;
}>;
```

#### [MODIFY] `dashboard.schema.ts`

```typescript
bedDistribution: z.array(z.object({
  roomName: z.string().min(1),
  beds: z.array(z.object({
    type: z.enum(['King', 'Queen', 'Doble', 'Individual', 'Litera', 'Sofá Cama']),
    count: z.coerce.number().min(1),
  })).min(1)
})).optional()
```

#### [MODIFY] `StepGeneral.tsx`

1. **Title Quality Score**: Implementar un indicador circular (reutilizando el patrón del Quality Gauge de la galería) que evalúe:
   - Longitud (>30 chars = +25pts)
   - Contiene ubicación (Lechería, etc.) = +25pts
   - Contiene adjetivo descriptivo (Lujo, Moderno, Acogedor) = +25pts
   - Contiene tipo de propiedad = +25pts
   - Feedback visual: Rojo (<50), Dorado (50-75), Verde (>75).

2. **Bed Distribution Sub-form**: Debajo de la sección de capacidad, un botón "Detallar camas por habitación" que despliega (Progressive Disclosure) un formulario dinámico:
   - Auto-genera N habitaciones basado en el campo `bedrooms`.
   - Cada habitación tiene un dropdown de tipo de cama y un NumberStepper de cantidad.
   - Botón "Añadir otra cama" por habitación.

#### [MODIFY] `StepGeneral.tsx` → Descripción Estructurada

Reemplazar el textarea de descripción único por 3 campos con placeholder contextual:
- "El espacio" → Describe el interior y la distribución.
- "Acceso de los huéspedes" → ¿Acceso independiente? ¿Compartido?
- "Otros detalles" → Información adicional relevante.

Los 3 campos se concatenan internamente en `description` para retrocompatibilidad.

**Criterios de aceptación:**
- [ ] El Title Quality Score se actualiza en tiempo real mientras se escribe.
- [ ] La distribución de camas se auto-genera al cambiar el campo de dormitorios.
- [ ] Se pueden añadir y eliminar camas por habitación.
- [ ] La descripción estructurada concatena correctamente los 3 campos.
- [ ] `npm run lint` pasa.

---

## Archivos Impactados (Resumen)

| Archivo | Sprint 5 | Sprint 6 | Sprint 7 | Sprint 8 |
|---|:---:|:---:|:---:|:---:|
| `features/listings/types/index.ts` | ✏️ | ✏️ | ✏️ | ✏️ |
| `dashboard.schema.ts` | ✏️ | ✏️ | ✏️ | ✏️ |
| `StepGeneral.tsx` | ✏️ | — | ✏️ | ✏️ |
| `StepRules.tsx` | — | 🆕 | — | — |
| `ListingForm.tsx` | — | ✏️ | — | — |
| `useListingValidation.ts` | ✏️ | ✏️ | — | — |
| `ListingFormContext.tsx` | — | ✏️ | — | — |

---

## Verification Plan

### Automated Tests
- `npm run lint` (TypeScript no-emit) al final de cada sprint.
- Validar que `listingSchema.safeParse(existingMockData)` sigue pasando (retrocompatibilidad).

### Manual Verification
- Navegación completa del formulario (todos los pasos por teclado).
- Crear un listing nuevo → verificar que los datos nuevos se guardan en Firebase.
- Abrir un listing existente (sin campos nuevos) → verificar que no crashea.
- Probar Progressive Disclosure (activar/desactivar mascotas, expandir camas).
- Verificar que el borrador de localStorage incluye los campos nuevos.

---
---

# Task Checklist: Listing Form v2

## Fase 1: Refactorización Base (COMPLETADA ✅)

### [x] Sprint 1: Arquitectura Modular y Rendimiento
### [x] Sprint 2: Accesibilidad (WCAG 2.2 AA)
### [x] Sprint 3: Experiencia de Usuario Premium
### [x] Sprint 4: Type Safety y QA (Refactorización Zod)

---

## Fase 2: Alineación con Estándares Marketplace

### [ ] Sprint 5: Identidad y Clasificación de Propiedad
- [ ] Añadir `propertySubtype`, `accommodationPrivacy`, `surfaceArea` al tipo `Listing`
- [ ] Actualizar esquema Zod con `z.enum` para subtipos y privacidad
- [ ] Crear selector visual de tipo de propiedad (tarjetas con iconos)
- [ ] Crear selector de privacidad (botones toggle pill)
- [ ] Añadir campo de superficie (m²) con NumberStepper
- [ ] Actualizar `FormStepState` en useListingValidation
- [ ] Verificar retrocompatibilidad con listings existentes
- [ ] `npm run lint` pasa

### [ ] Sprint 6: Logística del Viaje (Check-in, Cancelación, Reglas)
- [ ] Añadir `checkInTime`, `checkOutTime`, `cancellationPolicy`, `houseRules` al tipo `Listing`
- [ ] Crear esquema Zod para `houseRules` con validación condicional
- [ ] Crear nuevo componente `StepRules.tsx` (Paso 4 del formulario)
  - [ ] Sección horarios (selectores de hora premium)
  - [ ] Sección cancelación (3 tarjetas: Flexible/Moderada/Estricta)
  - [ ] Sección reglas (toggles + Progressive Disclosure para mascotas)
- [ ] Actualizar stepper de 4 a 5 pasos en `ListingForm.tsx`
- [ ] Migrar `isPetFriendly` → `houseRules.petsAllowed`
- [ ] Actualizar `FormStepState` con nuevo paso 4 y mover pagos a paso 5
- [ ] Accesibilidad: navegación por teclado en tarjetas de cancelación
- [ ] `npm run lint` pasa

### [ ] Sprint 7: Desglose de Precios y Amenidades Categorizadas
- [ ] Añadir `cleaningFee`, `securityDeposit`, `weeklyDiscount`, `monthlyDiscount` al tipo
- [ ] Actualizar esquema Zod con validaciones de rango
- [ ] Reemplazar campo de precio simple por bloque "Tarifas" expandible
  - [ ] Precio base (existente)
  - [ ] Gastos de limpieza (nuevo, opcional)
  - [ ] Depósito de seguridad (nuevo, opcional)
  - [ ] Descuentos semanal/mensual (nuevos, con %)
- [ ] Refactorizar amenidades en categorías colapsables
  - [ ] Básicos (WiFi, A/A, TV, Cocina)
  - [ ] Confort & Lujo (Piscina, Gimnasio, Vista al Mar)
  - [ ] Seguridad (Planta, Tanque, Extintor, Botiquín)
  - [ ] Transporte (Estacionamiento)
- [ ] Mostrar resumen visual de "Total estimado por noche"
- [ ] `npm run lint` pasa

### [ ] Sprint 8: Distribución de Camas y Title Quality Score
- [ ] Añadir `bedDistribution` al tipo `Listing`
- [ ] Crear esquema Zod para distribución de camas
- [ ] Implementar Title Quality Score (indicador circular 0-100)
  - [ ] Evaluar: longitud, ubicación, adjetivo, tipo de propiedad
  - [ ] Feedback visual: Rojo (<50), Dorado (50-75), Verde (>75)
- [ ] Crear sub-formulario dinámico de distribución de camas
  - [ ] Auto-generar habitaciones según campo `bedrooms`
  - [ ] Dropdown de tipo de cama + NumberStepper por habitación
  - [ ] Botón "Añadir otra cama" por habitación
- [ ] Refactorizar descripción en 3 campos estructurados
  - [ ] "El espacio" / "Acceso de huéspedes" / "Otros detalles"
  - [ ] Concatenar internamente para retrocompatibilidad
- [ ] `npm run lint` pasa

---

## Validación Final (DoD — Definition of Done)

- [ ] `npm run lint` pasa sin errores
- [ ] El borrador de `localStorage` persiste todos los campos nuevos
- [ ] Listings existentes (sin campos nuevos) cargan sin errores
- [ ] Flujo completo de publicación probado manualmente (5 pasos + guardar)
- [ ] Prueba de teclado: navegar todo el formulario sin ratón
- [ ] Datos nuevos se reflejan en `ListingDetail.tsx`
