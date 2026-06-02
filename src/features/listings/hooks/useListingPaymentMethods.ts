import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaymentMethod } from '@/features/auth/types';

interface UseListingPaymentMethodsResult {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook para extraer los métodos de pago registrados explícitamente en el Listing.
 * Esto asegura que los pagos se asocien correctamente a la propiedad (Resolución 1 del Flujo Corto).
 */
export const useListingPaymentMethods = (listingId?: string): UseListingPaymentMethodsResult => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!listingId) {
      setIsLoading(false);
      return;
    }

    const fetchPaymentMethods = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (listingDoc.exists()) {
          const data = listingDoc.data();
          // Asume que la propiedad tiene un array de paymentMethods o bankDetails
          const methods = data.paymentMethods || [];
          setPaymentMethods(methods);
        } else {
          setPaymentMethods([]);
        }
      } catch (err: unknown) {
        console.error('Error fetching listing payment methods:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [listingId]);

  return { paymentMethods, isLoading, error };
};
