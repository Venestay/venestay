import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeRates } from '@/types';
import { getExchangeRates, HIDE_BCV_PRICES } from '@/services/exchange-service';

// Custom Hook to manage exchange rates
export const useExchangeRate = () => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const realRates = await getExchangeRates();
        setRates(realRates);
      } catch (err) {
        setError('Error al cargar las tasas de cambio');
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const gapPercentage = useMemo(() => {
    if (!rates) return 0;
    return ((rates.p2p - rates.bcv) / rates.bcv) * 100;
  }, [rates]);

  return { rates, loading, error, gapPercentage };
};

interface PaymentIncentiveCardProps {
  basePriceUSD: number;
}

const PaymentIncentiveCard: React.FC<PaymentIncentiveCardProps> = ({
  basePriceUSD,
}) => {
  const { rates, loading, gapPercentage } = useExchangeRate();
  const [paymentMethod, setPaymentMethod] = useState<'VES' | 'USDT'>('USDT');

  const discountRate = 0.15; // 15% discount for USDT

  if (loading) {
    return (
      <div className="flex h-48 w-full animate-pulse items-center justify-center rounded-xl bg-gray-50">
        <div className="flex flex-col items-center text-gray-400">
          <i className="fa-solid fa-circle-notch mb-2 animate-spin text-2xl"></i>
          <span className="text-xs font-medium tracking-widest uppercase">
            Calculando mejor precio...
          </span>
        </div>
      </div>
    );
  }

  const totalVES = basePriceUSD * (rates?.bcv || 0);
  const totalUSDT = basePriceUSD * (1 - discountRate);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header with Gap Info */}
      <div className="bg-brand-navy p-4 text-white">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold tracking-tight uppercase">
            Resumen de Pago
          </h4>
          {!HIDE_BCV_PRICES && (
            <div className="flex items-center space-x-2 rounded bg-white/10 px-2 py-1 font-mono text-[10px]">
              <span className="opacity-70">Brecha:</span>
              <span className="text-brand-500 font-bold">
                {gapPercentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Tabs/Toggle */}
        {!HIDE_BCV_PRICES && (
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setPaymentMethod('VES')}
              className={`flex flex-1 items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-all ${
                paymentMethod === 'VES'
                  ? 'text-brand-navy bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-university mr-2"></i>
              Bolívares
            </button>
            <button
              onClick={() => setPaymentMethod('USDT')}
              className={`relative flex flex-1 items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-all ${
                paymentMethod === 'USDT'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-coins mr-2"></i>
              USDT (Crypto)
              {paymentMethod !== 'USDT' && (
                <span className="absolute -top-2 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Price Display */}
        <div className="space-y-4">
          {paymentMethod === 'VES' && !HIDE_BCV_PRICES ? (
            <div className="animate-fadeIn">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm text-gray-500">Total a pagar</span>
                <span className="text-brand-navy text-2xl font-black">
                  {totalVES.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  VES
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-medium text-gray-400 uppercase">
                <span>Tasa BCV</span>
                <span>1 USD = {rates?.bcv} VES</span>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total a pagar</span>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400 line-through">
                      ${basePriceUSD}
                    </span>
                    <span className="text-3xl font-black text-emerald-600">
                      {totalUSDT.toFixed(2)} USDT
                    </span>
                  </div>
                  <span className="mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Ahorras ${(basePriceUSD * discountRate).toFixed(2)} (15%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-medium text-gray-400 uppercase">
                <span>Tasa P2P Ref.</span>
                <span>1 USD = {rates?.p2p} VES</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Legend */}
        <div className="mt-6 border-t border-gray-50 pt-4">
          <div className="flex items-start space-x-3 rounded-lg bg-blue-50/50 p-3">
            <i className="fa-solid fa-circle-info mt-0.5 text-blue-500"></i>
            <p className="text-[11px] leading-relaxed text-blue-700">
              Al pagar en <span className="font-bold">USDT</span> evitas
              comisiones bancarias, proteges tu capital de la inflación y
              obtienes un <span className="font-bold">precio preferencial</span>{' '}
              exclusivo de VeneStay.
            </p>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between bg-gray-50 px-5 py-2">
        <span className="text-[9px] font-medium tracking-tighter text-gray-400 uppercase">
          Actualizado: {rates?.lastUpdated}
        </span>
        <div className="flex items-center space-x-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
          <span className="text-[9px] font-bold tracking-tighter text-emerald-600 uppercase">
            Live Rates
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentIncentiveCard;






