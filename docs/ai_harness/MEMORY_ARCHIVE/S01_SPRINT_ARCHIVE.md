# S01 — SPRINT ARCHIVE (COLD MEMORY)
_Sprint: S01 — Cimientos & Motor Transaccional_
_Período: Abril 2026 — 5 Mayo 2026_
_Estado: COMPLETADO · Gate: PASSED_

---

## Módulos entregados

| Módulo | Archivo principal | Estado final | Gate |
|:---|:---|:---|:---|
| Arquitectura FSD-lite | `src/` (estructura completa) | LISTO | PASSED |
| Firebase Auth SDK v10 | `src/services/auth-service.ts` | LISTO | PASSED |
| Firebase Firestore SDK v10 | `src/services/` | LISTO | PASSED |
| Firebase Storage (imágenes + KYC) | `src/services/` + `storage.rules` | LISTO | PASSED |
| UCP Protocol 20/80 | `src/services/booking-service.ts` + `firestore.rules` | LISTO | PASSED |
| Reviews Verificadas (Token de Trust) | `src/features/reviews/` + ReviewSession | LISTO | PASSED |
| Gestión de Imágenes | `src/features/dashboard/` (Drag & Drop + compresión) | LISTO | PASSED |
| Firestore Rules (v1) | `firestore.rules` — UCPTransactionPayload + propietario-only write | LISTO | PASSED |

---

## Decisiones técnicas — contexto completo

### DEC-S01-01: No usar localStorage para datos del Pasaporte VeneStay
**Fecha:** Mayo 2026 · **Autor:** Arquitectura
**Justificación completa:** localStorage es accesible por cualquier script del dominio (XSS), no se limpia al cerrar sesión por defecto, y los navegadores en modo privado lo bloquean. Los datos del Trust Score y perfil de identidad son sensibles y deben vivir solo en Firestore bajo las reglas de acceso definidas en `firestore.rules`.
**Afecta:** `src/features/auth/`, `src/features/passport/`, cualquier componente que maneje datos de usuario.
**Alternativa aprobada:** Firestore + Custom Claims de Firebase Auth para datos de sesión.

### DEC-S01-02: Cálculo de montos financieros solo en Cloud Functions
**Fecha:** Mayo 2026 · **Autor:** Arquitectura / UCP Protocol
**Justificación completa:** Los cálculos de comisiones, anticipos 20/80 y liquidaciones no pueden realizarse en el cliente porque el código cliente es inspeccionable y modificable. Cualquier discrepancia entre lo calculado en cliente y lo almacenado en Firestore podría llevar a inconsistencias financieras o fraude. El protocolo UCP exige atomicidad y trazabilidad.
**Afecta:** `src/features/bookings/`, `CheckoutPage.tsx`, `src/services/booking-service.ts`.
**Regla activa:** Ningún componente React puede calcular `totalAmount`, `commission` ni `hostNetPayout` — estos valores vienen de Cloud Functions o de Firestore como datos ya calculados.

### DEC-S01-03: Firestore Rules — propietario-only write para perfiles
**Fecha:** 4 Mayo 2026 · **Autor:** SRE Architect
**Justificación completa:** Para cumplir con las reglas de privacidad y evitar que un usuario modifique el perfil de otro, `firestore.rules` valida `request.auth.uid == userId` antes de cualquier write. Los documentos KYC se alojan bajo `/kyc/{uid}/` con acceso solo al propietario y roles admin.
**Afecta:** `firestore.rules`, `storage.rules`.

---

## Errores registrados — historial completo

### ERR-LISTING-01 — [06-MAY-2026]
**Módulo:** `ListingDetail.tsx`
**Tipo:** JSX_ERROR
**Descripción exacta:** `Unexpected token, expected ","` — llave de cierre `};` huérfana en el bloque de `useEffect`. Ocurrió durante la Restauración Forense de `ListingDetail.tsx`.
**Causa raíz:** Reemplazo masivo de bloques estructurales sin verificar el balance de llaves y la integridad de la firma del componente.
**Resolución:** Corrección manual del balance de llaves. Implementación de la regla preventiva: antes de cada `replace_file_content` en componentes de más de 500 líneas, ejecutar `view_file` del bloque exacto [StartLine, EndLine] para confirmar el contexto de cierre.
**Iteraciones:** 1 · **Gate final:** PASSED

### ERR-GIT-01 — [06-MAY-2026]
**Módulo:** Git workflow
**Tipo:** DATA_LOSS
**Descripción exacta:** Reversión accidental de Git — pérdida de cambios locales no commiteados de la sesión v0.9.5. El comando `git checkout -- .` fue ejecutado asumiendo que el estado local era irrelevante tras un cambio de contexto de sesión.
**Causa raíz:** Asunción incorrecta del estado del workspace sin verificar `git status` previo.
**Resolución:** Restauración del estado v0.9.5 mediante recuperación manual. Regla preventiva: prohibido `git checkout -- .` o `git reset --hard` sin `git stash` previo o verificación explícita de `git status`.
**Iteraciones:** 1 · **Gate final:** FIXED

---

## Criterios de aceptación globales establecidos en S01

1. **FSD Strict:** Prohibido crear componentes en `src/components` que pertenezcan a una `feature` específica.
2. **UCP Compliance:** Toda lógica de pago debe reflejar el desglose 20/80.
3. **Evidencia Visual:** Cada avance requiere una captura de pantalla validada.

---

_Archivado al cierre del Sprint S01. Fuente: PROJECT_MEMORY.md + HISTORY.md (sesiones Abril–5 Mayo 2026)._
