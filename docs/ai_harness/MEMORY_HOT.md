# MEMORY_HOT — VeneStay Agent
_Sprint: S03 · Actualizado: 2026-05-28_

## Estado ahora
SPRINT    : S03 — Loyalty System + Reserva Async + Authenticator v2.0
QA_GATE   : FALLO (Pruebas manuales fallidas en ListingForm)
BLOQUEANTE: Optimización del Wizard ListingForm

## Módulos activos (solo los del sprint actual)
| Módulo | Archivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| Host Loyalty System | src/features/auth/types/ + functions/src/ | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| Reserva Asíncrona & Soft-Block (Fase 1 a 5) | src/features/bookings/ & src/features/dashboard/components/ | LISTO | 0/3 |
| Authenticator v2.0 | src/features/auth/ | SPEC_PENDIENTE | 0/3 |
| Migración Tiered Memory | docs/ai_harness/ | LISTO | — |
| Integración de Agentes (Opción A) | docs/plans/VENESTAY_AGENT_PROMPT_SDD.md | LISTO | — |
| ConfirmExitModal Personalizado | src/features/auth/components/ConfirmExitModal.tsx | LISTO | — |
| Distintivo Rojo "Nuevo" en Dashboard | src/features/dashboard/components/ListingList.tsx | LISTO | — |
| Panel de Reserva Colapsable (Drawer Adaptativo) | src/features/listings/components/ListingDetail.tsx | LISTO | — |
| Evolución de Comodidades Premium | src/features/dashboard/components/form-steps/StepGeneral.tsx | LISTO | — |
| Copy & Políticas de Cancelación en Detalle | src/features/listings/components/ListingDetail.tsx | LISTO | — |
| useGuestProfile (hook) | src/features/dashboard/hooks/useGuestProfile.ts | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| GuestRequestVerificationDrawer | src/features/dashboard/components/GuestRequestVerificationDrawer.tsx | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| BookingList — botón Verificar | src/features/dashboard/components/BookingList.tsx | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| AdminDashboard — orquestación drawer | src/features/dashboard/components/AdminDashboard.tsx | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| Corrección de Layout de Botones (VFX Fix) | src/index.css & ListingDetail.tsx | LISTO | 1/3 |
| Visualización de Datos de Pago ("Otro" / PayPal) | CheckoutPage.tsx | LISTO | 1/3 |
| Rediseño Minimalista de Datos de Pago (Desktop) | CheckoutPage.tsx | LISTO | 1/3 |
| Optimización de Navegación y Botón Dinámico | src/features/dashboard/components/ListingForm.tsx | FALLO (Pruebas manuales fallidas) | 1/3 |

## Próxima acción requerida
La optimización del Wizard (`ListingForm.tsx`) para incluir el guardado dinámico por paso y el cierre Frictionless en la X falló en las pruebas manuales. 

**Hipótesis de Causa Raíz**: En React, `editingListing` puede actualizarse asíncronamente en los primeros renders a partir de Firebase o localStorage. Al crearse el `initialListingSnapshot.current` en el primer render, captura un estado incompleto o vacío, causando que `isStepModified` reporte falsas modificaciones y falle el botón "Actualizar" y el modal ConfirmExitModal.

En la próxima sesión se debe detener el pipeline, resolver esta asincronía (por ejemplo, retrasando la captura del snapshot hasta que `isLoaded` sea verdadero o el ID esté disponible con datos), re-planificar y proceder tras la aprobación del usuario.

