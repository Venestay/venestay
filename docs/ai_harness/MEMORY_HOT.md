# MEMORY_HOT — VeneStay Agent
_Sprint: S04 — Flujo Conversacional "Request to Book" (RE-IMPLEMENTACIÓN) · Actualizado: 2026-05-31_

## Estado ahora
SPRINT    : S04 (A-B-C) — Re-implementación desde cero (Código previo borrado/revertido)
QA_GATE   : PENDIENTE
BLOQUEANTE: ninguno

## Módulos a re-implementar (Sprint S04 completo)
| Módulo | Archivo Objetivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| Tipos y Contratos RTB | src/features/bookings/types/index.ts | REVERTIDO | 0/3 |
| Formulario Inline de Reserva | src/features/listings/components/DirectRequestForm.tsx | PENDIENTE | 0/3 |
| Integración y Bifurcación en Ficha | src/features/listings/components/ListingDetail.tsx | REVERTIDO | 0/3 |
| Tarjeta de Estado (Espera/Expiración/Rechazo) | src/features/bookings/components/BookingPendingApprovalCard.tsx | PENDIENTE | 0/3 |
| Reglas de Seguridad y Validación | firestore.rules | REVERTIDO | 0/3 |
| Dashboard Galería (Reordenamiento, Lápiz y Selección de Portada) | src/features/dashboard/components/form-steps/StepGallery.tsx | COMPLETADO | 1/3 |

## Próxima acción requerida (¡CRÍTICO PARA EL AGENTE!)
1. **Leer Obligatoriamente el Post-Mortem:** El agente entrante DEBE leer y analizar exhaustivamente [docs/ai_harness/handoff_diagnostic_report.md](file:///c:/VeneStay/docs/ai_harness/handoff_diagnostic_report.md) antes de escribir una sola línea de código.
2. **Evitar los Errores del Pasado:**
   * **Error de Permisos en Commit:** El backend de Firebase denegará escrituras de transacciones complejas en el cliente si hay discrepancias de identidad (`guestId` vs `request.auth.uid`) o si se intentan escribir mensajes de remitente `system` sin los privilegios correctos en `firestore.rules`.
   * **Violación de List Query:** La consulta de disponibilidad en el cliente debe alinearse perfectamente con las cláusulas `allow list` de Firestore Rules (incluyendo el estado `PENDING_APPROVAL`).
   * **Tipos Numéricos en Reglas:** Nunca uses `is number` en `firestore.rules`; causa un rechazo silencioso. Usa siempre `(is int || is float)` o `is int`.
3. **Seguir el Plan:** Estudiar y reconstruir el flujo siguiendo la especificación en [docs/plans/implementation_plan_rtb_v2.md](file:///c:/VeneStay/docs/plans/implementation_plan_rtb_v2.md).
