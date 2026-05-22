# MEMORY_WARM — VeneStay Agent
_Últimos 2 sprints · Actualizado: 2026-05-22_

## Sprints completados (resumen comprimido)

### S01 — Cimientos & Motor Transaccional · Completado Mayo 2026
Entregado: FSD arquitectura, Firebase Auth/Firestore/Storage, UCP 20/80 completo, Reviews Verificadas, Gestión de Imágenes con Drag&Drop
Decisiones clave: UCP 20/80 como contrato financiero no modificable post-conciliación · localStorage prohibido para datos de pasaporte (riesgo XSS)
Errores resueltos: ERR-LISTING-01, ERR-GIT-01

### S02 — Unificación v2.2 & Dashboard Pro · Completado Mayo 2026
Entregado: Dashboard Stepper UI + validación Zod bancaria, Comisiones 12/10/8%, Pasaporte v2.0–v2.1 (Trust Score + glow), Reserva Asíncrona Soft-Block, Resiliencia Checkout, VeneStay Local Guide deshabilitado (política estabilidad)
Decisiones clave: Cálculo de Tier centralizado en `commission.ts` (no en componentes) · IA Guide diferida a post-lanzamiento por política de privacidad/estabilidad
Errores resueltos: ERR-TSC-01, ERR-TSC-02, ERR-FORM-01, ERR-FORM-02, ERR-PROFILE-01, ERR-SYNC-01

---

## Decisiones técnicas activas (afectan código futuro)
| Decisión | Justificación resumida | Sprint | Afecta |
|:---|:---|:---|:---|
| No usar localStorage para datos de pasaporte | Riesgo XSS + datos sensibles KYC → solo Firestore | S01 | auth, passport |
| Cálculo financiero solo en Cloud Functions | Montos nunca en cliente — integridad UCP | S01 | bookings, checkout |
| Cálculo de Tier en `commission.ts` centralizado | Evitar discrepancias matemáticas entre Dashboard y Checkout | S02 | dashboard, checkout |
| `loyaltyStats` solo escribible por admin SDK | Blindaje Firestore — cliente no puede modificar comisión | S02 | firestore.rules, auth |
| IA Guide deshabilitada bajo comentarios | Código preservado para post-lanzamiento sin regresión de estabilidad | S02 | ListingDetail |

---

## Errores resueltos — índice
| ID | Módulo | Resolución en una línea |
|:---|:---|:---|
| ERR-LISTING-01 | ListingDetail.tsx | JSX huérfano `};` en useEffect — verificar balance de llaves antes de replace masivo |
| ERR-GIT-01 | Git workflow | `git checkout -- .` prohibido sin `git stash` previo — pérdida de cambios v0.9.5 |
| ERR-TSC-01 | FloatingChatProps | Desync de interfaz TSC — leer definición del componente antes de instanciarlo |
| ERR-TSC-02 | ZodError | Uso de `.errors` incorrecto — validar propiedades de tipos externos antes de acceder |
| ERR-FORM-01 | ListingForm | Truncamiento de campos en refactor — Field Mapping obligatorio antes de fragmentar monolito |
| ERR-FORM-02 | ListingForm | Pérdida de iconos de métodos de pago — paridad UX incluye layout e iconografía, no solo datos |
| ERR-PROFILE-01 | ListingDetail | Skeleton loader infinito en perfil anfitrión — `useEffect` de fetching con `finally` obligatorio |
| ERR-SYNC-01 | Agent output | Say-do gap — no reportar acción como completada hasta confirmación de tool call exitoso |
