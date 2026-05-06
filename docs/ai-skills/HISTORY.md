# 📜 Historial Evolutivo y Error Ledger - VeneStay

Este documento consolida la historia del proyecto y las reglas preventivas derivadas de errores pasados, permitiendo a los agentes visualizar la trayectoria técnica sin auditar logs antiguos.

---

## 📅 Línea de Tiempo de Hitos

### Fase: Cimentación y Agente-Nativa (Mayo 2026)
- **Hito:** Consolidación del Ecosistema de 19 Skills.
- **Versión:** v0.9.5
- **Cambios Clave:**
    - Migración de documentación a `docs/ai-skills/`.
    - Implementación del **Agentic Loop v2.0**.
    - Definición del Protocolo de Sincronización de 5 Archivos.
- **Impacto:** Establecimiento de un marco de trabajo donde la IA puede auto-regularse y validar su propio código.

### Fase: Optimización de Conversión (Mayo 2026)
- **Hito:** Refactor de Checkout y Psicología de Marketing.
- **Cambios Clave:**
    - Transformación del Panel de Pago de 3 bloques a 1 selector unificado.
    - Implementación de Micro-copy persuasivo ("Asegurar mi Estancia").
- **Impacto:** Reducción de la fricción cognitiva en el flujo de reserva.

---

## ⚠️ Error Ledger (Reglas Preventivas)

| Error Detectado | Agente / Fecha | Causa Raíz | Regla Preventiva (Obligatoria) |
| :--- | :--- | :--- | :--- |
| **BUG-001:** null crash en ListingDetail | SRE (06-May) | Carga directa de URL sin validación de datos. | Usar **Optional Chaining** y `Skeleton Loaders` en todas las páginas con fetch dinámico. |
| **BUG-002:** Import incorrecto framer-motion | SRE (06-May) | Cambio de API en React 19. | Usar siempre `import { motion } from "motion/react"` para animaciones. |
| **UI Orphans:** JSX huérfano en ListingDetail | Master (05-May) | Refactorización incompleta. | Ejecutar `npx tsc --noEmit` antes de cualquier commit en `PROJECT_MEMORY.md`. |

---

## 🧠 Decisiones de Arquitectura (SSoT)

1. **Decisión:** *Uso de FSD Strict.*
   - **Por qué:** Evitar acoplamiento en componentes `Shared`.
2. **Decisión:** *Protocolo UCP (Universal Commerce Protocol).*
   - **Por qué:** Transparencia en pagos 20/80 en Venezuela.

---
*Este documento es una representación viva de la memoria del proyecto.*
