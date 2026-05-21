# Especificación Técnica (v2.2.0): Dashboard del Anfitrión (Host Control Center)

Esta especificación describe el panel administrativo y los flujos operacionales del **Host Control Center** en el ecosistema de **VeneStay**.

---

## 1. Objetivo del Módulo
Proporcionar a los anfitriones un panel unificado de control premium para gestionar sus listados, bloquear disponibilidad en el calendario, verificar transacciones y consultar sus estadísticas de fidelidad y tasas de comisión dinámica.

---

## 2. Características Principales

### 2.1. Gestión de Calendario y Disponibilidad
*   Bloqueos manuales por mantenimiento, limpieza o uso personal de la propiedad.
*   Sincronización en tiempo real de estados de reserva (`AVAILABLE`, `BOOKED`, `BLOCKED`).

### 2.2. Ecosistema de Tasas Dinámicas por Verificación (Commission Tiers)
*   **Comisión Reducida (10%):** Aplicada de forma automática a los hosts que completan la verificación KYC estricta y vinculan métodos de pago validados.
*   **Comisión Estándar (12%):** Cobrada por defecto a cuentas sin verificación de identidad.

### 2.3. Verificación de Transacciones Manuales (Multimoneda)
*   Pantalla dedicada al host para auditar pagos de Zelle, Binance P2P y Pago Móvil.
*   Visualización a pantalla completa del soporte gráfico (screenshot de la transferencia) y del campo de referencia de transacción.
*   **Transiciones de Estado de Reserva:**
    *   Confirmar pago: Transiciona el estado de la reserva de `AWAITING_VERIFICATION` a `CONFIRMED`.
    *   Rechazar pago: Transiciona el estado a `REJECTED`, solicitando obligatoriamente una razón de rechazo de texto libre que se le notificará al huésped.

---

## 3. Modelo de Datos de Calendario (TypeScript)
```typescript
export interface CalendarBlock {
  listingId: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  reason?: string;   // 'MAINTENANCE' | 'PERSONAL_USE' | 'DIRECT_BOOKING'
  createdAt: string;
}
```
