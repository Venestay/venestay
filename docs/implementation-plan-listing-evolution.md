# Plan de Implementación: Evolución del Formulario VeneStay

Este documento define la hoja de ruta técnica para integrar los estándares de la industria (Reglas de la Casa, Depósito de Seguridad, Políticas) en el ecosistema de VeneStay, asegurando integridad de datos y una experiencia de usuario premium.

## Fase 1: Cimientos de Datos (Seguridad y Tipado)
*Prioridad: Crítica | Skill: `typescript-advanced-types` & `zod`*

- **Acciones**:
    - Actualizar `Listing` interface en `src/types.ts` para incluir:
        - `houseRules`: `{ allowPets: boolean, allowSmoking: boolean, allowParties: boolean, allowChildren: boolean, additionalRules: string }`
        - `checkInTime`: string
        - `checkOutTime`: string
        - `requiresDeposit`: boolean
        - `depositAmount`: number
        - `cleaningFee`: number
        - `cancellationPolicy`: 'flexible' | 'moderate' | 'strict'
    - Refactorizar `listingSchema` en `dashboard.schema.ts` con validaciones condicionales (ej. `depositAmount` requerido solo si `requiresDeposit` es true).

## Fase 2: Control de Estancia (Step 1 - General)
*Prioridad: Alta | Skill: `frontend-design`*

- **Componente `HouseRulesSelector`**: 
    - Diseño de micro-cards interactivas con iconos de `lucide-react`.
    - Animaciones de estado activo usando Framer Motion.
- **Logística**:
    - Selectores de tiempo (Time Pickers) estilizados con el tema Navy/Gold de VeneStay.
    - Integración de "Estancia Mínima" como campo numérico.

## Fase 3: Blindaje Financiero (Step 4 - Precios y Políticas)
*Prioridad: Crítica | Skill: `tailwind-css-patterns`*

- **Gestión de Cargos**:
    - Implementar sección de "Gastos Adicionales" con inputs numéricos validados.
    - Switch/Toggle premium para el Depósito de Seguridad que despliega el campo de monto con una transición suave.
- **Selector de Políticas**:
    - Cards informativas para las Políticas de Cancelación, permitiendo al anfitrión elegir el nivel de protección.

## Fase 4: Persistencia y Flujo de Cierre
*Prioridad: Media | Skill: `vercel-react-best-practices`*

- **Draft Sync**: Asegurar que el sistema de borrador automático (localStorage) capture todos los nuevos campos sin lag.
- **Resumen de Publicación**: Actualizar la vista previa final para que el anfitrión vea exactamente cómo se desglosarán los costos para el huésped.

---

## Criterios de Aceptación (DoD)
- [ ] Los tipos de TypeScript no emiten errores en el build.
- [ ] La validación de Zod impide guardar si falta el monto del depósito (si está activo).
- [ ] La UI es 100% responsiva y mantiene el estilo premium.
- [ ] El borrador persiste correctamente tras recargar la página.

---
**Documento de Referencia para Desarrollo**
*Generado por Antigravity AI - 14 de Mayo, 2026*
