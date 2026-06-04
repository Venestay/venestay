# MEMORY_HOT — VeneStay Agent
_Sprint: S04 — KYC & Identity Verification · Actualizado: 2026-06-04_

## Estado ahora
SPRINT    : S04 — KYC & Identity Verification
QA_GATE   : PASS (10/10 Gajes de validación locales pasados con éxito en main)
BLOQUEANTE: ninguno

## Módulos del Sprint S04 (En progreso)
| Módulo | Archivo Objetivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| Plan de Implementación KYC v2.0 | docs/plans/implementation_plan_kyc_v2.md | APROBADO | 0/3 |
| SPEC-KYC-01: Reglas y Tipos | storage.rules, firestore.rules, src/types/user.types.ts | COMPLETADO | 0/3 |
| Fase 1: MVP KYC Huésped | src/services/kyc-service.ts, functions/src/submitKYCDocument.ts | COMPLETADO (Desplegado a Firebase Cloud) | 0/3 |
| Fase 2: Panel Auditoría Admin | functions/src/approveKYC.ts, ... | PENDIENTE (Siguiente paso) | 0/3 |
| Fase 3: Integración Checkout | src/features/bookings/components/checkout/CheckoutPage.tsx | PENDIENTE | 0/3 |
| Preparación Sprint 7: Análisis Tarifa de Limpieza | docs/plans/informe_tarifa_limpieza.md | COMPLETADO | 0/3 |
| Implementación SPEC-PRICING-CLEANINGFEE-01 | src/features/dashboard/types/dashboard.schema.ts, src/features/dashboard/components/form-steps/StepGeneral.tsx, src/constants/index.tsx | COMPLETADO | 0/3 |
| **SPEC-BOOKINGS-STATETRANSITION-FIX (P0)** | src/features/bookings/components/MyTrips.tsx | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-CHAT-LAYOUT-FIX (P1)** | src/features/bookings/components/MyTrips.tsx | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-UX-REDESIGN (P1)** | src/features/bookings/components/MyTrips.tsx, src/components/Chat.tsx | **COMPLETADO** | 1/3 |
| **Fix Infra Vercel (P0)** | vercel.json, ErrorBoundary.tsx | **COMPLETADO** | 1/3 |
| **Unificación de Ramas** | Rama principal (`main`) | **COMPLETADO** | 1/3 |

## Notas de Integración / Estado de Emuladores
*   **Java JDK Configurado:** Java se localizó en `C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin`.
*   **Emuladores Locales:** Firestore y Storage emulados correctamente en puertos `8080` y `9199`.
*   **Deploy Exitoso:** Reglas de seguridad (`firestore.rules` y `storage.rules`) desplegadas con éxito en el proyecto `gen-lang-client-0727178605`.
*   **Resultados QA:** TypeScript compila con éxito (0 errores). ESLint sin errores en código nuevo (0 errores, solo warnings históricos heredados).
*   **Merge FF/No-FF realizado:** Se fusionaron de forma segura las ramas de desarrollo en `main`. Se eliminaron las ramas locales ya integradas.
*   **Fix P0 aplicado (2026-06-04):** Corregido bug crítico en MyTrips.tsx donde reservas rechazadas desaparecían de la vista activa y el huésped veía otra reserva como "Confirmada". Ahora las reservas terminales recientes (<48h) permanecen visibles en la sección principal con fondo rojo. Eliminado slice(0,1). Auto-expansión de historial cuando no hay activos.
*   **Fix P1 aplicado (2026-06-04):** Corregido ReferenceError `raw` -> `updatedRaw` que ocultaba el historial de viajes. Añadido chat persistente de escritorio en el lado derecho y un alternador de chat ("Ver Chat") en las tarjetas de reservas activas.
*   **Rediseño UX aplicado (2026-06-04):** Completado el rediseño completo de Mis Viajes según PROMPT_UX_MIS_VIAJES.md. Layout de dos columnas fluidas al 100% en desktop, diseño de tarjetas compactas BookingCard unificando fechas/viajeros y desglose financiero en una línea, y sistema de pestañas de navegación móvil (Reservas/Chat).
*   **Fix Infra Vercel aplicado (2026-06-04):** Solucionado el error `ChunkLoadError` ("Failed to fetch dynamically imported module") en despliegues. Se agregaron políticas de `Cache-Control` explícitas en `vercel.json` y se inyectó un cache buster (`?t=timestamp`) en `src/components/ui/ErrorBoundary.tsx` para forzar recargas limpias post-despliegue.

## Próxima acción requerida
1. Iniciar el desarrollo de la Fase 2 del Sprint S04 (Panel Auditoría Admin KYC) para continuar con el flujo completo de verificación de identidad de VeneStay.

