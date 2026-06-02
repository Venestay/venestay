# MEMORY_HOT — VeneStay Agent
_Sprint: S04 — Flujo Conversacional "Request to Book" (RTB) · Actualizado: 2026-06-01_

## Estado ahora
SPRINT    : S04 (A-B-C) — Flujo Corto RTB (Mitigaciones de Seguridad Implementadas)
QA_GATE   : OK (tsc y lints en verde)
BLOQUEANTE: ninguno

## Módulos del Sprint S04
| Módulo | Archivo Objetivo | Estado | Iteraciones QA |
|:---|:---|:---|:---|
| Tipos y Contratos RTB | src/features/bookings/types/index.ts | COMPLETADO | 0/3 |
| Formulario Inline de Reserva | src/features/listings/components/DirectRequestForm.tsx | COMPLETADO (Trust Gate) | 0/3 |
| Integración y Bifurcación en Ficha | src/features/listings/components/ListingDetail.tsx | COMPLETADO | 0/3 |
| Tarjeta de Estado & Mis Viajes | src/features/bookings/components/MyTrips.tsx | COMPLETADO (Comprobantes Obligatorios) | 0/3 |
| Panel de Verificación | src/features/dashboard/components/GuestRequestVerificationDrawer.tsx | COMPLETADO (UI Paso 2 Unificada) | 0/3 |
| Cloud Functions (Seguridad) | functions/src/index.ts | COMPLETADO | 0/3 |
| Reglas de Storage | storage.rules | COMPLETADO | 0/3 |

## Próxima acción requerida (Handoff Context)
1. **Despliegue de Backend:** El agente entrante debe inicializar Firebase Functions e instalar las dependencias en `/functions` (`npm install`), y posteriormente desplegar las funciones (`firebase deploy --only functions`).
2. **Ejecutar Pruebas Funcionales (E2E):** Realizar pruebas manuales del flujo Request to Book (RTB) acortado (4 pasos).
3. **Puntos Clave Finalizados en la Sesión Anterior:**
   * **Mitigación "Soft-Block Zombie":** Creado el Cron Job que cancela reservas si pasa el `paymentExpiresAt` (24 horas).
   * **Prevención de Colisión:** Lógica transaccional añadida en `approveBookingRequestWithDetails` para rechazar colisiones al aprobar.
   * **Inyección de Chat Segura:** Trigger `onBookingStateChanged` implementado en Backend para enviar notificaciones de estado en lugar de hacerlo en el cliente.
   * **Caja de Aprobación Unificada:** El Anfitrión ahora selecciona la cuenta de pago al aprobar, enviando todos los datos en 1 solo paso.
   * **Trust Gate & Comprobantes:** Los huéspedes necesitan >40% Trust Score para pedir reserva, y el comprobante en imagen es obligatorio.
4. **Archivos de Resumen Disponibles:** Revisar el artefacto `walkthrough.md` en el historial o carpeta de artefactos de la sesión anterior para entender todas las piezas de código que se modificaron.
