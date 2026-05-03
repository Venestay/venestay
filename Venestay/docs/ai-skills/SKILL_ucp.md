# Agentic Commerce: Universal Commerce Protocol (UCP) - SKILL

## Descripción General

Este Skill otorga al agente el conocimiento para implementar el Universal Commerce Protocol (UCP). El objetivo es estandarizar el flujo de `checkout` y la estructura de datos de los productos (propiedades) para soportar "Agentic Commerce" (transacciones ejecutadas y comprendidas por IA) garantizando seguridad e interoperabilidad en pasarelas complejas.

---

## 1. Estructura de Sesiones de Checkout (Checkout Sessions)

- **Contexto:** Las transacciones no deben ser simples mutaciones directas a la base de datos sin contexto. Un agente necesita saber qué se está pagando y cómo se divide el dinero.
- **Regla:** Implementa un objeto de sesión estandarizado (`CheckoutSession`) antes de procesar un pago.
- **Acción:** El payload de la transacción debe separar claramente el `total_amount`, `platform_fee` (el 20% de anticipo) y el `host_balance` (el 80% presencial).
- **Ejemplo UCP Estándar:**
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
    metadata: { agenticReady: true };
  }
  ```
