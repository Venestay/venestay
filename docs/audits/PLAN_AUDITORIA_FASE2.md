# 🔬 PLAN DE AUDITORÍA FASE 2 — VeneStay E2E (Playwright)
> **Versión:** 3.0 — Auditoría Extendida de Cobertura Completa
> **Estado:** LISTO PARA EJECUTAR
> **Fecha:** 27 Jun 2026
> **Objetivo:** Cubrir el 100% de los casos críticos de la Estrategia Original, corrigiendo los gaps (~60%) de la Fase 1 y sumando los hallazgos del análisis de cobertura.

---

## ⚠️ REGLAS DE ORO — EL AGENTE NO PUEDE SALTARSE NINGUNA

> **REGLA 1 — Secuencia obligatoria:** Los STEPs deben ejecutarse EN ORDEN. No pasar al siguiente STEP hasta que el actual tenga todos sus tests en PASS, FAIL-con-fix, o SKIP-justificado.
>
> **REGLA 2 — Cero tolerancia al `.catch(() => {})`:** Está PROHIBIDO usar `.catch(() => {})` vacíos para silenciar fallos. Si un elemento no existe, el test debe registrarlo como SKIP con `console.warn('SKIP: motivo')`. Nunca ignorar silenciosamente.
>
> **REGLA 3 — Spec Fix obligatorio:** Si un test falla, el agente DEBE: (a) leer el error completo, (b) identificar el archivo de código fuente causante, (c) aplicar la corrección mínima en el código de producción, (d) re-ejecutar hasta obtener PASS. Solo entonces avanza.
>
> **REGLA 4 — Captura de errores de consola SIEMPRE activa:** Cada test DEBE incluir `setupErrorCapture(page, consoleErrors, networkErrors)` y reportar los errores encontrados aunque el flujo visual pase.
>
> **REGLA 5 — Sin datos basura en Firestore:** Los tests que crean datos NUNCA deben hacer clic en botones finales irreversibles ("Publicar", "Confirmar Reserva"). Solo validar hasta el penúltimo paso.

---

## 📋 INVENTARIO DE GAPS (Del Análisis Post Fase 1)

| Suite | Casos Pendientes | Severidad | Riesgo |
|:---|:---|:---:|:---|
| S1 — Auth | AUTH-02, AUTH-03, AUTH-05 | 🔴 Alto | KYC loop expone datos; registro puede crear usuarios corruptos |
| S3 — Detalle | DET-04, DET-05, DET-06 | 🔴 Alto | Form de reserva puede tener error 403 en Firestore al enviar |
| S4 — Mis Viajes | BOOK-04, BOOK-05, BOOK-06 + Fix BOOK-03 | 🔴 Alto | Flujo de cobro y subida de comprobantes no auditados |
| S5 — Anfitrión | HOST-02 a HOST-07 | 🔴 Alto | Solo se validó el paso 1 del wizard de 4 pasos |
| S6 — Admin | ADM-01, ADM-03, ADM-05 | 🔴 Alto | ADM-01 es prueba de seguridad crítica sin ejecutar |
| NUEVO — Fix MyTrips | Botón "Ver Resumen" con lógica inconsistente | 🟡 Medio | Bug real detectado pero solo workaround aplicado en el test |

---

## 🔧 STEP 0 — SPEC-FIX-BOOK-03 (Ejecutar PRIMERO)

**Archivo:** `src/features/bookings/components/MyTrips.tsx`

**Problema:** El botón "Ver Resumen" redirige a `/checkout/:id` indiscriminadamente para todos los estados de reserva. Solo debería hacerlo cuando `booking.status === 'PENDING_PAYMENT'`. En cualquier otro estado debe abrir el `BookingSummaryModal`.

**Lógica esperada:**
```typescript
// En el onClick del botón "Ver Resumen":
if (booking.status === 'PENDING_PAYMENT') {
  navigate(`/checkout/${booking.id}`);
} else {
  setSummaryBooking(booking); // abre BookingSummaryModal
}
```

**Criterios de aceptación:**
- [ ] Reserva con estado `CONFIRMED` → abre el modal `BookingSummaryModal`
- [ ] Reserva con estado `PENDING_PAYMENT` → redirige a `/checkout/:id`
- [ ] `npm run lint` pasa sin errores
- [ ] Test BOOK-03 puede reescribirse sin `Promise.race` como workaround

---

## 🗺️ MAPA DE EJECUCIÓN (Orden Bloqueante)

```
STEP 0: SPEC-FIX-BOOK-03 en MyTrips.tsx  →  lint PASS  →  verificar visual
   ↓
STEP 1: Expandir auth.spec.ts (AUTH-02, AUTH-03, AUTH-05 + AUTH-06 mejorado)
   ↓ todos los tests PASS/SKIP
STEP 2: Expandir listing-detail.spec.ts (DET-04, DET-05, DET-06)
   ↓ todos los tests PASS/SKIP
STEP 3: Expandir bookings.spec.ts (BOOK-03 reescrito, BOOK-04, BOOK-05, BOOK-06)
   ↓ todos los tests PASS/SKIP
STEP 4: Expandir host-listings.spec.ts (HOST-02 a HOST-07)
   ↓ todos los tests PASS/SKIP
STEP 5: Expandir admin.spec.ts (ADM-01, ADM-03, ADM-05)
   ↓ todos los tests PASS/SKIP
STEP 6: Ejecutar suite completa y generar REPORTE_AUDITORIA_FASE2_RESULTADOS.md
```

---

## 📝 ESPECIFICACIONES POR STEP

---

### STEP 1 — `auth.spec.ts` — Casos Faltantes

**Cuenta de prueba:** `rodriguezzcarlose@gmail.com` / `Venestay1015`

#### AUTH-02: Flujo de recuperación de contraseña
- Abrir `AuthModal` sin sesión activa
- Buscar el enlace/botón "¿Olvidaste tu contraseña?" o similar
- Ingresar email: `rodriguezzcarlose@gmail.com`
- Hacer clic en "Enviar enlace" o equivalente
- **VERIFICAR:** Aparece mensaje de confirmación ("Te enviamos un correo" o similar)
- Si no aparece ningún feedback → reportar como **BUG P1**
- Capturar errores de consola durante el flujo

#### AUTH-03: Registro — Validaciones del formulario (sin crear cuenta)
- Abrir `AuthModal` → pestaña de registro
- Intentar registrar con email mal formado (ej: `notanemail`) → verificar mensaje de error
- Intentar con contraseña muy corta (ej: `123`) → verificar mensaje de error
- **NO completar el registro** — solo probar las validaciones del formulario
- Capturar errores de consola

#### AUTH-05: KYC Loop — usuario sin KYC intenta reservar
- Iniciar sesión como huésped
- Navegar al detalle de un listing
- Hacer clic en el botón de Reservar / Solicitar
- **VERIFICAR:** Aparece `KYCRequiredModal` o un mensaje de verificación requerida
- Si el flujo deja pasar sin bloqueo → capturar screenshot y reportar como **BUG P0**

#### AUTH-06 Mejorado: Todas las rutas protegidas sin sesión
- Usar contexto sin autenticar: `test.use({ storageState: { cookies: [], origins: [] } })`
- Probar cada ruta protegida: `/mis-viajes`, `/mi-pasaporte`, `/dashboard`, `/admin/mis-propiedades`, `/publicar-espacio`
- **VERIFICAR en cada una:** La URL final termina en `/` (redirige a Home)
- Si ALGUNA no redirige → reportar como **BUG P0 CRÍTICO DE SEGURIDAD** con la ruta exacta

---

### STEP 2 — `listing-detail.spec.ts` — Casos Faltantes

#### DET-04: DirectRequestForm — envío de solicitud
- Iniciar sesión como huésped
- Navegar al detalle de cualquier listing
- Localizar el formulario de reserva / botón de solicitud
- Si el modo es `request`: completar el formulario (fechas futuras mínimas, mensaje)
- Hacer clic en "Enviar Solicitud"
- **VERIFICAR:** Toast de éxito ("Solicitud enviada") O mensaje de error claro
- Si hay error 403 de Firestore → reportar como **BUG P0**
- Capturar errores de consola

#### DET-05: Mapa de ubicación visible
- Navegar al detalle de cualquier listing
- Buscar el componente de mapa (iframe de Google Maps o div con mapa)
- Si existe → verificar que no hay error `ApiNotActivatedMapError` ni similar en consola
- Si no existe → registrar como observación `console.warn('SKIP-OBS: mapa no presente en este listing')`

#### DET-06: Sección de reseñas
- Navegar al detalle de cualquier listing
- Verificar que la sección de reseñas renderiza
- Verificar que el contador de reseñas muestra un número (no `NaN`, no vacío, no `-1`)
- Si el contador es inválido → reportar como **BUG P2**
- Capturar errores de consola durante la carga

---

### STEP 3 — `bookings.spec.ts` — Reescritura y Casos Faltantes

#### BOOK-03 Reescrito (después del SPEC-FIX-BOOK-03)
- Remover el `Promise.race` workaround
- Hacer clic en "Ver Resumen" en una reserva que NO sea `PENDING_PAYMENT`
- **VERIFICAR:** `BookingSummaryModal` abre con `aria-label="Cerrar modal"` visible
- Cerrar el modal y verificar que vuelve a Mis Viajes

#### BOOK-04: Temporizador en checkout
- Si existe una reserva en `PENDING_PAYMENT` → navegar a `/checkout/:id`
- **VERIFICAR:** Hay un elemento de countdown/temporizador con tiempo > 0
- Si no existe reserva `PENDING_PAYMENT` → skip justificado
- Capturar errores de consola

#### BOOK-05: Subida de comprobante de pago
- En la página de checkout con reserva `PENDING_PAYMENT`
- Localizar el input de tipo file para el comprobante
- Usar `page.setInputFiles(selector, 'ruta/a/archivo-prueba.png')` — usar un PNG mínimo de 1x1px
- **VERIFICAR:** Progreso de upload visible O toast de confirmación O preview de imagen
- Si aparece error 403 de Firebase Storage → reportar como **BUG P0**

#### BOOK-06: RescheduleRequestModal
- En Mis Viajes, buscar botón de "Reagendar" en reservas activas
- Si no existe → skip justificado con `console.warn`
- Si existe → clic, verificar que el modal abre con campos de fecha seleccionables
- Cerrar el modal sin guardar

---

### STEP 4 — `host-listings.spec.ts` — Pasos 2 a 7 del Wizard

**Estrategia:** Navegar por los pasos del wizard completando datos válidos pero cerrando sin publicar al final.

#### HOST-02: StepGeneral — validaciones Zod
- Abrir el formulario de Nueva Propiedad (ruta `/publicar-espacio`)
- Hacer clic en "Siguiente" inmediatamente sin llenar nada
- **VERIFICAR:** Aparecen mensajes de error de validación en los campos vacíos
- Si no aparecen mensajes de error → reportar como **BUG P1**

#### HOST-03: StepGeneral — avanzar al paso 2
- Llenar todos los campos requeridos del Step 1 con datos válidos marcados `[E2E-TEST]`
- Hacer clic en "Siguiente"
- **VERIFICAR:** La vista cambia al Paso 2 (Galería o Mapa)

#### HOST-04: StepGallery — renderizado del área de upload
- **VERIFICAR:** Existe un área de drag-and-drop o input de tipo file
- **VERIFICAR:** Botones "Siguiente" y "Atrás" son visibles
- Hacer clic en "Atrás"
- **VERIFICAR:** Vuelve al Paso 1 con los datos del Título aún visibles (no reseteados)

#### HOST-05: StepMap — verificación del mapa
- Navegar hasta el Paso de Mapa (Step 3)
- **VERIFICAR:** El mapa de Google Maps renderiza O hay un mensaje de error claro
- Capturar errores de consola relacionados con `maps.googleapis.com`

#### HOST-06: Retroceso de pasos sin pérdida de estado
- Completar Step 1 → avanzar → avanzar → retroceder dos veces al Step 1
- **VERIFICAR:** El título ingresado en Step 1 sigue siendo el mismo
- Si los datos se resetean → reportar como **BUG P1**

#### HOST-07: StepPayments — verificación del paso final
- Navegar hasta el Paso de Pagos (Step 4)
- **VERIFICAR:** Hay checkboxes o radio buttons de métodos de pago
- Cerrar el wizard completo (botón X o Escape)
- **VERIFICAR:** No queda overlay ni modal abierto

---

### STEP 5 — `admin.spec.ts` — Seguridad y Gestión

#### ADM-01: Acceso sin sesión a rutas de admin (PRUEBA DE SEGURIDAD)
```typescript
// Usar contexto limpio sin autenticar
test.use({ storageState: { cookies: [], origins: [] } });
```
- Intentar navegar a: `/dashboard`, `/admin/mis-propiedades`, `/publicar-espacio`
- **VERIFICAR en cada ruta:** La URL resultante termina en `/` y no muestra datos de admin
- Si ALGUNA ruta expone datos → reportar como **BUG P0 CRÍTICO** y detener la suite

#### ADM-03: Verificar existencia del botón de aprobación
- Iniciar sesión como admin
- Navegar al Dashboard en pestaña de Reservas
- Si hay reservas en `PENDING_APPROVAL`:
  - **VERIFICAR:** Existe un botón de "Aprobar" o "Confirmar"
  - Capturar el texto exacto del botón para el reporte
  - **NO hacer clic** — riesgo de cambiar estado real de producción
- Si no hay reservas pendientes → skip justificado

#### ADM-05: GuestRequestVerificationDrawer
- Desde el dashboard admin, buscar un botón de "Verificar" en alguna reserva
- Si existe → clic, verificar que el drawer/panel se abre con datos del huésped visible
- **VERIFICAR:** El drawer puede cerrarse (botón X o Escape) sin dejar overlay
- Si el drawer queda bloqueado → reportar como **BUG P1**

---

### STEP 6 — Suite Completa + Reporte Final

**Comando de ejecución (OBLIGATORIO ejecutar este comando exacto):**
```bash
npx playwright test tests/e2e/ --project=chromium --reporter=html
```

**Reporte a generar:** `docs/audits/REPORTE_AUDITORIA_FASE2_RESULTADOS.md`

**Estructura obligatoria del reporte:**

```markdown
## Tabla de Resultados por Caso

| ID | Suite | Resultado | Error Encontrado | Spec Fix Aplicado |
|:---|:---|:---:|:---|:---|
| AUTH-01 | auth | ✅ PASS (Fase 1) | — | — |
| AUTH-02 | auth | ✅/❌/⏭️ | descripción | nombre-del-fix |
... todos los casos

## Spec Fixes Aplicados en Fase 2
... lista detallada

## Errores de Consola Detectados (Silenciosos)
... PAGEERROR o CONSOLE ERROR que no bloquearon el flujo visual

## Cobertura Final
- Total casos planificados: 30
- PASS: X | FAIL: X | SKIP: X | BLOCKED: X
- Cobertura real: X%
```

---

## 📂 Resumen de Archivos a Modificar

| Archivo | Acción | Motivo |
|:---|:---|:---|
| `src/features/bookings/components/MyTrips.tsx` | MODIFY | SPEC-FIX-BOOK-03: separar lógica de "Ver Resumen" por estado |
| `tests/e2e/auth.spec.ts` | EXPAND | Agregar AUTH-02, AUTH-03, AUTH-05, mejorar AUTH-06 |
| `tests/e2e/listing-detail.spec.ts` | EXPAND | Agregar DET-04, DET-05, DET-06 |
| `tests/e2e/bookings.spec.ts` | EXPAND | Reescribir BOOK-03, agregar BOOK-04, BOOK-05, BOOK-06 |
| `tests/e2e/host-listings.spec.ts` | EXPAND | Agregar HOST-02 a HOST-07 |
| `tests/e2e/admin.spec.ts` | EXPAND | Agregar ADM-01, ADM-03, ADM-05 |
| `docs/audits/REPORTE_AUDITORIA_FASE2_RESULTADOS.md` | CREATE | Reporte final de cobertura |

---

## 🔁 Flujo de Decisión para el Agente (Anti-Skip)

```
Para CADA test en CADA STEP:
  1. Ejecutar el test
  2. ¿PASS?  →  Continuar al siguiente test del mismo STEP
  3. ¿FAIL?
     a. Leer el error COMPLETO del log de tarea
     b. ¿Es bug en el código de producción?  →  Aplicar Spec Fix mínimo  →  Re-ejecutar
     c. ¿Es selector incorrecto en el test?  →  Corregir selector  →  Re-ejecutar
     d. Si después de 3 intentos no pasa  →  Registrar como BLOCKED con evidencia
  4. ¿Elemento no existe (skip)?  →  console.warn('SKIP: ...') en el test  →  Continuar
  5. NUNCA llamar .catch(() => {}) vacío
  6. Al completar TODOS los tests del STEP  →  pasar al STEP siguiente
```

---

**Aprobado por:** Nodo 2-Planner → Nodo 3-Técnico
**Próximo ejecutor:** Nodo 3-Técnico con /goal para ejecución autónoma sin interrupciones
