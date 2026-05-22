# ⚠️ DEPRECADO — VeneStay Project Memory (The Blackboard)

> **Este archivo fue reemplazado por el sistema Tiered Memory el 2026-05-22.**
> El agente ya NO lo carga como memoria activa.
>
> **Sistema activo:**
> - `docs/ai_harness/MEMORY_HOT.md` — estado del sprint actual (carga siempre)
> - `docs/ai_harness/MEMORY_WARM.md` — historial de sprints recientes (carga bajo demanda)
> - `docs/ai_harness/MEMORY_ARCHIVE/` — historial completo (solo bajo confirmación explícita)
>
> Este archivo se conserva como referencia histórica. No editar.

---

# 📒 VeneStay Project Memory (The Blackboard)

## 🚦 Estado de Sincronización Global
- **Versión:** v2.2.1.
- **Lanzamiento:** Beta Lechería - Julio 2026.
- **Última Decisión Crítica:** Priorización del Authenticator v2.0 (Premium Dark) y adopción de la metodología Spec-Driven Development (11-May-2026).
- **Estética Oficial:** Premium Dark (#0B1120) / Dorado (#C5A059).

## 🧠 Registro de Decisiones y Sincronización (Ledger)
| Fecha | Agente Líder | Decisión / Cambio Realizado | Estado de Gate | Sincronización |
| :--- | :--- | :--- | :---: | :---: |
| 04-May | SRE Architect | Corrección de sintaxis en ErrorBoundary y despliegue global. | [Gate: PASSED] | ✅ |
| 04-May | UCP Protocol | Ajuste de firestore.rules para UCPTransactionPayload. | [Gate: PASSED] | ✅ |
| 05-May | Agile Planner | Consolidación de 11 Skills en el Ecosistema de Agentes. | [Gate: PASSED] | ✅ |
| 05-May | Trust Architect | Definición del objeto ReviewSession condicionado a estado COMPLETED (UCP). | [Gate: PASSED] | ✅ |
| 05-May | Agile Planner | Sincronización de 'Reseñas Verificadas' en el ROADMAP.md. | [Gate: PASSED] | ✅ |
| 05-May | Master Orchestrator | Activación de Quality Gates (Compilation, Lint, Evidence, Security). | [Gate: PASSED] | ✅ |
| 05-May | DAG Coordinator | Integración de lógica de dependencias secuenciales. | [Gate: PASSED] | ✅ |
| 05-May | Master Orchestrator | Integración total de los 19 Skills (The Quality Stack & SOP v2.0) + QA Engineer. | [Gate: PASSED] | ✅ |
| 05-May | SRE Architect | Implementación de Storage Service con compresión y SEO dinámico (Lechería). | [Gate: PASSED] | ✅ |
| 05-May | Master Orchestrator | Reparación Quirúrgica Crítica: ListingDetail.tsx (JSX huérfano, firmas restauradas, unificación navigate). | [Gate: PASSED] | ✅ |
| 06-May | Master Orchestrator | **OPERACIÓN DE EMERGENCIA: Restauración Forense Completa.** Re-aplicación de v0.9.5: Checkout Consolidado, UX Premium y Fix de Estabilidad. | [Gate: PASSED after Self-Correction] | ✅ |
| 07-May | Master Orchestrator | **INICIO UNIFICACIÓN v2.2:** Integración de 11 AutoSkills (Vercel, Anthony Fu, midudev). | [Gate: PASSED] | ✅ |
| 07-MAY | Master Orchestrator | **INTELIGENCIA FINANCIERA v2.2:** [Sync: PASSED]. Implementación de motor de comisiones 12/10/8% y unificación de cálculos en Dashboard. | [Gate: PASSED] | ✅ |
| 07-MAY | Reality Auditor | **INCIDENTE: Test Stuck en Checkout.** El sub-agente falló en la validación por bucles en el calendario. Medida: Actualización de `SKILL_agent_browser.md` con protocolos financieros. | [Gate: FAILED -> FIXED] | ✅ |
| 07-MAY | Master Orchestrator | **SINCRONIZACIÓN BRIDGE v2.2:** Sincronización de los 11 AutoSkills globales con manuales locales mediante el modelo de Puente. | [Gate: PASSED] | ✅ |
| 07-MAY | Master Orchestrator | **OPERACIÓN SINCRONIZACIÓN TOTAL:** Refactorización de ListingForm (Zod Coercion + Lazy Maps) e integración del Pre-flight Check. | [Gate: PASSED] | ✅ |
| 07-MAY | Reality Auditor | **INCIDENTE: Comparación de Strings en Pisos.** La refactorización a Coerción de Zod dejó el estado interno como string, causando fallos de validación visual (`"5" > "10"`). Medida: Implementación de `Number()` en comparaciones inline del componente. | [Gate: FIXED] | ✅ |
| 07-MAY | UX Architect | **MEJORA DE NAVEGACIÓN:** Inserción de botón "Volver al Inicio" en `DashboardHeader.tsx` mediante icono `ArrowLeft` y `useNavigate`. Mejora del flujo de salida administrativo. | [Gate: PASSED] | ✅ |
| 07-MAY | SRE Architect | **PROTOCOLO DE CONTINGENCIA:** Implementación de bypass para Google Maps en `ListingForm.tsx`. Permite el avance de pruebas E2E mediante coordenadas forzadas de Lechería. | [Gate: PASSED] | ✅ |
| 08-MAY | Master Orchestrator | **RESTRICCIÓN ESTRATÉGICA:** Deshabilitación de 'VeneStay Local Guide (IA)' en ListingDetail.tsx. Código preservado bajo comentarios por política de privacidad/estabilidad. | [Gate: PASSED] | ✅ |
| 08-MAY | Master Orchestrator | **REPARACIÓN QUIRÚRGICA:** Restauración de lógica de perfil del anfitrión en ListingDetail.tsx. Solución al skeleton loader infinito. | [Gate: PASSED] | ✅ |
| 08-MAY | UX Architect | **REFACTOR DE LAYOUT:** Optimización de `ListingDetail.tsx` eliminando `overflow-hidden` y fijando la barra de navegación superior. El panel de reserva ahora es 100% sticky. | [Gate: PASSED] | ✅ |
| 08-MAY | UX Architect | **MINIMALISMO E INTEGRACIÓN:** Rediseño de la sección de anfitrión en `ListingDetail.tsx`. Eliminación de sombras, fondos y bordes pesados. Integración orgánica mediante separadores lineales. | [Gate: PASSED] | ✅ |
| 08-MAY | Master Orchestrator | **PASAPORTE v2.0:** Implementación del perfil experimental con Trust Score, estética minimalista y auditoría de accesibilidad. | [Gate: PASSED] | ✅ |
| 08-MAY | UX Architect | **PASAPORTE v2.1:** Pulido estético Premium con efectos de resplandor (glow), micro-animaciones y unificación de tarjetas VIP. | [Gate: PASSED] | ✅ |
| 08-MAY | SRE Architect | **RESILIENCIA CHECKOUT:** Corrección de error de carga de borradores. Actualización de `firestore.rules` (Public Profile Get) y manejo de errores en tiers. | [Gate: PASSED] | ✅ |
| 08-MAY | Master Orchestrator | **VALIDACIÓN E2E:** Verificación funcional total de los flujos de Perfil y Checkout tras correcciones de gobernanza. | [Gate: PASSED] | ✅ |
| 08-MAY | Master Orchestrator | **PRODUCT DIVISION:** Integración completa de los 5 agentes de producto (Manager, Prioritizer, Synthesizer, Researcher, Behavioral Nudge). | [Gate: PASSED] | ✅ |
| 09-MAY | Master Orchestrator | **DASHBOARD v2.3:** Optimización de Dashboard y refactorización integral del formulario de propiedades a Stepper UI con validaciones estrictas de métodos de pago bancarios y esquemas Zod. | [Gate: PASSED] | ✅ |
| 09-MAY | Master Orchestrator | **RESERVA ASÍNCRONA v2.5:** Implementación de lógica de bloqueo suave (Soft-Block) y gestión de conflictos para optimizar la conversión y evitar "bloqueos fantasmas". | [Gate: PASSED] | ✅ |
| 09-MAY | Product Strategist | **PROPUESTA v2.5+:** Creación del documento de optimización estratégica (TTL, Trust Score dinámico, Antifraude AI). | [Gate: REVIEW] | 🕒 |
| 11-MAY | Product Manager | **AUTHENTICATOR v2.0 (SDD):** Inicio de especificación para refactorización Premium del sistema de Auth. | [Gate: SPEC] | 🕒 |



## 👥 Ecosistema de Agentes de Producto (Product Division)
| Agente | Rol Principal | Disparadores / Casos de Uso |
| :--- | :--- | :--- |
| **Product Manager** | Liderazgo y estrategia holística. | "PRD", "Roadmap", "priorizar features", "Go-to-market". |
| **Sprint Prioritizer** | Planificación ágil y maximización de valor. | "Planificar sprint", "RICE", "Scrum", "asignar recursos". |
| **Feedback Synthesizer**| Análisis de feedback cualitativo. | "Analizar encuestas", "NPS", "tickets de soporte", "journey map". |
| **Trend Researcher** | Inteligencia de mercado y oportunidades. | "Análisis de competencia", "nuevas tendencias", "TAM/SAM". |
| **Behavioral Nudge** | Psicología conductual y formación de hábitos. | "Reducir fricción", "gamificación", "aumentar retención". |

## 🧬 Ecosistema de AutoSkills (Triggers & Mapping)
| Skill | Disparadores (Triggers) | Aplicación en VeneStay |
| :--- | :--- | :--- |
| **Accessibility** | "a11y audit", "WCAG compliance", "keyboard navigation", "screen reader" | Cumplimiento WCAG 2.2 en Checkout. |
| **Composition** | "boolean prop proliferation", "compound components", "React 19" | Refactorización de componentes de UI. |
| **Frontend Design** | "luxury UI", "landing pages", "beautify", "animations" | Estética Premium Dark / Lechería. |
| **Node.js Patterns** | "REST API", "middleware", "error handling", "backend" | Estabilidad de servicios Firebase/Functions. |
| **React Best Practices**| "waterfalls", "performance", "data fetching", "memo" | Optimización de ListingDetail y Dashboards. |
| **SEO** | "meta tags", "structured data", "sitemap", "ranking" | Visibilidad de propiedades en Lechería. |
| **Tailwind Patterns** | "v4 theme", "responsive", "design systems" | Estilización v4.0+ y Mobile-First. |
| **TS Advanced** | "generics", "conditional types", "type safety" | Robustez del sistema de pagos y UCP. |
| **Vite** | "vite.config.ts", "HMR", "plugins" | Velocidad de desarrollo y builds. |
| **Zod** | "safeParse", "z.infer", "schema validation" | Validación de payloads UCP y formularios. |
| **Node.js BP** | "async patterns", "security", "architecture" | Seguridad en el manejo de sesiones. |

## 🎯 Criterios de Aceptación Globales (Gobernanza)
1. **FSD Strict:** Prohibido crear componentes en `src/components` que pertenezcan a una `feature` específica.
2. **UCP Compliance:** Toda lógica de pago debe reflejar el desglose 20/80.
3. **Evidencia Visual:** Cada avance requiere una captura de pantalla validada por el `Reality Auditor`.

---

## 🚀 Propuestas Futuras (Pendientes de Aprobación)
| ID | Propuesta | Estado | Documento de Referencia |
| :--- | :--- | :--- | :--- |
| **V2.5-OPT** | Optimización Estratégica VeneStay (TTL, Trust Score, Antifraude) | Pendiente | [PROPUESTA_OPTIMIZACION_RESERVAS_V2.5.md](file:///c:/VeneStay/docs/PROPUESTA_OPTIMIZACION_RESERVAS_V2.5.md) |

## 🔐 Credenciales de Prueba (Autorizadas)
- **Usuario Maestro:** `anfitrionvenestay@venestay.com` (Utilizado para flujos de Huésped, Anfitrión y Admin).

## 🛠️ Entorno de Desarrollo
- **Puerto Local:** `http://localhost:3000/` (Configurado en `vite.config.ts`).
- **Host:** `0.0.0.0` (Permite acceso desde red local si es necesario).
- **Herramientas:** Vite 6.x, React 19.

