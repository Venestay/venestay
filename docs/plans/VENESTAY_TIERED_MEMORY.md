# VeneStay Agent — Sistema de Memoria por Capas (Tiered Memory)
## Solución al problema de consumo excesivo de tokens

> **Problema que resuelve este documento:**
> `PROJECT_MEMORY.md` crece con cada sesión. Si el agente lo carga completo siempre,
> el costo en tokens escala indefinidamente y los contextos más relevantes quedan
> enterrados bajo historial irrelevante.

---

## El principio: no toda la memoria se necesita con la misma frecuencia

La solución no es leer menos — es leer **solo lo que la tarea actual necesita**.
Se divide la memoria en tres capas con tamaños máximos definidos y reglas de promoción/degradación entre ellas.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE MEMORIA                       │
│                                                                  │
│  CAPA 1 — HOT MEMORY         MEMORY_HOT.md       < 200 tokens  │
│  "Lo que necesito ahora"     Carga: SIEMPRE                     │
│  ─────────────────────────────────────────────────────────────  │
│  CAPA 2 — WARM MEMORY        MEMORY_WARM.md       < 800 tokens  │
│  "Lo que usé esta semana"    Carga: solo si la tarea lo pide    │
│  ─────────────────────────────────────────────────────────────  │
│  CAPA 3 — COLD MEMORY        MEMORY_ARCHIVE/      sin límite    │
│  "Lo que ya terminó"         Carga: nunca automáticamente       │
│                              Solo si se pide explícitamente     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Capa 1 — HOT MEMORY (`MEMORY_HOT.md`)

**Límite estricto: 200 tokens (~150 palabras). Se carga en CADA sesión, sin excepción.**

Contiene únicamente el estado que cambia sprint a sprint. Si algo lleva más de dos sprints sin cambiar, no pertenece aquí.

### Plantilla fija (estructura invariable):

```markdown
# MEMORY_HOT — VeneStay Agent
_Sprint: S[N] · Actualizado: [FECHA]_

## Estado ahora
SPRINT    : S[N] — [objetivo en máximo 8 palabras]
QA_GATE   : [OK / FALLO / PENDIENTE]
BLOQUEANTE: [módulo bloqueado o "ninguno"]

## Módulos activos (solo los del sprint actual)
| Módulo | Archivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| [nombre] | [ruta] | [EN_PROGRESO/LISTO/FALLO] | [N/3] |

## Próxima acción requerida
[Una sola oración: qué debe hacer el agente si el usuario no especifica nada]
```

**Ejemplo real con datos:**

```markdown
# MEMORY_HOT — VeneStay Agent
_Sprint: S03 · Actualizado: 2026-05-21_

## Estado ahora
SPRINT    : S03 — Checkout server-side + fix double-booking
QA_GATE   : FALLO
BLOQUEANTE: booking-service.ts (iteración 2/3)

## Módulos activos
| Módulo | Archivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| booking-service | src/services/booking-service.ts | FALLO | 2/3 |
| CheckoutCloudFn | functions/src/checkout.ts | EN_PROGRESO | 0/3 |

## Próxima acción requerida
Corregir falla ERR-BOOKING-002 en runTransaction antes de avanzar al checkout.
```

**Regla de mantenimiento:** Si el archivo supera las 200 tokens, el agente debe mover el módulo más antiguo a WARM antes de añadir contenido nuevo.

---

## Capa 2 — WARM MEMORY (`MEMORY_WARM.md`)

**Límite: 800 tokens. Se carga SOLO cuando la tarea del usuario lo requiere.**

### Cuándo carga el agente esta capa:

El agente evalúa el pedido del usuario contra estas condiciones antes de decidir si cargar WARM:

```
CARGAR WARM si el pedido menciona:
  → Un módulo que NO está en HOT (fue completado en sprint anterior)
  → Una decisión técnica pasada ("¿por qué elegimos X?")
  → Un error resuelto ("ese bug que tuvimos con Firestore")
  → Specs de sprints anteriores como referencia
  → Cualquier pregunta sobre "cómo lo hicimos antes"

NO CARGAR WARM si:
  → El pedido es una tarea nueva del sprint actual (todo está en HOT)
  → El pedido es una pregunta conceptual sin relación a historial
  → El usuario pide código desde cero para un módulo nuevo
```

### Estructura de WARM:

```markdown
# MEMORY_WARM — VeneStay Agent
_Últimos 3 sprints · Actualizado: [FECHA]_

## Sprints completados (resumen comprimido)

### S01 — [objetivo] · Completado [FECHA]
Entregado: [lista de módulos en una línea]
Decisiones clave: [máximo 2 decisiones en una línea cada una]
Errores resueltos: [IDs de errores, no descripción completa]

### S02 — [objetivo] · Completado [FECHA]
Entregado: [lista de módulos en una línea]
Decisiones clave: [máximo 2 decisiones en una línea cada una]
Errores resueltos: [IDs de errores, no descripción completa]

## Decisiones técnicas activas (afectan código futuro)
| Decisión | Justificación resumida | Sprint | Afecta |
|:---|:---|:---|:---|
| [decisión] | [por qué — máx 10 palabras] | S[N] | [módulos] |

## Errores resueltos — índice
| ID | Módulo | Resolución en una línea |
|:---|:---|:---|
| ERR-BOOKING-001 | booking-service | runTransaction con retry en conflicto de escritura |
```

**Regla de mantenimiento:** WARM solo retiene los últimos 3 sprints. Al entrar el sprint 4, el sprint 1 se comprime y mueve a COLD.

---

## Capa 3 — COLD MEMORY (`MEMORY_ARCHIVE/`)

**Sin límite de tamaño. El agente NUNCA la carga automáticamente.**

Es un directorio de archivos con nombre `S[N]_SPRINT_ARCHIVE.md`. Contiene el historial completo de cada sprint: specs originales, todos los errores y sus iteraciones, decisiones técnicas con contexto completo.

```
/docs/agent/
  MEMORY_HOT.md                   ← carga siempre (< 200 tokens)
  MEMORY_WARM.md                  ← carga si el pedido lo requiere (< 800 tokens)
  MEMORY_ARCHIVE/
    S01_SPRINT_ARCHIVE.md         ← historial completo del sprint 1
    S02_SPRINT_ARCHIVE.md         ← historial completo del sprint 2
    S03_SPRINT_ARCHIVE.md         ← en construcción durante el sprint actual
```

**Cuándo cargar COLD:** Solo si el usuario lo pide explícitamente con un pedido como "necesito revisar el historial del sprint 1" o "¿cuál fue la spec original de booking-service?". El agente responde: *"Voy a cargar el archivo `S01_SPRINT_ARCHIVE.md` para responder esto. Tarda más y consume más tokens — ¿confirmas?"*

---

## Protocolo de compresión (cuándo y cómo comprimir)

El agente aplica compresión automática al cerrar un sprint. La compresión sigue estas reglas:

### Regla de compresión de errores

```
ANTES (en WARM, 40 tokens por error):
  ERR-BOOKING-002
  Módulo: booking-service.ts
  Descripción: runTransaction fallaba silenciosamente cuando dos usuarios
  intentaban reservar el mismo bloque de fechas simultáneamente. El segundo
  usuario recibía una confirmación falsa porque la verificación de disponibilidad
  ocurría fuera de la transacción atómica.
  Resolución: Mover la verificación de disponibilidad dentro del runTransaction
  usando get() antes del set(), garantizando atomicidad completa.
  Iteraciones: 2

DESPUÉS (en COLD, índice en WARM, 8 tokens):
  ERR-BOOKING-002 | booking-service | verificación disponibilidad dentro de runTransaction
```

### Regla de compresión de decisiones

```
ANTES (en WARM):
  Decisión: No usar localStorage para datos del pasaporte VeneStay
  Justificación completa: localStorage es accesible por cualquier script
  del dominio (XSS), no se limpia al cerrar sesión por defecto, y los
  navegadores en modo privado lo bloquean. Los datos del Trust Score y
  perfil de identidad son sensibles y deben vivir solo en Firestore
  bajo las reglas de acceso definidas en firestore.rules.
  Sprint: S01 · Autor: arquitectura

DESPUÉS (en WARM comprimido):
  No usar localStorage para datos de pasaporte — riesgo XSS + datos sensibles → solo Firestore
```

---

## Cómo el agente decide qué cargar en cada sesión

```
AL RECIBIR UN PEDIDO:

1. Cargar HOT siempre (< 200 tokens, costo fijo mínimo)

2. Evaluar el pedido:

   ┌─ ¿El pedido involucra el sprint actual? ─────────────────────┐
   │  SÍ → HOT es suficiente. No cargar WARM.                     │
   └──────────────────────────────────────────────────────────────┘

   ┌─ ¿El pedido menciona historial, sprints pasados o decisiones? ┐
   │  SÍ → Cargar WARM adicionalmente.                             │
   └───────────────────────────────────────────────────────────────┘

   ┌─ ¿El pedido pide un archivo específico de archivo? ──────────┐
   │  SÍ → Cargar COLD bajo confirmación explícita del usuario.   │
   └──────────────────────────────────────────────────────────────┘

3. Imprimir solo las secciones de WARM relevantes al pedido,
   no el archivo completo si solo se necesita una sección.
```

---

## Costo en tokens por escenario

| Escenario | Archivos cargados | Tokens consumidos |
|:---|:---|:---|
| Tarea nueva del sprint actual | Solo HOT | ~200 |
| Tarea que referencia sprint anterior | HOT + WARM | ~1.000 |
| Consulta de historial completo de un sprint | HOT + WARM + 1 COLD | ~1.000 + tamaño del archivo |
| Sin memoria (sistema actual sin capas) | MEMORY.md completo | Crece sin límite |

---

## Instrucción final para el agente (añadir al system prompt)

Reemplazar el Bloque 0 del prompt principal con este texto:

```
## BLOQUE 0 — MEMORIA POR CAPAS (TIERED MEMORY)

Al iniciar cada sesión:
  1. Cargar MEMORY_HOT.md (siempre, sin condición).
  2. Evaluar si el pedido requiere MEMORY_WARM.md (ver criterios).
  3. Nunca cargar MEMORY_ARCHIVE/ sin confirmación explícita del usuario.

Al cerrar cada sesión:
  1. Actualizar MEMORY_HOT.md con el estado actual del sprint.
  2. Si un módulo se completó: moverlo a MEMORY_WARM.md.
  3. Si el sprint cerró: comprimir WARM y archivar en MEMORY_ARCHIVE/S[N].md.
  4. Emitir los archivos actualizados listos para copiar.

Límites que el agente debe respetar:
  MEMORY_HOT.md  → máximo 200 tokens. Si supera: comprimir inmediatamente.
  MEMORY_WARM.md → máximo 800 tokens. Si supera: archivar sprint más antiguo.
```

---

*División de Ingeniería de IA — Antigravity · Mayo 2026*
