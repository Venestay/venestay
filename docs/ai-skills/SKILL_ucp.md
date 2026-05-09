# Comercio Agéntico: Protocolo de Comercio Universal (UCP) - SKILL

## Descripción General

Este Skill otorga al agente el conocimiento para implementar el Universal Commerce Protocol (UCP). El objetivo es estandarizar el flujo de `checkout` y la estructura de datos de los productos (propiedades) para soportar "Agentic Commerce" (transacciones ejecutadas y comprendidas por IA) garantizando seguridad e interoperabilidad en pasarelas complejas.

---

## 1. Estructura de Sesiones de Checkout (Checkout Sessions)

- **Contexto:** Las transacciones no deben ser simples mutaciones directas a la base de datos sin contexto. Un agente necesita saber qué se está pagando y cómo se divide el dinero.
- **Regla:** Implementa un objeto de sesión estandarizado (`CheckoutSession`) antes de procesar un pago. Toda transacción debe persistir un objeto `financials` inmutable para auditoría.
- **Acción:** El payload de la transacción debe separar claramente el `total_amount`, `ucp_deposit` (el 20% de anticipo), el `offline_balance` (el 80% presencial) y la `platform_fee` (basada en Tiers).
- **Modelo de Comisiones v2.2:**
  - **Tier 1 (Base):** 12%
  - **Tier 2 (Verified):** 10%
  - **Tier 3 (Superhost):** 8%
- **Ejemplo UCP Estándar v2.2:**
  ```typescript
  interface UCPTransactionPayload {
    transactionId: string;
    intent: 'escrow_deposit';
    currency: 'USD' | 'VES';
    amounts: {
      total: number;
      depositRequired: number; // 20%
      offlineBalance: number; // 80%
    };
    financials: {
      commissionTier: number; // 12 | 10 | 8
      platformFee: number; // Real profit
      hostPayout: number; // Settlement from deposit
      netProfit: number; // Total for host
    };
    metadata: { agenticReady: true };
  }
  ```
