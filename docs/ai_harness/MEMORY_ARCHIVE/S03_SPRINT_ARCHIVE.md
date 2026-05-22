# S03 — SPRINT ARCHIVE (COLD MEMORY)
_Sprint: S03 — Loyalty System + Reserva Async + Authenticator v2.0_
_Período: 11 Mayo 2026 — en curso_
_Estado: EN CONSTRUCCIÓN · Gate: PENDIENTE_

> **Nota:** Este archivo se construye incrementalmente durante el sprint.
> Se archiva con contenido completo al cierre del Sprint S03.

---

## Módulos en progreso

| Módulo | Archivo principal | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| Host Loyalty System | `src/features/auth/types/` + `functions/src/` | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| Reserva Asíncrona & Soft-Block | `src/features/bookings/` | EN_PROGRESO | 0/3 |
| Authenticator v2.0 | `src/features/auth/` | SPEC_PENDIENTE | 0/3 |
| Migración Tiered Memory | `docs/ai_harness/` | LISTO | — |
| Integración de Agentes (Opción A) | `docs/plans/VENESTAY_AGENT_PROMPT_SDD.md` | LISTO | — |

---

## Specs del sprint (referencia completa)

### Spec activa: Host Loyalty System
**Documento:** `docs/specs/spec_host_loyalty_system.md`
**Descripción:** Sistema gamificado de niveles de lealtad (Bronce/Plata/Oro) con comisiones dinámicas 12/10/8%. Evaluación basada en ventana rodante de 365 días: alquileres completados, GMV, KYC y rating promedio.
**Arquitectura:** Cloud Function trigger `onReservationCompleted` + Cron `scheduledLoyaltyPruning` + campo `loyaltyStats` en perfil de usuario.
**Tipos definidos:** `LoyaltyTierType`, `HostLoyaltyStats`, extensión de `UserProfile` — en `src/features/auth/types/index.ts`.
**Firestore Rules:** Campo `loyaltyStats` y `currentCommissionRate` bloqueados para cliente — solo Admin SDK.

### Spec activa: Reserva Asíncrona & Soft-Block
**Documento:** ROADMAP.md `[/]` — en curso
**Estado:** Implementación iniciada en S02 para la UI; lógica de bloqueo suave en `booking-service.ts` en curso.

### Spec pendiente: Authenticator v2.0 (PRD)
**Documento:** `docs/specs/PRD_AUTHENTICATOR_V2.0.md`
**Descripción:** Refactorización del sistema de Auth a estética Premium Dark. Validación Zod, mapeo de errores, Rutas Protegidas.
**Prioridad:** P1 en ROADMAP Fase 2.
**Estado:** Spec emitida — implementación no iniciada.

---

## Decisiones técnicas — en construcción

- **[22-MAY-2026] Modal de confirmación de salida personalizado en Pasaporte (ConfirmExitModal)**: Reemplazamos la ventana emergente `window.confirm` nativa por un modal custom con estética Premium Dark y Glassmorphism para mantener una experiencia visual cohesiva y de alta gama en la navegación segura del perfil.

---

## Errores registrados — en construcción

_(Se completa si se detectan errores durante el sprint S03)_

---

## Migración del sistema de memoria — registro

### [22-MAY-2026] — Migración a Tiered Memory & Integración de Agentes completada
- Sprint M1: `MEMORY_HOT.md` creado en `docs/ai_harness/` (~130 tokens).
- Sprint M2: `MEMORY_WARM.md` creado en `docs/ai_harness/` (~580 tokens). S01 y S02 comprimidos.
- Sprint M3: `MEMORY_ARCHIVE/` creado. S01, S02 y S03 archivados.
- `PROJECT_MEMORY.md`: marcado como deprecado en Sprint M4 (LISTO).
- `VENESTAY_AGENT_PROMPT_SDD.md` Bloque 0: unificado y migrado a Tiered Memory (LISTO).
- Integración de Agentes (Opción A): Se ha añadido la tabla de asignación Nodo × Agente × Skills al Bloque 5 de `VENESTAY_AGENT_PROMPT_SDD.md` (LISTO).

---

_En construcción durante Sprint S03. Se archivará completo al cierre del sprint._
