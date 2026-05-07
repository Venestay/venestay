# 📋 SKILL: Development Workflow (Harness Engineering v2.2)

Para asegurar que cada cambio en la plataforma sea de clase mundial, hemos estandarizado el siguiente flujo de trabajo integrando nuestras especialidades de Inteligencia Agente bajo la gobernanza del **Master Orchestrator**.

## 🔄 El Ciclo de Vida de una Mejora (Flujo SOP v2.2)

### Paso 1: Planificación y Arquitectura (The Brain)
- **Habilidades:** `Agile Product Planner` + `Project Manager`.
- **Acción:** Cálculo de Score RICE y descomposición de tareas en un `Task Breakdown` atómico.
- **Ley Harness:** **FSD Strict**. Todo el código debe organizarse por dominios de negocio en `src/features/`.

### Paso 2: Diseño de Comportamiento y Confianza (The Heart)
- **Habilidades:** `Marketing Psychology` + `Trust Architect`.
- **Acción:** Auditoría de fricción y validación de protocolos de seguridad/pagos (UCP 20/80).
- **Ley Harness:** **redundant-entry**. Prohibido solicitar datos que el sistema ya posea.

### Paso 3: Construcción de Alto Rendimiento (The Craft)
- **Habilidades:** `React Performance` + `Composition Patterns`.
- **Acción:** Implementación técnica siguiendo las leyes de eficiencia de Vercel.
- **Leyes Harness:**
  - **async-parallel:** Paralelizar data fetching con `Promise.all()`.
  - **bundle-dynamic-imports:** Carga diferida (`React.lazy`) para componentes pesados.
  - **architecture-avoid-boolean-props:** Uso de variantes explícitas en lugar de flags.

### Paso 4: Gobernanza y Calidad (The Shield)
- **Habilidades:** `Master Orchestrator` + `Zod`.
- **Acción:** Ejecución obligatoria de **Quality Gates**.
- **Leyes Harness:**
  - **schema-coercion:** Validación y conversión de tipos estricta en el edge.
  - **Gate 1 (TSC):** `npx tsc --noEmit` obligatorio tras cada cambio estructural.

### Paso 5: Auditoría de Realidad y Evidencia (The Reality)
- **Habilidad:** `Reality & Evidence Auditor` + `Agent Browser`.
- **Acción:** Validación E2E en el navegador y captura de evidencia visual.
- **Práctica:** Prohibido el "Aprobar por Fe". Cada cambio debe tener un reporte de calidad (C, B, A).

---

## 🚨 Reglas de Oro (Checklist v2.2)
1. **Validación Proactiva:** No esperes a que el usuario pida testing; el Gate 1 (TSC) es parte de la construcción.
2. **SSoT Actualizado:** Cada tarea finalizada obliga a actualizar `PROJECT_MEMORY.md` y `HISTORY.md`.
3. **Estética Premium Dark:** Los componentes deben alinearse con la paleta oficial y el uso de `Whimsy Injector`.
4. **Respeto al Roadmap:** Las tareas se ejecutan según la prioridad RICE definida en el `ROADMAP.md`.

---
*Última actualización: 07 de Mayo de 2026 (Unificación v2.2)*
