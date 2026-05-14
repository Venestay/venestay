# Análisis de Formulario VeneStay vs Estándares de la Industria

Este documento detalla la comparativa entre el flujo actual de registro de propiedades de VeneStay y los estándares globales (Airbnb, Booking, VRBO), identificando oportunidades de mejora para profesionalizar la plataforma.

## 1. Estado Actual (VeneStay v1.0)
Nuestro formulario actual utiliza un **Wizard de 4 Pasos**:
1.  **General**: Título, descripción, precio, capacidad, comodidades.
2.  **Galería**: Fotos por ambiente (Premium touch).
3.  **Mapa**: Ubicación geográfica.
4.  **Pagos**: Configuración de métodos (Zelle, Binance, Pago Móvil).

---

## 2. Análisis de Brechas (Gap Analysis)

| Característica | Airbnb / Booking | VeneStay Actual | Impacto | Recomendación VeneStay |
| :--- | :--- | :--- | :--- | :--- |
| **Reglas de la Casa** | Checklist estructurado (Mascotas, Fumar, Eventos). | ❌ Ausente | **Alto** | Implementar en Paso 1 (General). |
| **Depósito de Seguridad** | Gestión de daños / Retención. | ❌ Ausente | **Crítico** | Implementar en Paso 4 (Precios). |
| **Política de Cancelación** | Tiers (Flexible, Moderada, Estricta). | ❌ Ausente | **Medio** | Añadir selector en Paso 4. |
| **Check-in / Check-out** | Ventanas de tiempo obligatorias. | ❌ Ausente | **Bajo** | Añadir inputs de hora en Paso 1. |
| **Gastos de Limpieza** | Campo separado del precio noche. | ❌ Ausente | **Medio** | Campo numérico adicional en Paso 4. |
| **Estancia Mínima** | Restricción por noches. | ❌ Ausente | **Medio** | Input numérico (default 1) en Paso 1. |

---

## 3. Propuesta de Implementación Técnica

### 3.1 Nuevos Campos Prioritarios

#### Reglas de la Casa (Step 1 - General)
Implementar un checklist rápido de "Sí/No" con iconos:
- `allowPets`: ¿Se permiten mascotas? (🐾)
- `allowSmoking`: ¿Se permite fumar? (🚭)
- `allowParties`: ¿Se permiten fiestas o eventos? (🎉)
- `allowChildren`: ¿Apto para niños? (👶)
- `additionalRules`: Reglas adicionales (Textarea).

#### Seguridad y Cargos (Step 4 - Precios y Políticas)
- **Depósito de Seguridad**: 
    - Toggle: `requiresDeposit` (Boolean).
    - Input: `depositAmount` (Number).
    - *Nota UX*: "Este monto se maneja directamente con el anfitrión al momento del ingreso".
- **Tarifa de Limpieza**: 
    - Input: `cleaningFee` (Number).
- **Política de Cancelación**: 
    - Select: `cancellationPolicy`
        - *Flexible*: Reembolso total 24h antes.
        - *Moderada*: Reembolso total 5 días antes.
        - *Estricta*: Reembolso del 50% hasta 7 días antes.

---

## 4. Próximos Pasos (Roadmap)
1.  **Actualizar Tipos**: Modificar `src/types.ts` para incluir los nuevos campos en la interfaz `Listing`.
2.  **Actualizar Esquema**: Refactorizar `src/features/dashboard/types/dashboard.schema.ts` para validación Zod.
3.  **UI Components**: Crear el componente `HouseRulesSelector` para el Paso 1.
4.  **Resumen de Precios**: Actualizar la lógica del Paso 4 para mostrar el desglose (Noche + Limpieza + Depósito).

---

---

## 5. Integridad Técnica y Realidad de Realización

Tras una revisión con las AutoSkills de arquitectura y diseño, se valida que el proyecto es **100% realizable** bajo los siguientes parámetros de integridad:

### 5.1 Robustez de Datos (TypeScript + Zod)
- **Integridad**: El uso de validaciones cruzadas en Zod garantizará que no existan inconsistencias (ej. depósitos activos sin monto definido).
- **Compatibilidad**: Se utilizarán tipos opcionales para asegurar que las propiedades antiguas en la base de datos no rompan la aplicación.

### 5.2 Arquitectura de Componentes
- **Mantenibilidad**: Se aplicarán patrones de composición para extraer las nuevas secciones en componentes atómicos (`HouseRulesSelector`, `PricePolicySection`), evitando que `ListingForm.tsx` se vuelva inmanejable.

### 5.3 Experiencia de Usuario (Premium UX)
- **Featue Fatigue**: Para evitar saturar al usuario, se utilizarán toggles progresivos y micro-interacciones que solo muestran campos complejos cuando son necesarios.

---

## 6. Conclusión
La inclusión de estos campos no solo alinea a VeneStay con los estándares internacionales, sino que **protege al anfitrión venezolano**, quien suele ser muy cauteloso con el cuidado de su propiedad y la puntualidad de los pagos adicionales.

---
**Generado por Antigravity AI**
*Fecha: 14 de Mayo, 2026*
