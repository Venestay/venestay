# Informe: Estrategia de Tarifa de Limpieza — VeneStay v2.3.0
## Análisis de Producto · Arquitectura Financiera · Sprint 7

> **Elaborado por:** Nodo 1 (Project Manager) + Nodo 2 (Planner) — División de Ingeniería de IA, Antigravity
> **Fecha:** Junio 2026
> **Contexto activo:** Sprint S04 — KYC & Identity / Preparación Sprint 7 (Desglose de Precios)

---

## 1. Diagnóstico del Estado Actual

### ¿Qué existe hoy en el código?

El campo `cleaningFee` **ya existe** en el modelo de datos:

```typescript
// src/features/listings/types/index.ts
cleaningFee?: number;  // campo opcional, sin valor por defecto
```

```typescript
// calculatePaymentBreakdown — src/lib/utils.ts
remainingBalance: breakdown.ucpBalance + cleaningFee,
// La tarifa de limpieza se cobra JUNTO al saldo restante (80%),
// NO junto al anticipo (20%). ✅ Correcto.
```

**Problema actual:** El campo existe pero **el anfitrión no tiene forma de definirlo** desde el formulario de publicación (`ListingForm`). Tampoco existe ningún rango, regla de negocio ni UI visible para el huésped en el desglose. Los datos mock tampoco tienen `cleaningFee` definido, por lo que se muestra $0.

---

## 2. Contexto de Negocio Relevante

### Protocolo UCP 20/80 (vinculante)

| Momento | Quién paga | Qué incluye |
|:---|:---|:---|
| Anticipo (20%) | Huésped → plataforma | Garantía de la reserva. Retiene la plataforma hasta check-in. |
| Saldo (80%) | Huésped → anfitrión en check-in | Monto restante del alojamiento |
| **Limpieza** | Huésped → anfitrión en check-in | **Se suma al saldo del 80%**, nunca al anticipo |

> **Implicación clave:** La tarifa de limpieza **no afecta el 20% de anticipo**. Siempre se cobra al llegar, junto al saldo. Esto está ya implementado correctamente en `calculatePaymentBreakdown`.

### Rango de precios de los listings actuales

| Listing | Ciudad | Precio/noche | Habitaciones | Huéspedes |
|:---|:---|:---:|:---:|:---:|
| Penthouse Altamira | Caracas | $120 | 2 | 4 |
| Villa Playa El Agua | Margarita | $85 | 3 | 6 |
| Posada Colonial Coro | Falcón | $45 | 1 | 2 |
| Apto. El Morro | **Lechería** | $150 | 3 | 5 |
| Residencia Maracaibo | Maracaibo | $70 | 2 | 4 |
| Villa Náutica TEST | **Lechería** | $200 | 4 | 8 |

**Rango de mercado en VeneStay:** $45 — $200 USD/noche.
**Foco Beta:** Lechería ($150–$200/noche, propiedades premium).

### Comisión de plataforma (vinculante)

| Nivel anfitrión | Comisión | Se cobra sobre |
|:---|:---:|:---|
| Nuevo (sin verificar) | 12% | Total del alquiler (sin incluir limpieza) |
| Verificado (KYC) | 10% | Total del alquiler |
| Superhost (≥10 reservas) | 8% | Total del alquiler |

> La comisión de VeneStay **NO** se aplica sobre la tarifa de limpieza. Esto es consistente con el modelo de Airbnb y es correcto en la implementación actual.

---

## 3. Análisis: Monto Fijo vs. Porcentaje

### Opción A — Porcentaje del precio total

```
Limpieza = % × (pricePerNight × noches)
Ejemplo: 10% × ($150 × 3 noches) = $45
```

| Ventaja | Desventaja |
|:---|:---|
| Escala automáticamente con estancias largas | Injusto: limpiar 1 noche o 7 cuesta lo mismo para el anfitrión |
| Fácil de comunicar en UI | Las estancias largas se encarecen desproporcionadamente |
| No requiere calibración por anfitrión | El huésped percibe la tarifa como castigo por reservas cortas |
| — | Complejo de explicar en el desglose (% de qué) |

**Veredicto:** ❌ No recomendado. El costo real de limpieza no escala con las noches.

---

### Opción B — Monto fijo por el anfitrión (sin restricciones)

```
Limpieza = valor que el anfitrión ingresa libremente
```

| Ventaja | Desventaja |
|:---|:---|
| Refleja el costo real de limpieza | Sin banda, un anfitrión puede poner $500 en un listing de $45/noche |
| Flexible para diferentes tamaños de propiedad | Falta de estandarización reduce confianza del huésped |
| El anfitrión conoce mejor su costo | Inconsistencia entre listings daña la experiencia comparativa |

**Veredicto:** ✅ Correcto en concepto, ❌ peligroso sin validación.

---

### Opción C — Monto fijo por el anfitrión + banda de validación por categoría ⭐ RECOMENDADA

```
Limpieza = valor libre del anfitrión, validado dentro de un rango según el tamaño de la propiedad.
```

El anfitrión define el monto. El sistema valida que sea razonable según la categoría del listing.

---

## 4. Propuesta Recomendada — Bandas de Validación por Categoría

### 4.1 Tabla de bandas

| Categoría | Criterio | Rango sugerido | Default sugerido |
|:---|:---|:---:|:---:|
| **Micro** | 1 habitación, 1–2 huéspedes | $0 — $20 | $10 |
| **Estándar** | 2 habitaciones, 3–4 huéspedes | $15 — $40 | $25 |
| **Familiar** | 3 habitaciones, 5–6 huéspedes | $30 — $60 | $40 |
| **Premium / Villa** | 4+ habitaciones, 7+ huéspedes | $50 — $100 | $60 |

> **Nota Lechería Beta (contexto específico):** Las propiedades del foco inicial ($150–$200/noche, 3–4 habitaciones) caen en la categoría **Familiar → Premium**. El rango $40–$70 es el más representativo del mercado.

### 4.2 Implementación en el esquema Zod (Sprint 7)

```typescript
// src/features/dashboard/types/dashboard.schema.ts
cleaningFee: z.coerce
  .number()
  .min(0, 'La tarifa de limpieza no puede ser negativa')
  .max(150, 'La tarifa máxima es $150 USD')
  .optional()
  .default(0),
```

> **El máximo global de $150** actúa como techo de seguridad sin bloquear la flexibilidad del anfitrión dentro de bandas razonables.

### 4.3 UI recomendada en StepGeneral.tsx

```
┌─────────────────────────────────────────────────────────┐
│  TARIFAS ADICIONALES                                    │
│  ─────────────────────────────────────────────────────  │
│  Gastos de limpieza (opcional)                          │
│  ┌────────────────────────┐  ← Input numérico USD       │
│  │  $  [40]               │                             │
│  └────────────────────────┘                             │
│  💡 Tarifa única por estancia, no por noche.            │
│     Sugerido para tu propiedad (3 hab, 5 huéspedes):   │
│     entre $30 y $60 USD.                               │
│                                                         │
│  Depósito de seguridad (opcional)           ← Sprint 7 │
│  Descuento semanal / mensual (opcional)     ← Sprint 7 │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Desglose visible para el huésped en ListingDetail y Checkout

```
RESUMEN DE TU ESTANCIA
────────────────────────────────────────────
$150 × 3 noches                    $450 USD
Gastos de limpieza (única vez)      $45 USD
────────────────────────────────────────────
Total de la estancia               $495 USD

PROTOCOLO UCP — CÓMO FUNCIONA EL PAGO
────────────────────────────────────────────
Anticipo hoy (20% del alquiler)     $90 USD   ← solo sobre los $450, nunca sobre limpieza
Saldo al llegar al anfitrión       $360 USD
Limpieza al llegar                  $45 USD
────────────────────────────────────────────
Total al check-in                  $405 USD
```

> **Regla de negocio confirmada:** El anticipo del 20% se calcula **solo sobre `pricePerNight × noches`**, no sobre la tarifa de limpieza. La limpieza siempre se paga al llegar. Esto es correcto en el código actual y debe mantenerse.

---

## 5. Comparación Final de Opciones

| Criterio | % del total | Monto fijo libre | **Monto fijo + banda** ✅ |
|:---|:---:|:---:|:---:|
| Refleja costo real del anfitrión | ❌ | ✅ | ✅ |
| Protege al huésped de abusos | ✅ | ❌ | ✅ |
| Consistencia entre listings | ❌ | ❌ | ✅ |
| Fácil de comunicar en UI | ❌ | ✅ | ✅ |
| Compatible con protocolo UCP | ✅ | ✅ | ✅ |
| Requiere migración de datos | No | No | No (campo opcional) |
| Complejidad de implementación | Media | Baja | **Baja** |

---

## 6. Valores Predeterminados para los Mocks (Datos de Prueba)

Para que el desglose sea visible de inmediato en el entorno de desarrollo, se sugiere añadir `cleaningFee` a los listings mock en `constants/index.tsx`:

| Listing | cleaningFee sugerido |
|:---|:---:|
| Penthouse Altamira ($120/noche, 2 hab) | $25 |
| Villa Playa El Agua ($85/noche, 3 hab) | $35 |
| Posada Colonial Coro ($45/noche, 1 hab) | $10 |
| Apto. El Morro Lechería ($150/noche, 3 hab) | $45 |
| Residencia Maracaibo ($70/noche, 2 hab) | $20 |
| Villa Náutica TEST ($200/noche, 4 hab) | $60 |

---

## 7. Próximos Pasos (Nodo 2 → Sprint 7)

| # | Tarea | Archivo | Prioridad |
|:---|:---|:---|:---:|
| 1 | Agregar `cleaningFee` con banda Zod en schema | `dashboard.schema.ts` | P1 |
| 2 | Añadir campo de limpieza al bloque de Tarifas en UI | `StepGeneral.tsx` | P1 |
| 3 | Añadir tooltip explicativo ("tarifa única, no por noche") | `StepGeneral.tsx` | P1 |
| 4 | Actualizar desglose en `ListingDetail.tsx` para claridad | `ListingDetail.tsx` | P1 |
| 5 | Añadir `cleaningFee` a los 6 listings mock | `constants/index.tsx` | P2 |
| 6 | Verificar que `calculatePaymentBreakdown` sigue siendo correcto | `lib/utils.ts` | P2 |
| 7 | QA: lint + tsc + revisión manual del desglose | — | P0 |

---

## 8. Respuesta Directa a la Pregunta

> **¿Monto fijo o porcentaje?**

**→ Monto fijo definido por el anfitrión.**

> **¿Cuánto se debe cobrar?**

**No hay un valor único correcto — depende del tamaño de la propiedad.**
La plataforma debe ofrecer una banda guía, no un monto obligatorio:

| Tu propiedad tiene... | Rango recomendado | Default sugerido |
|:---|:---:|:---:|
| 1 habitación | $0 — $20 | $10 |
| 2 habitaciones | $15 — $40 | $25 |
| 3 habitaciones | $30 — $60 | **$40** |
| 4+ habitaciones | $50 — $100 | $60 |

Para el **foco Beta de Lechería** (propiedades de 3-4 habitaciones, $150–$200/noche):
**El rango operativo es $40–$70 USD por estancia.**

---

*División de Ingeniería de IA — Antigravity · Junio 2026*
*Referencia: `implementation-plan-listing-v2.md` Sprint 7, `commission.ts` v2.2, `utils.ts` UCP Protocol*
