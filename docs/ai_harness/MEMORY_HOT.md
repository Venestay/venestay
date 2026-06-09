# MEMORY_HOT — VeneStay Agent
_Sprint: S04 — KYC & Identity Verification · Actualizado: 2026-06-07_

## Estado ahora
SPRINT    : S04 — KYC & Identity Verification (Fase 4: Notificaciones por Email y Flujo Asegurar mi Estadía completados)
QA_GATE   : PASS (G10/G10 passed) | 2026-06-07
BLOQUEANTE: ninguno

## Módulos del Sprint S04 (En progreso)
| Módulo | Archivo Objetivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| **Fix Host Email Notification (P0)** | functions/package.json, functions/tsconfig.json, firebase.json, functions/src/booking.functions.ts | **COMPLETADO (Desplegado en Git Branch)** | 1/3 |
| **Email Notifications & Secure Stay Flow (P0)** | functions/src/booking.functions.ts, functions/src/kyc.functions.ts, functions/src/templates/, src/features/bookings/hooks/useCheckout.ts, src/services/booking-service.ts | **COMPLETADO (Refactored, Decoupled & Undefined Checkout Crash Fixed)** | 1/3 |
| **SPEC-AUTH-MODAL-OPTIMIZATION (P0)** | src/features/auth/components/AuthModal.tsx, src/features/auth/hooks/useAuthForm.ts, src/features/auth/schemas/auth.schema.ts, src/hooks/useFocusTrap.ts | **COMPLETADO** | 1/3 |
| **SPEC-AUTH-PASSWORD-RESET-OPTIMIZATION (P0)** | src/features/auth/components/PasswordReset.tsx, src/features/auth/hooks/usePasswordReset.ts, src/features/auth/schemas/auth.schema.ts, src/hooks/useFocusTrap.ts | **COMPLETADO** | 1/3 |
| **SPEC-DASHBOARD-AMENITIESICONS-01 (P1)** | src/features/dashboard/components/form-steps/StepGeneral.tsx, src/features/listings/components/ListingDetail.tsx, src/features/listings/utils/amenities-icons.ts | **COMPLETADO** | 1/3 |
| **SPEC-DASHBOARD-HOUSERULES-01 (P1)** | src/features/dashboard/components/form-steps/StepGeneral.tsx, src/features/listings/components/ListingDetail.tsx, src/features/listings/utils/amenities-icons.ts | **COMPLETADO** | 1/3 |
| **SPEC-LISTINGS-OPTIMIZATION (P1)** | src/features/listings/components/ListingDetail.tsx, src/features/listings/components/ListingGallery.tsx, src/features/listings/components/ListingMap.tsx, src/features/listings/components/ListingReviews.tsx, src/features/listings/components/HostContactCard.tsx, src/features/listings/components/BookingPanel.tsx, src/features/listings/hooks/useListingDetail.ts | **COMPLETADO** | 1/3 |
| Plan de Implementación KYC v2.0 | docs/plans/implementation_plan_kyc_v2.md | APROBADO | 0/3 |
| SPEC-KYC-01: Reglas y Tipos | storage.rules, firestore.rules, src/types/user.types.ts | COMPLETADO | 0/3 |
| Fase 1: MVP KYC Huésped | src/services/kyc-service.ts, functions/src/submitKYCDocument.ts | COMPLETADO (Desplegado a Firebase Cloud) | 0/3 |
| Fase 2: Panel Auditoría Admin | functions/src/approveKYC.ts, ... | COMPLETADO | 1/3 |
| Fase 3: Integración Checkout | src/features/bookings/components/checkout/CheckoutPage.tsx | COMPLETADO | 1/3 |
| Módulo 4: Optimización Auth | src/features/auth/components/AuthGuard.tsx, src/App.tsx | COMPLETADO | 1/3 |
| Módulo 5: Optimización `services/` | src/services/booking-service.ts, src/services/user-service.ts, functions/src/ | **COMPLETADO** | 1/3 |
| Módulo 2: Optimización `listings/` | src/features/listings/components/ListingDetail.tsx, utils/amenities-categories.ts | **COMPLETADO** | 1/3 |
| Módulo 3: Optimización `bookings/` | CheckoutPage.tsx, useCheckout.ts, BookingSummaryModal.tsx, useBookingSummary.ts, RescheduleRequestModal.tsx | **COMPLETADO** | 1/3 |
| Preparación Sprint 7: Análisis Tarifa de Limpieza | docs/plans/informe_tarifa_limpieza.md | COMPLETADO | 0/3 |
| Implementación SPEC-PRICING-CLEANINGFEE-01 | src/features/dashboard/types/dashboard.schema.ts, src/features/dashboard/components/form-steps/StepGeneral.tsx, src/constants/index.tsx | COMPLETADO | 0/3 |
| **SPEC-BOOKINGS-STATETRANSITION-FIX (P0)** | src/features/bookings/components/MyTrips.tsx | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-CHAT-LAYOUT-FIX (P1)** | src/features/bookings/components/MyTrips.tsx | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-UX-REDESIGN (P1)** | src/features/bookings/components/MyTrips.tsx, src/components/Chat.tsx | **COMPLETADO** | 1/3 |
| **Fix Infra Vercel (P0)** | vercel.json, ErrorBoundary.tsx | **COMPLETADO** | 1/3 |
| **Unificación de Ramas** | Rama principal (`main`) | **COMPLETADO** | 1/3 |
| **Política de Cancelación Reprogramable (P1)** | useRescheduleRequest.ts, RescheduleRequestModal.tsx, CancellationPolicyCard.tsx, ... | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-SUMMARY-01 (P1)** | src/features/bookings/components/BookingSummaryModal.tsx, src/features/bookings/components/MyTrips.tsx | **COMPLETADO** | 1/3 |
| **SPEC-BOOKINGS-OPTIMIZATION (P0)** | CheckoutPage.tsx, useCheckout.ts, BookingSummaryModal.tsx, useBookingSummary.ts, RescheduleRequestModal.tsx | **COMPLETADO** | 1/3 |

## Notas de Integración / Estado de Emuladores
*   **Java JDK Configurado:** Java se localizó en `C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin`.
*   **Emuladores Locales:** Firestore y Storage emulados correctamente en puertos `8080` y `9199`.
*   **Deploy Exitoso:** Reglas de seguridad (`firestore.rules` y `storage.rules`) desplegadas con éxito en el proyecto `gen-lang-client-0727178605`.
*   **Resultados QA (Fase 3):** 
    - *Módulo 5 (Services/Functions):* Reestructuración de Cloud Functions modularizada. Integración de reintentos `withRetry` en escrituras de Firestore.
    - *Módulo 2 (Listings):* Desacoplamiento de categorización de comodidades a `amenities-categories.ts`. Mejoras de accesibilidad y roles A11y.
    - *Módulo 3 (Bookings):* Corrección de hook `useMemo` en `CheckoutPage.tsx` y uso de `useFocusTrap` en modales.
*   **Merge FF/No-FF realizado:** Se fusionaron de forma segura las ramas de desarrollo en `main`. Se eliminaron las ramas locales ya integradas.

## Próxima acción requerida
1. **Ejecutar Script de Claims (P0)**: Ejecutar el script `scripts/set-qa-claim.cjs` usando la terminal alternativa del usuario que tiene instalado Firebase CLI y habilitado el MCP para asignar el claim `qa: true` a las cuentas de prueba (ej. `huespedvenestay@gmail.com`).
2. **Módulo 2 — `listings/` (Planificación)**: Iniciar la planificación y especificación atómica de la refactorización de listings una vez solventado el error de permisos.
3. **Mantener validaciones**: Garantizar que toda la suite de validación `run-validation.cjs` (G1-G10) siga pasando en verde.
