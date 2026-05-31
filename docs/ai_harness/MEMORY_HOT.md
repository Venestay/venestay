# MEMORY_HOT — VeneStay Agent
_Sprint: S04 · Actualizado: 2026-05-31_

## Estado ahora
SPRINT    : S04 — Optimización Flujo Pago Fase 1 + QR Asistido + UX Sin Fricción
QA_GATE   : OK (Compilación estática y linter limpios; segregadas perfectamente las fases de solicitud y pago en CheckoutPage bajo SPEC-CHECKOUT-004)
BLOQUEANTE: ninguno

## Módulos activos (solo los del sprint actual)
| Módulo | Archivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| Generador QR Dinámico (VES/BCV) | src/features/bookings/components/checkout/CheckoutPage.tsx | IMPL_COMPLETO | 1/3 |
| Pegado Inteligente Portapapeles & Compresión | src/features/bookings/components/checkout/CheckoutPage.tsx | IMPL_COMPLETO | 1/3 |
| UX Sin Fricción Post-Reserva (Mis Reservas) | src/features/bookings/components/checkout/CheckoutPage.tsx | IMPL_COMPLETO | 1/3 |
| Host Loyalty System | src/features/auth/types/ + functions/src/ | SPEC_LISTA / IMPL_PENDIENTE | 0/3 |
| Authenticator v2.0 | src/features/auth/ | SPEC_PENDIENTE | 0/3 |
| Notificaciones Push FCM & Triggers | functions/src/index.ts | EN_PLANIFICACION | 0/3 |
| Reserva Asíncrona & Soft-Block | src/features/bookings/ & src/features/dashboard/components/ | LISTO | 1/3 |
| Corrección guestMessage en Transacción | src/services/booking-service.ts | LISTO (Mensaje inicial creado post-commit) | 0/3 |
| Optimización UX Botón Dinámico de Reserva | src/features/dashboard/components/BookingList.tsx | EN_PLANIFICACION (Propuesta UX contextual lista) | 0/3 |

## Próxima acción requerida
1. Validar la optimización UX en `BookingList.tsx` para mostrar botones dinámicos contextualizados (`Aprobar y Solicitar Pago` / `Revisar Comprobante y Aprobar`) según el huésped haya adjuntado comprobante o no.
2. Validar el resultado de la validación estática de tipos de TypeScript (`npx tsc --noEmit` y `npm run lint`).
3. Copiar y pegar manualmente las reglas de Firestore y Storage en la consola web de Firebase para verificar las restricciones de comprobante < 800KB.
4. Avanzar con el Sprint S04-B para las funciones serverless de FCM.
