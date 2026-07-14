# SPEC ATÓMICA — Flujo de Consulta y Pago sin Fricción (Pre-Reserva)

**ID:** SPEC-CHECKOUT-SOFT-CONSULTA-001  
**Sprint:** S05 — Admin Tools & Maintenance  
**Prioridad:** P1 (Optimización de Conversión y UX P2P)  
**Fecha:** 2026-07-14  
**Elaborado por:** Nodo 2 — Planner (Spec Architect · Antigravity)  

---

## 1. Contexto y Diagnóstico Arquitectónico

### 1.1 Problema Identificado
Actualmente, el formulario de solicitud directa (`DirectRequestForm.tsx`) ejecuta un bloqueo rígido de seguridad (`canBook !== true`) apenas el huésped intenta consultar la disponibilidad o enviar un mensaje al anfitrión (*"Hola esta disponible?"*):

```tsx
// src/features/listings/components/DirectRequestForm.tsx:L108-111
if (profileData && profileData.canBook !== true) {
  toast.error('Tu pasaporte aún está en proceso de verificación o faltan requisitos básicos para alquilar.');
  return;
}
```

Esto dispara una notificación de error en rojo en la esquina superior que corta en seco el embudo de conversión, generando fricción y abandono prematuro antes de que el usuario siquiera pueda plantear su consulta o ver el desglose en el Checkout.

### 1.2 Objetivo y Experiencia Deseada
1. **Desbloquear la consulta:** La consulta por fechas o solicitud de reserva es una manifestación de intención de viaje, no un débito financiero. Se debe permitir al huésped consultar al anfitrión libremente sin exigir la verificación previa de su Pasaporte.
2. **Reubicar el Gatekeeper de Seguridad al momento del Pago:** La verificación obligatoria de requisitos (Fase 1 de KYC: Email + WhatsApp OTP + datos básicos de perfil) solo debe exigirse cuando el usuario intente **proceder con el pago** o asegurar su estadía (ya sea en `CheckoutPage.tsx` o al confirmar el pago rápido).
3. **Modal Amistoso y Enriquecido (`KYCRequiredModal`):** En lugar de un rechazo con lenguaje prohibitivo, se debe presentar al huésped un modal cálido y de alta calidad visual que le explique los requisitos pendientes para proteger su reserva, mostrándole que sus datos y fechas están guardados en borrador y motivándolo a completar la verificación con un solo clic.
4. **Enlace Cero-Fricción con Pago Pendiente:** Al presionar «Completar en Mi Pasaporte», el borrador o pago pendiente debe persistir (`persistDraftAndReturn`), permitiendo que el usuario se verifique en `/perfil/pasaporte` y regrese sin pérdida de información al checkout o solicitud para concretar el pago de manera inmediata.

---

## 2. Alcance Técnico

- **Capa FSD:** `features / auth / bookings / listings`
- **Archivos Afectados:**
  - `src/features/listings/components/DirectRequestForm.tsx` — Remover bloqueo preventivo `canBook !== true` al solicitar reserva/consulta.
  - `src/features/bookings/components/checkout/CheckoutPage.tsx` — Asegurar que la verificación de `checkCanBook(profileData)` intercepte la acción de pago final ("Subir comprobante y completar reserva"), invoque `persistDraftAndReturn()` y abra el modal enriquecido.
  - `src/features/auth/components/KYCRequiredModal.tsx` — Rediseño integral del modal de requisitos para convertirlo en un asistente P2P amistoso, no mandatorio en apariencia, con indicador de reserva pendiente en borrador.
  - `src/features/auth/components/passport/PassportHeader.tsx` o `ProfileSettings.tsx` (opcional/verificación de retorno) — Verificar y potenciar el banner/botón de retorno automático al pago pendiente (`draftBookingId` / return URL) tras completar los requisitos del Pasaporte.
- **Tipo de cambio:** `MODIFICAR / REFACTORIZAR`

---

## 3. Especificación Detallada de Cambios

### 3.1 `src/features/listings/components/DirectRequestForm.tsx`
- **Eliminar L108-111:** Quitar la comprobación `if (profileData && profileData.canBook !== true)` al ejecutar `handleSubmit()`.
- **Lógica resultante:**
  - Verificar que el usuario tenga sesión iniciada (`user !== null`). Si no, abrir `AuthModal('login')`.
  - Validar fechas (`startDate`, `endDate`), estadía mínima (`minNights`), Trust Score mínimo (`trustScore >= 25`) y el esquema de mensaje (`guestMessage >= 20 caracteres`).
  - Permitir la creación de la solicitud directa (`requestBookingDirectly`) o el paso a Checkout sin requerir que `canBook === true`.

### 3.2 `src/features/bookings/components/checkout/CheckoutPage.tsx`
- **Mantener Gatekeeper en Acción de Pago (`handleProceedToPayment` / `handleSubmitPayment`):**
  - Al presionar el CTA principal de pago, verificar `checkCanBook(profileData)`.
  - Si retorna `false`, ejecutar `persistDraftAndReturn()` (que almacena el borrador de reserva en `localStorage` / `sessionStorage` con las fechas y precio).
  - Activar `setShowKYCModal(true)`.
- **Paso de Contexto de Reserva al Modal:**
  - Enviar por props a `KYCRequiredModal` un objeto `pendingBookingSummary` con el título de la propiedad, fechas y monto estimado para mantener el incentivo visual del pago pendiente.

### 3.3 `src/features/auth/components/KYCRequiredModal.tsx`
- **Evolución Visual y de Copy:**
  - **Título:** *"¡Casi listo para asegurar tu estadía! 🌴"*
  - **Subtítulo/Descripción:** *"Tus fechas y precios están guardados en borrador. Para proteger tu dinero y brindar confianza mutua en la comunidad VeneStay, completa dos pasos rápidos en tu Pasaporte (menos de 1 minuto)."*
  - **Chip de Reserva Guardada:** Componente visual de tarjeta que muestra:
    `[🔒 Reserva en borrador · 15 min reservados] -> {listingTitle} | {datesText} | ${totalAmount} USD`
  - **Checklist Amigable de Requisitos Pendientes:**
    - Indicador visual claro de qué le falta:
      - ✉️ Verificación de Correo Electrónico (`!emailVerified`)
      - 💬 Verificación de WhatsApp OTP (`!whatsappVerified`)
      - 👤 Datos Básicos / Nacimiento (`!birthDate`)
  - **Botón de Acción Principal:** *"Completar en Mi Pasaporte y Continuar Pago ->"* (Color Dorado/Navy con animación suave `Framer Motion`).
  - **Botón Secundario:** *"Continuar explorando (puedes pagar luego)"*.

### 3.4 Enlace y Retorno desde el Módulo Pasaporte
- Cuando el usuario navegue a `/perfil/pasaporte` o `ProfileSettings` con una reserva o pago pendiente en borrador (detectable mediante `localStorage.getItem('venestay_draft_booking')` o parámetro de estado en URL), el Pasaporte mostrará una barra superior contextual:
  > *"✨ Tienes un pago pendiente en curso. Al completar tu verificación, podrás confirmarlo de inmediato."*
- Al completar con éxito el último requisito pendiente para que `canBook` pase a ser `true`, mostrar un botón o auto-redirección de regreso a `/checkout` o al detalle del alojamiento con el borrador restaurado.

---

## 4. Tipos Requeridos (`src/features/auth/types/index.ts` / `KYCRequiredModal.tsx`)

```typescript
export interface PendingBookingSummary {
  listingId: string;
  listingTitle: string;
  datesText: string;
  totalAmount: number;
}

export interface KYCRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycStatus: import('@/features/auth/types').KYCStatus | undefined;
  profile?: Partial<import('@/features/auth/types').UserProfile> | null;
  /** Resumen de la reserva o pago en borrador para mostrar en el modal amistoso */
  pendingBookingSummary?: PendingBookingSummary | null;
  /** Callback para ir a Mi Pasaporte o sección específica de verificación */
  onGoToPassport: (section?: string) => void;
}
```

---

## 5. Criterios de Aceptación (QA Gate Checklist)

- [ ] **CA-1 (Consulta Desbloqueada):** Un usuario autenticado pero sin Pasaporte verificado (`canBook !== true`) puede enviar una consulta o solicitud en `DirectRequestForm.tsx` sin que el sistema muestre el error `toast.error` bloqueante en la puerta.
- [ ] **CA-2 (Gatekeeper en el Pago):** En el flujo de Checkout o confirmación de pago, al intentar proceder ("Subir comprobante y completar reserva"), el sistema intercepta la acción si `checkCanBook(profileData) === false`, guarda el borrador (`persistDraftAndReturn`) y despliega `KYCRequiredModal`.
- [ ] **CA-3 (UX Enriquecida en Modal):** `KYCRequiredModal` presenta el nuevo diseño amistoso con copy positivo, tarjeta de resumen de reserva en borrador y checklist visual de requisitos faltantes, alejándose del tono restrictivo o mandatorio.
- [ ] **CA-4 (Retorno sin Fricción al Pago):** Al presionar "Completar en Mi Pasaporte" en el modal, el usuario es redirigido a `/perfil/pasaporte` con la referencia al borrador conservada. Tras verificarse, el sistema le permite regresar al pago pendiente con los datos intactos.
- [ ] **CA-5 (Compilación Limpia):** El proyecto compila con 0 errores en TypeScript (`npm run lint` / `npx tsc --noEmit`).
- [ ] **CA-6 (Calidad y Estilos):** Cumplimiento total del linter de ESLint y sistema de diseño de VeneStay (`--color-navy`, `--color-gold`, Lucide Icons, sin colores ad-hoc o inline no permitidos).
- [ ] **CA-7 (Accesibilidad WCAG 2.2 AA):** El modal mantiene trap de foco (`Focus trap`), soporte de tecla `Escape`, contraste AA y atributos `aria-label`/`aria-describedby` correctos.
- [ ] **CA-8 (Invariante de Seguridad Backend):** No se relajan ni modifican las reglas `firestore.rules` ni las funciones de servidor (`createBooking`); la restricción de seguridad final en base de datos sigue requiriendo `canBook === true` para consolidar reservas.

---

## 6. Matriz de Validación Automatizada y Protocolo de Retorno (QA ➔ Técnico)

Para garantizar cero regresiones y el cumplimiento autónomo de los estándares **SDD v4.0 (Reglas del Bloque 3 y Bloque 4 del Master Prompt)**, las validaciones serán 100% automatizadas mediante el siguiente protocolo de emisión, verificación y retroalimentación:

### 6.1 Emisión Obligatoria de Tests por el Nodo 3 (Técnico Frontend)
Co-juntamente con la modificación del código en `DirectRequestForm.tsx`, `CheckoutPage.tsx` y `KYCRequiredModal.tsx`, el **Nodo 3** es estrictamente responsable de crear y entregar **dos suites automatizadas** que verifiquen los Criterios de Aceptación:

1. **Suite de Integración y Componente (Vitest):**
   - **Ruta de entrega:** `src/features/bookings/tests/checkout-soft-consulta.test.tsx`
   - **Aserciones automáticas requeridas:**
     - `test('DirectRequestForm permite enviar consulta/solicitud con canBook === false sin disparar toast.error')` (Verifica **CA-1**).
     - `test('CheckoutPage intercepta clic en pagar cuando canBook === false, invoca persistDraftAndReturn y abre KYCRequiredModal')` (Verifica **CA-2** y **CA-4**).
     - `test('KYCRequiredModal muestra mensaje amistoso pre-pago y chip de reserva en borrador')` (Verifica **CA-3**).

2. **Suite E2E de Navegador (Playwright / TestSprite CLI):**
   - **Ruta de entrega:** `tests/e2e/checkout-soft-consulta.spec.ts`
   - **Aserciones automáticas requeridas:**
     - Flujo E2E completo: Simulación de usuario sin verificación de pasaporte ingresando a un alojamiento, haciendo clic en *"SOLICITAR RESERVA DE FORMA SEGURA"*, verificando la ausencia del banner rojo bloqueante, navegando a `/checkout`, intentando proceder con el pago y validando la apertura del modal enriquecido con enlace al pasaporte.

---

### 6.2 Ejecución Autónoma por el Nodo 4 (QA Gate)
Una vez el Nodo 3 entrega las suites de código y test, el **Nodo 4 (QA Gate)** toma el control y ejecuta en terminal la batería obligatoria:

```bash
# Gate G1: TypeScript Compilation
npx tsc --noEmit

# Gate G2: ESLint Code Quality
npx eslint . --format json

# Gate G3/G4: Vitest Integration Test específico del módulo
npx vitest run src/features/bookings/tests/checkout-soft-consulta.test.tsx --reporter=verbose

# Gate E2E / TestSprite Verify: Playwright test
npx playwright test tests/e2e/checkout-soft-consulta.spec.ts --reporter=list

# Suite Central de Gobernanza y Seguridad (G1-G13)
node scripts/run-validation.cjs
```

---

### 6.3 Bucle de Alerta y Retroalimentación (Self-Healing Loop Nodo 4 ⇄ Nodo 3)
Si durante la ejecución automatizada el **Nodo 4 (QA Gate)** detecta un fallo en cualquiera de las pruebas (`FAIL` en Vitest/Playwright, error en `tsc`, advertencia severa en `eslint` o violación de accesibilidad/seguridad):

1. **Intercepción y Bloqueo:** El Nodo 4 bloquea el cierre del módulo y **NO** da por terminada la tarea ni autoriza merges.
2. **Emisión de Alerta al Técnico:** El Nodo 4 devuelve directamente y de forma automática el reporte de error al **Nodo 3 (Técnico)** adjuntando la evidencia terminal exacta (`stdout`/`stderr`) bajo este formato estandarizado:
   ```markdown
   🔴 [QA GATE: FALLO DETECTADO — Iteración N / 3]
   - Módulo: SPEC-CHECKOUT-SOFT-CONSULTA-001
   - Gate Fallido: [G1/G2/G3/G4/E2E]
   - Archivo y Línea: [Ej: src/features/bookings/tests/checkout-soft-consulta.test.tsx:L42]
   - Salida del Error (Terminal Evidence): [Copia exacta del fallo reportado por Vitest/Playwright/tsc]
   - Acción Requerida para Nodo 3: [Instrucción precisa de corrección para el Técnico]
   ```
3. **Autocorrección y Reintento:** El **Nodo 3 (Técnico)** procesa la alerta, corrige el bug en el código fuente (`DirectRequestForm.tsx`, `CheckoutPage.tsx` o `KYCRequiredModal.tsx`) y vuelve a someter la solución al **Nodo 4 (QA Gate)**.
4. **Regla de Seguridad Anti-Bucle:** Este ciclo autónomo (`Técnico ➔ QA Gate ➔ Técnico`) opera hasta un **máximo de 3 iteraciones** (`max_iterations_per_module = 3`). Si al tercer intento persiste el fallo, el Nodo 4 declara un estado `[QA GATE: BLOCKED]` en `MEMORY_HOT.md` y eleva un reporte formal de impedimento arquitectónico para decisión del Project Manager.

---

## 7. Matriz de Dependencias

- **Requiere:** `SPEC-PASSPORT-AVATAR-PLACEHOLDER-001` (completado) / Estructura FSD de `services/user-service.ts`.
- **Bloquea:** Ninguno (tarea de optimización directa P1 en S05).
