# 📐 Metodología: Spec-Driven Development (SDD) - VeneStay

Esta metodología asegura que cada funcionalidad de VeneStay cumpla con los estándares de **Calidad Premium**, **Seguridad** y **Estrategia de Negocio** antes de que se escriba una sola línea de código.

## 🚀 El Ciclo SDD (Spec-to-Done)

Cualquier cambio estructural o nueva funcionalidad DEBE seguir estos 5 pasos:

### 1. Descubrimiento y Problema (Product Manager)
- **Acción:** Identificar el "dolor" del usuario o la oportunidad de mercado.
- **Salida:** Definición clara del problema en el backlog.

### 2. Especificación (PRD) (Product Manager)
- **Acción:** Crear un **Product Requirements Document (PRD)** en `docs/specs/`.
- **Contenido Mandatorio:**
    - **Objetivo:** ¿Qué queremos lograr?
    - **Historias de Usuario:** "Como [rol], quiero [acción] para [beneficio]".
    - **Requerimientos Técnicos:** Validaciones (Zod), Hooks, Servicios.
    - **Estándares Visuales:** Referencia a "Premium Dark" y animaciones.
    - **Métricas de Éxito:** ¿Cómo sabemos que funcionó?

### 3. Priorización y Descomposición (Agile Planner)
- **Acción:** Asignar puntaje **RICE** y dividir en micro-tareas.
- **Salida:** Actualización de `task.md` con tareas atómicas.

### 4. Ejecución Quirúrgica (Master Orchestrator)
- **Acción:** Implementación siguiendo los Quality Gates.
- **Regla:** Mantener paridad total con la especificación (PRD).

### 5. Validación y Memoria (Reality Auditor / Master Orchestrator)
- **Acción:** Verificación visual y técnica.
- **Salida:** Registro en `HISTORY.md` y `PROJECT_MEMORY.md`.

---

## 🛡️ Reglas de Oro
1. **Spec First:** Prohibido implementar lógica de negocio compleja sin un PRD previo.
2. **No Truncamiento:** Una refactorización no debe omitir funcionalidades de la especificación original.
3. **SSoS (Single Source of Truth):** El PRD es la ley. Si el código diverge, se debe actualizar la especificación o corregir el código.
