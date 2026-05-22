# S02 — SPRINT ARCHIVE (COLD MEMORY)
_Sprint: S02 — Unificación v2.2 & Dashboard Pro_
_Período: 6 Mayo 2026 — 9 Mayo 2026_
_Estado: COMPLETADO · Gate: PASSED (con correcciones en iteración)_

---

## Módulos entregados

| Módulo | Archivo principal | Estado final | Gate |
|:---|:---|:---|:---|
| Dashboard v2.3 (Stepper UI) | `src/features/dashboard/components/ListingForm.tsx` | LISTO | PASSED |
| Validación Zod bancaria | `src/features/dashboard/` — schemas Zod métodos de pago | LISTO | PASSED |
| Motor de Comisiones 12/10/8% | `src/lib/commission.ts` + `BookingList.tsx` | LISTO | PASSED |
| Pasaporte v2.0 (Trust Score) | `src/features/auth/components/passport/` | LISTO | PASSED |
| Pasaporte v2.1 (Premium glow) | `src/features/auth/components/passport/` | LISTO | PASSED |
| Reserva Asíncrona & Soft-Block | `src/services/booking-service.ts` + `CheckoutPage.tsx` + `BookingList.tsx` | LISTO | PASSED |
| Resiliencia Checkout | `src/features/bookings/components/checkout/` + `firestore.rules` Public Profile Get | LISTO | PASSED |
| Botón QA Toggle Trust Score | `src/features/auth/components/passport/` | LISTO | PASSED |
| AutoSkills Bridge v2.2 | Sincronización 11 AutoSkills con manuales locales (modelo Puente) | LISTO | PASSED |
| VeneStay Local Guide (IA) | `ListingDetail.tsx` — DESHABILITADO bajo comentarios | DIFERIDO | PASSED |

---

## Decisiones técnicas — contexto completo

### DEC-S02-01: Cálculo de Tier centralizado en `commission.ts`
**Fecha:** 7 Mayo 2026 · **Autor:** Master Orchestrator / Inteligencia Financiera
**Justificación completa:** Durante la implementación del motor financiero se detectó una discrepancia matemática: el Dashboard calculaba el Tier de comisión con lógica duplicada respecto al Checkout. Esta inconsistencia podría mostrar al anfitrión un porcentaje diferente al que se aplicaba en la reserva. Solución: toda lógica de Tier vive exclusivamente en `src/lib/commission.ts` y todos los componentes consumen esta función centralizada.
**Afecta:** `src/features/dashboard/`, `src/features/bookings/`, `CheckoutPage.tsx`, `BookingList.tsx`.
**Regla activa:** Ningún componente calcula el tier de comisión localmente. Solo se importa y consume `evaluateHostTier()` de `commission.ts`.

### DEC-S02-02: VeneStay Local Guide (IA) diferida a post-lanzamiento
**Fecha:** 8 Mayo 2026 · **Autor:** Master Orchestrator
**Justificación completa:** La funcionalidad de IA Guide para huéspedes en `ListingDetail.tsx` fue deshabilitada por dos razones: (1) política de privacidad — el envío de datos de propiedades a modelos externos requiere revisión legal adicional; (2) política de estabilidad — la integración de IA generativa en el flujo crítico de detalle de propiedad introduce un vector de falla que podría afectar la conversión. El código está preservado bajo comentarios para ser reactivado post-lanzamiento Beta Lechería.
**Afecta:** `src/features/listings/components/ListingDetail.tsx`.
**Regla activa:** No reactivar hasta decisión explícita del equipo. El código no debe eliminarse — está bajo comentario preservado.

### DEC-S02-03: `loyaltyStats` y `currentCommissionRate` solo escribibles por Admin SDK
**Fecha:** 9 Mayo 2026 · **Autor:** SRE Architect / UCP Protocol
**Justificación completa:** La tasa de comisión del anfitrión es un dato financiero crítico. Si un cliente pudiera escribir `currentCommissionRate` directamente a Firestore, podría auto-asignarse una comisión del 8% sin cumplir los criterios de lealtad, causando pérdida de ingresos a VeneStay. Las reglas `firestore.rules` bloquean explícitamente `loyaltyStats` y `currentCommissionRate` en las actualizaciones de cliente usando `affectedKeys()`.
**Afecta:** `firestore.rules` (nodo `/users/{userId}`), `src/features/auth/`.
**Regla activa:** El campo `loyaltyStats` y `currentCommissionRate` solo se modifican via Cloud Functions o Admin SDK. Nunca desde el cliente React.

---

## Errores registrados — historial completo

### ERR-TSC-01 — [07-MAY-2026]
**Módulo:** `FloatingChatProps` / `AdminDashboard.tsx`
**Tipo:** TS_ERROR
**Descripción exacta:** `Property 'booking' does not exist on type 'FloatingChatProps'` — desincronización de interfaz en el orquestador durante la refactorización modular del AdminDashboard.
**Causa raíz:** El agente priorizó la velocidad de refactorización estructural sobre la validación atómica de tipos. No se leyó la definición del componente `FloatingChat` antes de instanciarlo.
**Resolución:** Corrección de la interfaz. Regla preventiva: `tsc --noEmit` obligatorio después de cada cambio estructural. No reportar éxito sin exit code 0 en el Gate de Compilación.
**Iteraciones:** 1 · **Gate final:** PASSED

### ERR-TSC-02 — [07-MAY-2026]
**Módulo:** Zod validation
**Tipo:** TS_ERROR
**Descripción exacta:** `Property 'errors' does not exist on type 'ZodError'` — uso de propiedad incorrecta para acceder a mensajes de validación de Zod.
**Causa raíz:** Asunción incorrecta de la API de ZodError sin verificar la documentación.
**Resolución:** Uso correcto de `.issues` (Zod v3) o `.errors` (verificar versión). Regla: validar propiedades de tipos externos antes de acceder.
**Iteraciones:** 1 · **Gate final:** PASSED

### ERR-FORM-01 — [07-MAY-2026]
**Módulo:** `ListingForm.tsx`
**Tipo:** DATA_LOSS / FUNCTIONAL_TRUNCATION
**Descripción exacta:** Truncamiento funcional durante la refactorización modular del Dashboard. Se omitieron campos críticos (Amenidades, Datos Bancarios) al extraer el monolito en componentes separados.
**Causa raíz:** El agente priorizó la "limpieza" estructural sobre la integridad del negocio. Fallo en el mapeo de requisitos durante la ejecución.
**Resolución:** Restauración de los campos faltantes. Ley de Paridad establecida: antes de fragmentar un componente monolítico, Field Mapping obligatorio. El nuevo sistema modular debe verificarse contra el monolito original para asegurar Feature Parity en datos e interfaz crítica.
**Iteraciones:** 2 · **Gate final:** PASSED

### ERR-FORM-02 — [07-MAY-2026]
**Módulo:** `ListingForm.tsx` — UI de Métodos de Cobro
**Tipo:** UX_TRUNCATION
**Descripción exacta:** Omisión de la interfaz icónica de Métodos de Cobro (Zelle, Binance, etc.) y campos de edificación (Pisos/Año) durante la segunda validación del ListingForm v2.2.
**Causa raíz:** El agente interpretó "simplificación" como eliminación de elementos visuales secundarios, cuando eran disparadores de confianza para el anfitrión.
**Resolución:** Restauración de iconos y layout de métodos de pago. Extensión de la Ley de Paridad: la paridad funcional incluye la UX (iconos, layouts específicos de pago), no solo los campos de datos.
**Iteraciones:** 1 · **Gate final:** PASSED

### ERR-PROFILE-01 — [08-MAY-2026]
**Módulo:** `ListingDetail.tsx` — sección "Conoce al anfitrión"
**Tipo:** LOGIC / ASYNC_ERROR
**Descripción exacta:** Sección "Conoce al anfitrión" bloqueada en skeleton loader infinito (`loadingHost` permanentemente en `true`) tras sincronización del repositorio via git pull.
**Causa raíz:** La sincronización del repositorio perdió la lógica de fetching (`useEffect`) del perfil del anfitrión, incluyendo la importación de `auth-service` y el bloque de cleanup del hook.
**Resolución:** Restauración de la importación de `auth-service` y reimplementación del `useEffect` de recuperación de perfil con `finally` block. Regla preventiva: los flujos de carga asíncrona deben tener siempre un disparador de cierre (`finally` o control de errores).
**Iteraciones:** 1 · **Gate final:** PASSED

### ERR-SYNC-01 — [07-MAY-2026]
**Módulo:** Agent output protocol
**Tipo:** PROCESS / SAY-DO GAP
**Descripción exacta:** El agente reportó que `HISTORY.md` había sido actualizado cuando la herramienta de escritura aún no había sido ejecutada. Falla de sincronización entre el discurso del modelo y la acción técnica (tool call).
**Causa raíz:** El modelo generó texto de confirmación antes de que el sistema confirmara la ejecución exitosa de la herramienta.
**Resolución:** Regla preventiva activa: no reportar una acción técnica como finalizada en el discurso hasta que el sistema confirme la ejecución exitosa del tool call. Honestidad técnica como pilar de gobernanza.
**Iteraciones:** 1 · **Gate final:** FIXED

---

## Hitos de sincronización

### [07-MAY-2026] — Auditoría de Sincronización v2.2 (PASSED)
- **Branding Sync:** Corrección de `index.css` — `bg-brand-navy` y `text-white` como base mandatoria.
- **Authority Sync:** Creación del manual de estética Premium Dark para blindar la marca.
- **Logic Sync:** Confirmada integración del protocolo UCP 20/80 como disparador de `schema-coercion`.

### [09-MAY-2026] — Hito Reserva Asíncrona v2.5 (PASSED)
- `booking-service.ts`: estados `CONFIRMED` vs `AWAITING_VERIFICATION` diferenciados.
- Calendario: estilos visuales Soft-Block (ámbar/punteado) para pagos en curso.
- `CheckoutPage.tsx`: banners de "Alta Demanda".
- `BookingList.tsx`: badges de "CONFLICTO DE FECHAS" con animación rojo parpadeante.

---

_Archivado al cierre del Sprint S02. Fuente: PROJECT_MEMORY.md + HISTORY.md (sesiones 6–9 Mayo 2026)._
