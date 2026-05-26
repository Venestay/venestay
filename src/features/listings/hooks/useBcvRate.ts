import { useState, useEffect } from 'react';
import { getExchangeRates } from '@/services/exchange-service';

export function useBcvRate(defaultRate = 36.5) {
  const [bcvRate, setBcvRate] = useState<number>(defaultRate);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getExchangeRates()
      .then((rates) => {
        if (isMounted && rates && rates.bcv) {
          setBcvRate(rates.bcv);
        }
      })
      .catch((err) => {
        console.error('Error fetching BCV rate in hook:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { bcvRate, isLoading };
}
