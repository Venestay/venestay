# 📒 VeneStay Project Memory (The Blackboard)

## 🚦 Estado de Sincronización Global
- **Versión:** v0.9.5.
- **Lanzamiento:** Beta Lechería - Julio 2026.
- **Última Decisión Crítica:** Estabilización de Checkout y ErrorBoundary (04-May-2026).
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
