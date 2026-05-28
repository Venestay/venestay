# INFORME TÉCNICO: PLAN DE OCULTACIÓN TEMPORAL DE PRECIOS EN BCV (BOLÍVARES)
**ID de Control:** INFO-BCV-S03-01  
**Estado:** PROPUESTO  
**Autor:** Antigravity (División de Ingeniería de IA)  
**Fecha:** 2026-05-28  

---

## 1. Introducción y Justificación de Negocio

En el contexto económico de Venezuela, coexisten múltiples referencias de tasas de cambio (tasa oficial del Banco Central de Venezuela o **BCV**, tasas de mercado paralelo o **P2P**, y cotizaciones en plataformas como Binance). 

Mostrar de forma masiva y persistente la conversión automática de precios en dólares (USD) a bolívares (VES) utilizando la tasa BCV oficial puede provocar los siguientes inconvenientes en la experiencia del usuario (UX):
1. **Confusión en la valoración real**: El usuario ve una tasa oficial que difiere de los costos comerciales del mercado real paralelo al que accede habitualmente.
2. **Incertidumbre en pagos manuales**: En flujos manuales P2P, los anfitriones y huéspedes suelen coordinar tasas acordadas al momento de la transferencia, por lo que una visualización estricta de la tasa oficial en el sistema genera falsas expectativas de cobro.
3. **Foco en métodos de alto valor**: VeneStay prioriza métodos frictionless y estables como **Zelle** y **USDT** (cripto), los cuales ofrecen descuentos nativos y evitan la volatilidad cambiaria de la moneda nacional.

Por ende, se propone ocultar de forma **temporal, reversible y centralizada** la visualización de montos e indicadores en Bolívares (BCV) en toda la interfaz de usuario.

---

## 2. Arquitectura de Control: Centralización mediante Feature Flag

Para asegurar que esta ocultación sea temporal y completamente reversible con un solo cambio de código, introduciremos una bandera de control global (Feature Flag) en el servicio de intercambio de divisas:

*   **Archivo centralizador:** [exchange-service.ts](file:///c:/Users/carlos.zabala/Documents/VeneStay/src/services/exchange-service.ts)
*   **Variable global:**
    ```typescript
    // Flag global para ocultación de precios y tasas en Bolívares (BCV)
    export const HIDE_BCV_PRICES = true; // Cambiar a false para restaurar visualización
    ```

Cualquier componente UI que interactúe con tasas BCV o equivalentes en bolívares importará este flag y condicionará su renderizado a partir de él.

---

## 3. Impacto Detallado por Módulo

A continuación se listan los cuatro módulos UI identificados y la lógica exacta que se aplicará para ocultar el precio en BCV:

### A. Tarjetas de Propiedades (`ListingCard.tsx`)
*   **Visual Actual:** Muestra debajo del precio en dólares una línea con la equivalencia estimada: `≈ XX.XXX Bs. (Tasa BCV)`.
*   **Acción de Ocultación:** Condicionar este bloque de texto completo al flag global.
*   **Lógica de Código:**
    ```tsx
    {!HIDE_BCV_PRICES && (
      <div className="text-brand-500 mt-0.5 text-[10px] font-black tracking-widest uppercase">
        ≈ {(listing.pricePerNight * bcvRate).toLocaleString('es-VE', ...)} Bs.
        <span className="font-medium opacity-50"> (Tasa BCV)</span>
      </div>
    )}
    ```
*   **Resultado UX:** Limpieza absoluta de la tarjeta, mostrando únicamente la métrica primaria oficial: el precio en USD.

### B. Resumen de Depósito del Checkout (`CheckoutPage.tsx`)
*   **Visual Actual:** En el bloque del costo de aseguramiento (20%), debajo del monto en USD, renderiza un texto dinámico con animación que muestra: `Bs. XX.XXX` calculado con la tasa BCV oficial.
*   **Acción de Ocultación:** Condicionar el bloque `motion.p` del `convertedAmount` al flag global.
*   **Lógica de Código:**
    ```tsx
    {!HIDE_BCV_PRICES && convertedAmount && rates && (
      <motion.p ...>
        Bs. {(calculatePaymentBreakdown(booking.totalAmount).depositAmount * rates.bcv).toLocaleString('es-VE', ...)}
      </motion.p>
    )}
    ```
*   **Resultado UX:** El checkout presenta de forma limpia e indudable el costo de aseguramiento en dólares americanos (USD).

### C. Desglose del Calculador de Divisas (`ExchangeCalculator.tsx`)
*   **Visual Actual:**
    1.  Muestra una fila de equivalencia dinámica: `Equivalente en Bolívares (VES)` bajo la sección "Pagas hoy para reservar".
    2.  Muestra un banner informativo en el footer: `Tasa Oficial BCV: XX.XX VES` con su metadata de actualización en tiempo real.
*   **Acción de Ocultación:** Condicionar ambos elementos al flag global.
*   **Lógica de Código:**
    1.  En la fila de equivalencia VES:
        ```tsx
        {supportsVES && !HIDE_BCV_PRICES && (
          <div className="flex justify-between items-center text-[11px] ...">
            <span>Equivalente en Bolívares (VES)</span>
            ...
          </div>
        )}
        ```
    2.  En el banner informativo del footer:
        ```tsx
        {!HIDE_BCV_PRICES && (
          <div className="flex items-center justify-between px-1 text-[9px] ...">
            <span>Tasa Oficial BCV: {rates.bcv.toFixed(2)} VES</span>
            ...
          </div>
        )}
        ```
*   **Resultado UX:** El panel del calculador se enfoca puramente en el precio base USD y en la conversión a USDT, eliminando ruidos informativos sobre bolívares.

### D. Tarjeta de Incentivo de Pago Cripto (`PaymentIncentiveCard.tsx`)
*   **Visual Actual:** Contiene un selector de pestañas (Tabs) que permite alternar entre ver el precio en "Bolívares" (calculado a BCV) o en "USDT (Crypto)". Muestra la brecha porcentual cambiaria en la cabecera.
*   **Acción de Ocultación:** 
    1.  Ocultar el tab selector de "Bolívares" y forzar la selección interna al método predeterminado `USDT`.
    2.  Ocultar el indicador de la brecha porcentual (`Brecha: XX%`) del header ya que no hay tasa bolívar contra la cual comparar visualmente.
*   **Lógica de Código:**
    *   Forzar `paymentMethod` a `'USDT'` y no renderizar el contenedor del switch de pestañas si `HIDE_BCV_PRICES` es `true`.
    *   Ocultar condicionalmente la sección de `Brecha` en el header:
        ```tsx
        {!HIDE_BCV_PRICES && (
          <div className="flex items-center space-x-2 rounded bg-white/10 px-2 py-1 ...">
            <span className="opacity-70">Brecha:</span>
            ...
          </div>
        )}
        ```
*   **Resultado UX:** La tarjeta se convierte en un banner premium enfocado al 100% en incentivar el uso de USDT (Crypto), mostrando de forma directa y clara el beneficio del descuento del 15% sin comparativas complejas e innecesarias de tipos de cambio de bolívares.

---

## 4. Plan de Verificación y QA Gate

Una vez implementados los cambios condicionantes, se ejecutará el siguiente plan de pruebas manuales y automáticas:
1.  **Validación de Compilación:** Ejecutar `npm run lint` (`eslint . && tsc --noEmit`) para asegurar que no hay roturas sintácticas por el uso de los flags.
2.  **Verificación de Visuales en Landing:** Inspeccionar que en la página de inicio las tarjetas de alojamiento rendericen solo el precio en dólares.
3.  **Verificación de Visuales en Checkout:**
    *   Seleccionar un alojamiento e ingresar al flujo de Checkout.
    *   Verificar que en la sección "Pagas hoy" de la tarjeta derecha no se renderice el monto estimado en Bolívares.
    *   Comprobar que en el widget `ExchangeCalculator` y `PaymentIncentiveCard` no se muestre información alguna del bolívar ni tasas BCV.
    *   Verificar que al cambiar el flag `HIDE_BCV_PRICES = false`, todo el sistema vuelva a su estado original de soporte multimoneda bolívar de forma instantánea.

---

## 5. Próxima Acción

Quedamos a la espera de tu **aprobación** sobre este informe técnico. Al confirmar que estás de acuerdo con el plan y el enfoque del Feature Flag, procederemos a la creación de la especificación técnica atómica e implementación quirúrgica de la solución.
