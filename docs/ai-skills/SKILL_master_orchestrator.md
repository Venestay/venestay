# 🛠️ SKILL: Master Orchestrator (Protocolo de Gobernanza v2.2)

Este documento define el comportamiento mandatorio del Agente Líder para asegurar la integridad del codebase de VeneStay.

## 📜 Protocolo de Aprendizaje Post-Mortem (MANDATORIO)

Queda estrictamente prohibida cualquier corrección "ciega" ante fallos detectados por **Quality Gates** (Compilación, Linting, Auditoría de Realidad). Ante un fallo, se debe ejecutar:

### 🟢 PASO 1: Análisis de Falla (Autocrítica)
Generar un reporte interno con:
1.  **Causa Técnica:** Identificación exacta del archivo y línea (o bloque) que rompió el sistema.
2.  **Falla de Proceso:** Análisis de por qué el agente generó el error (ej. error de contexto en `replace_file_content`, asunción incorrecta de tipos, omisión de cierre de tags).
3.  **Antecedente:** Consulta obligatoria a `@HISTORY.md` para verificar si es un error recurrente.

### 🟡 PASO 2: Propuesta de Reparación Quirúrgica
1.  Documentar el cambio exacto.
2.  Explicar por qué esta reparación no repetirá el error del PASO 1.

### 🔴 PASO 3: Ejecución y Cierre de Gate
1.  Aplicar el cambio.
2.  **Validación Proactiva (MANDATORIO):** Ejecutar `tsc --noEmit` y `lint` inmediatamente después de cada cambio estructural sin esperar instrucción del usuario.
3.  **Actualización SSoT Automática:** Registrar el cambio en `PROJECT_MEMORY.md` y `ROADMAP.md` (si aplica) antes de reportar la tarea como finalizada.
4.  Registrar el incidente en `@HISTORY.md` para alimentar la memoria del sistema.

## 🛡️ Restricciones de Seguridad (AI Guardrails)

1.  **Prohibición de Edición Ciega:** No se permite realizar más de 2 intentos de corrección sobre el mismo archivo sin realizar una lectura completa (`view_file`) del bloque afectado.
2.  **Verificación de Sintaxis Estructural:** En componentes de alta complejidad (>500 líneas), todo `replace_file_content` que altere el balance de llaves `{}` debe ser seguido inmediatamente por una validación de tipado focalizada (`tsc`).
3.  **Memoria de Fallos Mandatoria:** El fallo no es un obstáculo, sino una **oportunidad de actualización obligatoria**. Cada error detectado por una Quality Gate obliga a una actualización de la base de conocimientos (`HISTORY.md`, `PROJECT_MEMORY.md` y `TECHNICAL_DOC.md`).
4.  **Evolución Documental SSoT:** Queda prohibido cerrar una tarea sin actualizar el `TECHNICAL_DOC.md` si el cambio realizado altera la estructura, lógica de negocio o estándares visuales del proyecto.

---

## ⚡ Protocolo de Pensamiento v2.2 (Leyes AutoSkills)

1. **Ley de Carga Paralela (`async-parallel`):** Es **obligatorio** evaluar y paralelizar múltiples peticiones de datos independientes mediante `Promise.all()` en dashboards y pantallas de carga pesada.
2. **Ley de Eficiencia Dinámica (`bundle-dynamic-imports`):** Todo componente de alto peso (Google Maps, gráficas, librerías de terceros) debe implementarse mediante importación dinámica (`React.lazy` / `dynamic`) por defecto para proteger el TTI (Time to Interactive).
3. **Ley de Redundancia Zero (`redundant-entry`):** Queda prohibido solicitar datos que el sistema ya posea (perfil del usuario, tarjetas guardadas) en el flujo de Checkout.

---

## 🚦 Quality Gates (Vigilancia del Codebase)

1.  **Gate 1: Compilación (TSC):** No se aprueban cambios con errores de tipado o sintaxis.
2.  **Gate 2: Reality Auditor (Browser):** Los cambios visuales DEBEN ser capturados y verificados contra el diseño Premium Dark.
3.  **Gate 3: Trust Gate:** Cambios en pagos o seguridad requieren revisión del Trust Architect.

---
*Gobernanza activada: 06 de Mayo de 2026*
