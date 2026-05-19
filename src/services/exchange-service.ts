import { ExchangeRates } from '@/types';

let cachedRates: ExchangeRates | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const DEFAULT_FALLBACK_RATES: ExchangeRates = {
  bcv: 515.18,
  p2p: 718.85,
  lastUpdated: new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  }),
};

interface DolarApiRate {
  moneda: string;
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();

  // If cache is valid, return cached rates
  if (cachedRates && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares');
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data = (await response.json()) as DolarApiRate[];
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from exchange rates API');
    }

    const oficial = data.find((item) => item.fuente === 'oficial');
    const paralelo = data.find((item) => item.fuente === 'paralelo');

    if (!oficial || !paralelo) {
      throw new Error('Required exchange rates not found in API response');
    }

    const newRates: ExchangeRates = {
      bcv: oficial.promedio || DEFAULT_FALLBACK_RATES.bcv,
      p2p: paralelo.promedio || DEFAULT_FALLBACK_RATES.p2p,
      lastUpdated: new Date(oficial.fechaActualizacion || now).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    cachedRates = newRates;
    cacheTimestamp = now;

    return newRates;
  } catch (error) {
    console.error('Error fetching exchange rates from API, using fallback:', error);
    
    // Return cached rates if available (even if expired) before fallback
    if (cachedRates) {
      return cachedRates;
    }
    
    return DEFAULT_FALLBACK_RATES;
  }
}
