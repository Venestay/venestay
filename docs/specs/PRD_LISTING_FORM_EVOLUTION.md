# PRD: Evolución del Formulario de Propiedades (Sprint 1)

## 🎯 Objetivo
Como **Anfitrión de VeneStay**, quiero **configurar reglas de la casa, horarios de check-in/out, depósitos de seguridad y políticas de cancelación** al publicar o editar mi propiedad, para **proteger mi inmueble financieramente y alinear la experiencia del huésped con los estándares de plataformas como Airbnb y Booking**.

---

## 🏃‍♂️ Alcance (Sprint 1: Cimientos de Datos)

- **Contrato de Datos (TypeScript):** Enriquecer la interfaz `Listing` con los campos necesarios de logística, reglas y políticas financieras.
- **Validación Estricta (Zod):** Refactorizar el esquema de validación local y de base de datos con reglas condicionales (ej. depósito obligatorio si se requiere depósito de seguridad).

---

## ⚙️ Especificaciones Técnicas

### 1. Modelo de Datos (`Listing`)
Campos a integrar en la interfaz `Listing`:
- `houseRules`: `{ allowPets: boolean, allowSmoking: boolean, allowParties: boolean, allowChildren: boolean, additionalRules?: string }`
- `checkInTime`: string (horario de entrada)
- `checkOutTime`: string (horario de salida)
- `requiresDeposit`: boolean (si requiere depósito de seguridad)
- `depositAmount`: number (monto del depósito)
- `cleaningFee`: number (gastos de limpieza)
- `cancellationPolicy`: 'flexible' | 'moderate' | 'strict' (política de cancelación)

### 2. Esquemas de Validación (Zod)
- **Esquema del Dashboard (`dashboard.schema.ts`):**
  - Configurar valores por defecto para una experiencia guiada suave.
  - Implementar la validación condicional:
    ```typescript
    if (requiresDeposit === true) {
      depositAmount > 0
    }
    ```
- **Esquema de Dominio (`schema.ts`):**
  - Mantener los campos opcionales en el esquema general para asegurar compatibilidad con registros antiguos en Firestore (migración silenciosa).

---

## ✅ Criterios de Aceptación (DoD)
- Los tipos no emiten errores al compilar (`npx tsc --noEmit` exitoso).
- Zod bloquea correctamente si se activa el depósito pero no se especifica un monto mayor a 0.
