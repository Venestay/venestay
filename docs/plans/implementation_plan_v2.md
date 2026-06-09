# Plan de Implementación v2: Footer & InfoModal — Información Real y Estándares de Industria

**Sprint:** S04  
**Prioridad:** Media-Alta  
**Área:** UI Informativa / Contacto / Políticas  
**Autor:** Revisión técnica con estándares de industria aplicados

---

## Contexto y Alcance

Este plan actualiza la información de contacto y políticas de cancelación en el `Footer` y el `InfoModal`, alineándolos con la lógica de negocio actual (política No Reembolsable · Reprogramable 20/80) y con los estándares de la industria para plataformas P2P de alquiler vacacional (accesibilidad WCAG 2.1 AA, seguridad, analytics, testing).

---

## ⚠️ Decisiones que Requieren Aprobación

> **[DECISIÓN-01] Separación de CTAs de WhatsApp**
> El enlace de WhatsApp actualmente reutiliza el `text=` de *registro de propiedad* para el botón de **Soporte/Contacto general**. Estos son dos flujos distintos y deben tener mensajes de apertura diferentes. Se propone:
>
> - **Soporte general:** `https://wa.me/584248680233?text=Hola%2C%20necesito%20ayuda%20con%20mi%20reserva%20en%20VeneStay.`
> - **Registro de propiedad:** `https://wa.me/584248680233?text=Me%20gustar%C3%ADa%20ingresar%20mi%20propiedad%20a%20Venestay%20y%20ser%20parte%20de%20los%20propietarios%20Fundadores.`
>
> Confirmar ambos textos con el equipo de negocio antes de implementar.

> **[DECISIÓN-02] Número en formato local vs. internacional**
> Se propone mostrar el número en formato internacional (`+58 424-868-0233`) por ser una plataforma con potencial de usuarios fuera de Venezuela. ¿Confirmar?

> **[DECISIÓN-03] Política: fecha de vigencia visible**
> Las plataformas de alquiler P2P estándar (Airbnb, Booking) muestran la fecha de vigencia de sus políticas. Se propone añadir "Vigente desde: Julio 2025" en el InfoModal. ¿Confirmar fecha exacta?

> **[DECISIÓN-04] Eliminación de políticas Flexible / Moderada / Estricta**
> Se confirma la remoción completa de estas tres políticas del InfoModal. Si existen reservas históricas que referencian dichas políticas, documentar la transición o añadir una nota de legado.

---

## Variables de Entorno (Nueva Adición)

El número de WhatsApp y los deep links **no deben estar hardcodeados** como strings en el cliente. Añadir a `.env` y `.env.example`:

```env
# .env (local, no commiteado)
VITE_SUPPORT_WA_URL=https://wa.me/584248680233?text=Hola%2C%20necesito%20ayuda%20con%20mi%20reserva%20en%20VeneStay.
VITE_HOST_REGISTER_WA_URL=https://wa.me/584248680233?text=Me%20gustar%C3%ADa%20ingresar%20mi%20propiedad%20a%20Venestay%20y%20ser%20parte%20de%20los%20propietarios%20Fundadores.
VITE_SUPPORT_PHONE_DISPLAY=+58 424-868-0233
```

Crear un módulo `src/shared/config/contact.ts` que exporte estas constantes con fallbacks, para centralizar cualquier cambio futuro.

---

## Cambios Propuestos

### 1. Configuración Centralizada de Contacto

#### [CREATE] `src/shared/config/contact.ts`

```typescript
// Centraliza toda la información de contacto para evitar strings dispersos.
// Modificar aquí propaga el cambio a Footer e InfoModal automáticamente.
export const CONTACT_CONFIG = {
  whatsapp: {
    support: {
      url: import.meta.env.VITE_SUPPORT_WA_URL ?? '',
      display: import.meta.env.VITE_SUPPORT_PHONE_DISPLAY ?? '+58 424-868-0233',
      ariaLabel: 'Contactar soporte de VeneStay por WhatsApp (abre WhatsApp)',
    },
    hostRegister: {
      url: import.meta.env.VITE_HOST_REGISTER_WA_URL ?? '',
      display: import.meta.env.VITE_SUPPORT_PHONE_DISPLAY ?? '+58 424-868-0233',
      ariaLabel: 'Registrar mi propiedad en VeneStay por WhatsApp (abre WhatsApp)',
    },
  },
  policy: {
    effectiveDate: 'Julio 2025',
    version: '1.0',
  },
} as const;
```

---

### 2. Componente InfoModal

#### [MODIFY] `src/components/ui/InfoModal.tsx`

**Sección `contact` — cambios:**

- Reemplazar el número ficticio `+58 212-VENE-STAY` por `CONTACT_CONFIG.whatsapp.support.display`.
- Envolver en `<a>` con:
  - `href={CONTACT_CONFIG.whatsapp.support.url}`
  - `target="_blank"`
  - `rel="noopener noreferrer"` (requerido en toda apertura de tab externo)
  - `aria-label={CONTACT_CONFIG.whatsapp.support.ariaLabel}` (WCAG 2.1 — Criterio 2.4.6)
- Añadir un ícono de WhatsApp junto al número (SVG inline o Lucide si está disponible).
- Añadir atributo `data-analytics="footer_whatsapp_support"` para tracking de clicks (ver sección Analytics).

**Sección `cancellation` — cambios:**

Reemplazar las tres políticas (Flexible / Moderada / Estricta) por la siguiente estructura de contenido:

```
POLÍTICA OFICIAL: NO REEMBOLSABLE · REPROGRAMABLE
Vigente desde: [CONTACT_CONFIG.policy.effectiveDate]

─── RESERVA PROTEGIDA 20/80 ───────────────────────
• Al confirmar una reserva, el 20% del monto total se
  retiene como depósito de reserva no reembolsable.
• El 80% restante se libera al anfitrión tras el check-in.

─── REPROGRAMACIÓN ────────────────────────────────
• El huésped puede solicitar reprogramación hasta 7 días
  antes del check-in.
• La reprogramación requiere aprobación del anfitrión y
  disponibilidad en las nuevas fechas.
• Solo se permite una reprogramación por reserva.

─── CANCELACIÓN ───────────────────────────────────
• Cancelaciones confirmadas: el depósito del 20% no
  es reembolsable bajo ninguna circunstancia.
• En caso de fuerza mayor documentada (desastre natural,
  emergencia médica certificada), el equipo de VeneStay
  evaluará cada caso de forma individual.

─── DISPUTAS ──────────────────────────────────────
• El huésped dispone de 24 horas tras el check-in para
  reportar inconformidades al equipo de VeneStay.
• Pasado ese plazo, la reserva se considera completada
  satisfactoriamente.
```

Añadir `role="region"` y `aria-labelledby` al contenedor de políticas para correcta semántica de landmark.

---

### 3. Footer (Home.tsx)

#### [MODIFY] `src/pages/Home.tsx` — Sección Footer

- Usar `CONTACT_CONFIG` importado para todos los links y textos de contacto.
- El botón/link de **Soporte** debe usar `CONTACT_CONFIG.whatsapp.support`.
- El botón/link de **Registrar propiedad** debe usar `CONTACT_CONFIG.whatsapp.hostRegister`.
- Ambos links deben tener `rel="noopener noreferrer"` y su respectivo `aria-label`.
- Añadir `data-analytics` attributes distintos para cada CTA:
  - Soporte: `data-analytics="footer_whatsapp_support"`
  - Registro: `data-analytics="footer_whatsapp_host_register"`
- Verificar que el modal de "Políticas de Cancelación" que abre el footer usa el `InfoModal` actualizado (no una copia local del contenido).

---

### 4. Analytics — Tracking de Clicks en CTAs de WhatsApp

#### [CREATE o MODIFY] `src/shared/hooks/useAnalytics.ts` (o integrar en `useFooterActions.ts` si existe)

Registrar un evento cada vez que el usuario hace click en cualquier link de WhatsApp:

```typescript
// Ejemplo de evento a registrar:
// { event: 'whatsapp_click', cta: 'support' | 'host_register', location: 'footer' | 'info_modal' }
```

Si el proyecto usa Firebase Analytics, el evento correspondiente es `logEvent(analytics, 'whatsapp_cta_click', { cta_type, location })`.

Esto permite medir la tasa de conversión del canal WhatsApp desde el footer.

---

## Plan de Verificación

### Verificación Automatizada

```bash
# 1. TypeScript strict — no debe haber errores de tipos
npx tsc --noEmit

# 2. Lint — calidad de código
npm run lint

# 3. Pipeline completo de validación
npm run validate
```

**Tests unitarios a agregar / modificar:**

```typescript
// InfoModal.test.tsx — nuevas aserciones:
it('muestra el número de WhatsApp real en la sección de contacto', () => {
  // Verificar que el texto visible sea '+58 424-868-0233'
});

it('el link de WhatsApp de soporte apunta a la URL correcta', () => {
  // Verificar href contiene 'wa.me/584248680233'
});

it('el link de WhatsApp tiene aria-label descriptivo', () => {
  // Verificar aria-label no vacío
});

it('no contiene texto de políticas Flexible, Moderada ni Estricta', () => {
  // Verificar ausencia de strings obsoletos
});

it('muestra la política 20/80 en la sección de cancelación', () => {
  // Verificar presencia de '20/80' o 'Reserva Protegida'
});

// contact.ts — smoke test:
it('CONTACT_CONFIG no tiene valores vacíos en campos críticos', () => {
  // Verificar que support.url y hostRegister.url no sean strings vacíos
});
```

**Test de accesibilidad automatizado (axe-core):**
Si el proyecto no tiene axe integrado, añadir al menos una prueba de humo sobre `InfoModal`:

```bash
npm install --save-dev @axe-core/react
```

```typescript
it('InfoModal no tiene violaciones de accesibilidad', async () => {
  const { container } = render(<InfoModal open section="cancellation" />);
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
});
```

### Verificación Manual (QA)

| # | Escenario | Resultado Esperado |
|---|-----------|-------------------|
| 1 | Click en "Políticas de Cancelación" en footer | Modal muestra política 20/80 unificada. Sin mención de Flexible/Moderada/Estricta. |
| 2 | Click en "Contacto" en footer | Abre WhatsApp (móvil) o web.whatsapp.com (desktop) con mensaje de soporte pre-cargado. |
| 3 | Click en "Registrar propiedad" en footer | Abre WhatsApp con mensaje de propietario fundador pre-cargado (texto diferente al de soporte). |
| 4 | Navegar con teclado (Tab) | Todos los links son alcanzables con teclado; los `aria-label` son leídos por VoiceOver/NVDA. |
| 5 | Abrir en desktop sin WhatsApp | Redirige correctamente a web.whatsapp.com, no da error 404 ni página en blanco. |
| 6 | Verificar en dark mode | Todos los textos del InfoModal y Footer tienen contraste suficiente (ratio ≥ 4.5:1). |
| 7 | Revisar DevTools → Network | No se exponen URLs de WhatsApp como strings en el bundle sin ofuscación de env vars. |
| 8 | Click en links de WhatsApp | Los eventos de analytics se registran en Firebase (verificar en DebugView). |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| El `text=` del deep link de WhatsApp tiene caracteres no codificados | Media | Validar el URL encode con `encodeURIComponent` antes de commitear. Verificar manualmente en dispositivo real. |
| Reservas existentes referenciaban políticas antiguas | Baja | Revisar si hay strings hardcodeados en Firestore (campos `cancellationPolicy`) que deban migrarse. |
| Variables de entorno faltantes en staging/prod | Media | Añadir validación de env vars al startup de la app. Fallar rápido si `VITE_SUPPORT_WA_URL` está vacío. |
| El número de WhatsApp cambia en el futuro | Baja | La centralización en `contact.ts` + env vars garantiza un único punto de cambio. |

---

## Archivos Impactados

| Archivo | Tipo de cambio |
|---------|---------------|
| `src/shared/config/contact.ts` | CREAR |
| `src/components/ui/InfoModal.tsx` | MODIFICAR |
| `src/pages/Home.tsx` | MODIFICAR |
| `src/shared/hooks/useAnalytics.ts` | CREAR o MODIFICAR |
| `.env.example` | MODIFICAR |
| `src/components/ui/InfoModal.test.tsx` | CREAR o MODIFICAR |

