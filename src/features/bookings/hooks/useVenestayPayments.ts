/**
 * useVenestayPayments.ts
 * SPEC-CHECKOUT-PAY-001 v2.0
 *
 * Hook que carga los métodos de pago corporativos de VeneStay desde Firestore
 * a través del service `venestay-config.service.ts`.
 *
 * Uso en CheckoutPage:
 *   const { methods: availablePaymentMethods, loading: loadingMethods } = useVenestayPayments();
 */

import { useState, useEffect } from 'react';
import { getVenestayPaymentMethods } from '@/services/venestay-config.service';
import type { PaymentMethod } from '@/types';

interface UseVenestayPaymentsResult {
  methods: PaymentMethod[];
  loading: boolean;
}

export function useVenestayPayments(): UseVenestayPaymentsResult {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    getVenestayPaymentMethods()
      .then((data) => {
        if (!cancelled) setMethods(data);
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Cleanup para evitar setState en componente desmontado
    return () => {
      cancelled = true;
    };
  }, []);

  return { methods, loading };
}
