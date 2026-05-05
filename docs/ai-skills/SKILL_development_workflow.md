# 📋 Reporte de Acción: Mejores Prácticas de Desarrollo VeneStay

Para asegurar que cada cambio en la plataforma sea de clase mundial, hemos estandarizado el siguiente flujo de trabajo integrando nuestras 8 especialidades de Inteligencia Agente.

## 🔄 El Ciclo de Vida de una Mejora (Flujo SOP)

### Paso 1: Planificación Estratégica (The Brain)
- **Habilidad:** `Agile Product Planner` + `UCP`
- **Acción:** Antes de tocar el código, calculamos el **Score RICE**. Si la tarea no tiene un impacto claro o confianza alta, se pospone.
- **Práctica:** Definir los modelos de datos en Firestore siguiendo el estándar de `SKILL_ucp.md` para asegurar compatibilidad con futuros agentes.

### Paso 2: Diseño de Comportamiento (The Heart)
- **Habilidad:** `Marketing Psychology` + `Behavioral Nudge`
- **Acción:** Revisamos el flujo de usuario. ¿Hay fricción? ¿Estamos usando el Modelo de Fogg?
- **Práctica:** Aplicar **Aversión a la Pérdida** en los copys y asegurar que no haya más de 3 campos de formulario visibles al mismo tiempo para no abrumar al usuario.

### Paso 3: Construcción y Pulido (The Craft)
- **Habilidad:** `Whimsy Injector` + `Trust Architect`
- **Acción:** Implementamos la funcionalidad con capas de seguridad y deleite.
- **Práctica:** 
  - Añadir micro-animaciones (Whimsy) de menos de 300ms.
  - Asegurar que cada acción de pago genere una traza de evidencia inmutable (Trust) en la base de datos.

### Paso 4: Auditoría de Realidad (The Shield)
- **Habilidad:** `Reality & Evidence Auditor`
- **Acción:** Verificamos el resultado en entornos reales (Virtual vs Real, Mobile vs Desktop).
- **Práctica:** **Prohibido el "Aprobar por Fe"**. Cada pull request o cambio debe venir acompañado de una captura de pantalla que demuestre el "antes y después".

### Paso 5: Estrategia de Crecimiento (The Engine)
- **Habilidad:** `Growth Hacker`
- **Acción:** ¿Cómo podemos hacer que esta nueva función atraiga a más usuarios?
- **Práctica:** Integrar botones de "Compartir Estancia" o incentivos de referidos directamente en el flujo de confirmación.

---

## 🚨 Reglas de Oro para el Agente (Checklist)
1. **Justificación Psicológica:** Cada cambio visual debe estar justificado por uno de los modelos mentales de `SKILL_marketing_psychology.md`.
2. **Evidencia Visual:** Si no hay screenshot, el cambio no existe para el `Reality Auditor`.
3. **Seguridad por Defecto:** Si el `Trust Architect` detecta una vulnerabilidad en el manejo de identidades, el despliegue se detiene.
4. **Priorización RICE:** No trabajamos en "caprichos" estéticos si hay tareas de "Prioridad 1" pendientes en el Roadmap.
