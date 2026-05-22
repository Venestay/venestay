# Prompt: Implementación del Sistema de Memoria por Capas (Tiered Memory)
## Instrucción para el Agente · VeneStay v2.3.0 · Opción B

---

## BLOQUE 0 — VERIFICACIÓN DE CONTEXTO (EJECUTAR ANTES DE TODO)

Esta es la primera instrucción que debes ejecutar. No hagas nada más hasta completarla.

Verifica que los siguientes dos documentos están presentes en tu contexto de sesión. Búscalos por su nombre de archivo o por su contenido característico:

```
DOCUMENTO A → VENESTAY_AGENT_PROMPT_SDD.md
  Señal de identificación: contiene "VeneStay Master Agent Prompt v3.0",
  el pipeline de cinco nodos y la plantilla de PROJECT_MEMORY.md.

DOCUMENTO B → VENESTAY_TIERED_MEMORY.md
  Señal de identificación: contiene "Arquitectura de Memoria",
  los límites de 200 tokens para HOT y 800 tokens para WARM,
  y la estructura de MEMORY_ARCHIVE/.
```

### Si ambos documentos están presentes:

Responde con este bloque y continúa al Bloque 1:

```
╔══════════════════════════════════════════════════════════╗
║  VERIFICACIÓN DE CONTEXTO — OK                          ║
║  ✓ VENESTAY_AGENT_PROMPT_SDD.md     encontrado          ║
║  ✓ VENESTAY_TIERED_MEMORY.md        encontrado          ║
║  Estado: listo para generar el Informe de Migración     ║
╚══════════════════════════════════════════════════════════╝
```

### Si alguno de los documentos NO está presente:

Responde con este bloque y detente completamente. No generes el informe, no produzcas archivos, no continúes:

```
╔══════════════════════════════════════════════════════════╗
║  VERIFICACIÓN DE CONTEXTO — BLOQUEADO                   ║
║                                                         ║
║  Documentos requeridos:                                 ║
║  [✓ / ✗] VENESTAY_AGENT_PROMPT_SDD.md                  ║
║  [✓ / ✗] VENESTAY_TIERED_MEMORY.md                     ║
║                                                         ║
║  ACCIÓN REQUERIDA:                                      ║
║  Adjunta los documentos marcados con ✗ a esta sesión   ║
║  y reenvía este mensaje para continuar.                 ║
║                                                         ║
║  Sin ambos documentos no es posible generar el         ║
║  Informe de Migración sin inventar información.         ║
╚══════════════════════════════════════════════════════════╝
```

---

## BLOQUE 1 — ROL Y OBJETIVO

Actúa como el **Arquitecto de Memoria del Proyecto VeneStay**.

Tu objetivo es diseñar e implementar la migración del sistema de memoria monolítico (`PROJECT_MEMORY.md`) al sistema de tres capas definido en `VENESTAY_TIERED_MEMORY.md`:

- **HOT** (`MEMORY_HOT.md`) — máximo 200 tokens, carga siempre.
- **WARM** (`MEMORY_WARM.md`) — máximo 800 tokens, carga solo si el pedido lo requiere.
- **COLD** (`MEMORY_ARCHIVE/`) — sin límite, carga solo bajo confirmación explícita.

**Pero no vas a implementar nada todavía.**

Lo primero que debes producir es un Informe de Migración completo basado estrictamente en el contenido de los dos documentos verificados en el Bloque 0. Nada en el informe puede ser inventado o asumido.

---

## BLOQUE 2 — INFORME DE MIGRACIÓN (ESTRUCTURA OBLIGATORIA)

Genera el informe con exactamente estas seis secciones. No omitas ninguna.

---

### Sección 1 — Diagnóstico del estado actual

Basándote en la plantilla de `PROJECT_MEMORY.md` definida en `VENESTAY_AGENT_PROMPT_SDD.md`, clasifica cada sección de ese archivo según la capa de destino en el nuevo sistema.

Presenta el resultado como tabla:

| Sección de PROJECT_MEMORY.md | Capa de destino | Justificación |
|:---|:---|:---|
| Estado del Sprint | HOT / WARM / COLD / Descartar | [por qué] |
| Módulos en progreso | HOT / WARM / COLD / Descartar | [por qué] |
| Quality Gate — Historial | HOT / WARM / COLD / Descartar | [por qué] |
| Errores abiertos | HOT / WARM / COLD / Descartar | [por qué] |
| Decisiones técnicas | HOT / WARM / COLD / Descartar | [por qué] |
| Contador de iteraciones | HOT / WARM / COLD / Descartar | [por qué] |

Añade una fila "Descartar" para cualquier campo que ya esté cubierto por el prompt maestro `VENESTAY_AGENT_PROMPT_SDD.md` y no necesite repetirse en la memoria.

---

### Sección 2 — Plan de sprints de migración

Diseña los sprints con estos criterios no negociables:
- Cada sprint es completable en una sola sesión con el agente.
- Cada sprint entrega algo funcional al terminar, no a medias.
- Ningún sprint deja el sistema en estado peor que el anterior.
- El Sprint 1 debe ser el de menor riesgo posible.
- El sistema anterior (`PROJECT_MEMORY.md`) debe seguir funcionando hasta que el último sprint confirme que el nuevo sistema lo reemplaza completamente.

Para cada sprint incluye:

```
SPRINT [N] — [Nombre]
─────────────────────────────────────────────
Objetivo     : [una oración]
Entregables  : [archivos exactos que existirán al terminar]
Tareas       : [lista atómica de lo que el agente hace]
Aceptación   : [condición verificable de que el sprint cerró bien]
Riesgo       : [riesgo principal]
Mitigación   : [cómo se evita o contiene]
Dependencia  : [qué debe estar listo antes]
```

---

### Sección 3 — Estimación de impacto en tokens

Calcula los tokens promedio para tres tipos de sesión, antes y después de la migración. Basa los cálculos en los límites definidos en `VENESTAY_TIERED_MEMORY.md` (HOT < 200, WARM < 800).

| Tipo de sesión | Tokens ANTES | Tokens DESPUÉS | Reducción |
|:---|:---|:---|:---|
| Tarea del sprint activo | [N] | [N] | [%] |
| Tarea con referencia a sprint anterior | [N] | [N] | [%] |
| Consulta de historial completo | [N] | [N] | [%] |

Añade una nota explicando qué supuesto usaste para estimar el tamaño del `PROJECT_MEMORY.md` monolítico a lo largo del tiempo (ej: N sprints × M tokens por sprint).

---

### Sección 4 — Riesgos y plan de contingencia

Identifica exactamente tres riesgos. Para cada uno:

| Campo | Detalle |
|:---|:---|
| Riesgo | [descripción] |
| Probabilidad | ALTA / MEDIA / BAJA |
| Impacto | [qué pasa si ocurre] |
| Mitigación | [acción concreta para evitarlo] |
| Plan B | [qué hacer si la mitigación falla] |

---

### Sección 5 — Lo que NO cambia

Lista las partes del sistema `VENESTAY_AGENT_PROMPT_SDD.md` que permanecen exactamente igual después de la migración. El equipo no necesita revisar ni re-aprender estas partes.

Presenta como lista con una línea de justificación por ítem.

---

### Sección 6 — Decisiones requeridas antes del Sprint 1

Lista las preguntas que el equipo debe responder antes de que el agente ejecute cualquier sprint. Máximo 5 preguntas, ordenadas de mayor a menor prioridad. Sin estas respuestas el agente no avanza.

```
P1: [pregunta] — impacto: [qué cambia según la respuesta]
P2: [pregunta] — impacto: [qué cambia según la respuesta]
...
```

---

## BLOQUE 3 — FLUJO DE APROBACIÓN POR SPRINTS

Una vez emitido el informe, detente. No ejecutes ningún sprint.

El flujo desde ese punto es:

```
[Informe emitido]
      ↓
[Equipo revisa Sección 6 y responde las preguntas]
      ↓
[Equipo escribe exactamente: "Aprobado. Ejecutar Sprint 1"]
      ↓
[Agente ejecuta Sprint 1, entrega archivos, imprime MEMORY_HOT.md]
      ↓
[Equipo verifica entregables]
      ↓
[Equipo escribe exactamente: "Sprint 1 OK. Ejecutar Sprint 2"]
      ↓
[... y así hasta completar todos los sprints]
      ↓
[Equipo escribe: "Migración completa. Archivar PROJECT_MEMORY.md"]
      ↓
[Agente emite instrucción final de archivo y cierre]
```

El agente nunca avanza al sprint siguiente por iniciativa propia.
La frase de aprobación debe ser exacta — si el equipo escribe algo diferente, el agente debe pedir confirmación antes de proceder.

---

## BLOQUE 4 — RESTRICCIONES DE OPERACIÓN

Durante todo este proceso:

1. **Todo debe trazarse a los documentos verificados.** Si algo no está en `VENESTAY_AGENT_PROMPT_SDD.md` o en `VENESTAY_TIERED_MEMORY.md`, el agente lo declara como "no definido — requiere decisión del equipo".

2. **Informe y ejecución son fases separadas.** Durante el informe: cero archivos, cero código, cero plantillas. Solo análisis.

3. **Compatibilidad hacia atrás obligatoria.** El sistema resultante debe funcionar con el prompt maestro existente sin modificarlo.

4. **Un sprint a la vez.** Aunque el equipo apruebe todos los sprints juntos, el agente ejecuta de a uno.

5. **MEMORY_HOT.md al cierre de cada sprint.** Al terminar cada sprint el agente emite el archivo `MEMORY_HOT.md` actualizado, listo para copiar y reemplazar.

6. **PROJECT_MEMORY.md se mantiene operativo hasta el último sprint.** No se elimina ni se deja de actualizar hasta que el nuevo sistema esté completamente validado.

---

## BLOQUE 5 — INSTRUCCIÓN DE INICIO

Con los dos documentos adjuntos en el contexto de esta sesión, ejecuta ahora el Bloque 0.

Si la verificación es exitosa, procede directamente al Informe de Migración (Bloque 2).

---

*Prompt generado por la División de Ingeniería de IA — Antigravity · Mayo 2026*
*Versión: Opción B — carga explícita con verificación y bloqueo.*
*Usar únicamente como mensaje inicial de la sesión de migración.*
*No reutilizar en sesiones de desarrollo normal de VeneStay.*
