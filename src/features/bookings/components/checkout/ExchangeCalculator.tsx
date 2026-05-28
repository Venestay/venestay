import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeRates, PaymentMethod } from '@/types';
import { ShieldCheck, Info } from 'lucide-react';
import { getExchangeRates, HIDE_BCV_PRICES } from '@/services/exchange-service';

interface ExchangeCalculatorProps {
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethods?: PaymentMethod[];
}

const ExchangeCalculator: React.FC<ExchangeCalculatorProps> = ({
  totalPrice,
  depositAmount,
  remainingAmount,
  paymentMethods,
}) => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [timeAgoMsg, setTimeAgoMsg] = useState('Recién');

  const fetchRates = async (bypass = false) => {
    try {
      const fetchedRates = await getExchangeRates(bypass);
      setRates(fetchedRates);
      setLastRefreshedAt(new Date());
      setTimeAgoMsg('Recién');
    } catch (error) {
      console.error('Error fetching exchange rates in ExchangeCalculator:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(false);

    // Auto-refresh the BCV exchange rate every 5 minutes
    const pollInterval = setInterval(() => {
      fetchRates(true);
    }, 300000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      const diffMs = Date.now() - lastRefreshedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins === 0) {
        setTimeAgoMsg('Recién');
      } else {
        setTimeAgoMsg(`hace ${diffMins} min`);
      }
    }, 30000);

    return () => clearInterval(timeInterval);
  }, [lastRefreshedAt]);

  const acceptedMethodsList = useMemo(() => {
    const list = paymentMethods || [];
    if (list.length === 0) {
      return [
        { id: 'def_zelle', type: 'Zelle', label: 'Zelle (USD)', isVerified: true, data: {} },
        { id: 'def_pmovil', type: 'PagoMovil', label: 'Pago Móvil (VES)', isVerified: true, data: {} }
      ] as PaymentMethod[];
    }
    return list;
  }, [paymentMethods]);

  const supportsVES = useMemo(() => {
    return acceptedMethodsList.some(m => m.type === 'PagoMovil' || m.type === 'Transferencia');
  }, [acceptedMethodsList]);

  const supportsUSDT = useMemo(() => {
    return acceptedMethodsList.some(m => m.type === 'Binance');
  }, [acceptedMethodsList]);

  const supportsZelleUSD = useMemo(() => {
    return acceptedMethodsList.some(m => m.type === 'Zelle');
  }, [acceptedMethodsList]);

  if (loading || !rates) {
    return (
      <div className="w-full animate-pulse space-y-4 py-2">
        <div className="h-6 w-1/3 rounded bg-gray-100" />
        <div className="h-20 w-full rounded bg-gray-50" />
        <div className="h-16 w-full rounded bg-gray-50" />
      </div>
    );
  }

  // Calculate dynamic equivalencies
  const depositVES = depositAmount * rates.bcv;

  return (
    <div className="w-full space-y-4">
      {/* 3. BLOQUE DE PAGO: Pagas hoy vs Saldo restante al llegar */}
      <div className="space-y-3.5">
        {/* ROW 1: Pagas Hoy (Highlighted & clean) */}
        <div className="relative overflow-hidden rounded-[20px] border border-brand-navy/[0.06] bg-brand-navy/[0.02] p-4 transition-all duration-300 hover:border-brand-navy/[0.1] shadow-[0_2px_12px_rgba(5,11,24,0.01)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-brand-navy/60 uppercase">
                Pagas hoy para reservar
              </p>
              <p className="text-2xl font-black text-brand-navy font-sans tracking-tight mt-0.5">
                ${depositAmount.toFixed(2)}{' '}
                <span className="text-xs font-bold text-brand-navy/60">USD</span>
              </p>
            </div>
            <div className="text-right select-none">
              <span className="inline-block rounded-full bg-brand-navy text-white text-[8px] font-black tracking-widest uppercase px-3 py-1.5 leading-none">
                Anticipo 20%
              </span>
            </div>
          </div>

          {/* Dynamic equivalents (VES / USDT) shown cleanly beneath the USD amount */}
          <div className="mt-3.5 pt-3 border-t border-brand-navy/[0.04] space-y-2">
            {supportsVES && !HIDE_BCV_PRICES && (
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                <span className="text-slate-500">Equivalente en Bolívares (VES)</span>
                <span className="text-brand-navy font-extrabold font-sans">
                  {depositVES.toLocaleString('es-VE', { maximumFractionDigits: 2 })}{' '}
                  <span className="text-[9px] text-slate-400 font-bold">VES</span>
                </span>
              </div>
            )}

            {supportsUSDT && (
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5 select-none">
                  <span className="text-slate-500">Equivalente en USDT</span>
                  <span className="bg-brand-gold/[0.07] text-brand-gold border border-brand-gold/[0.18] text-[7.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider leading-none">
                    Mejor Precio
                  </span>
                </span>
                <span className="text-brand-navy font-extrabold font-sans">
                  {depositAmount.toFixed(2)}{' '}
                  <span className="text-[9px] text-brand-500 font-bold">USDT</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Saldo restante al llegar (Lower contrast, reduces anxiety, friendly) */}
        <div className="rounded-[20px] border border-slate-100 bg-white p-4 transition-all duration-300 hover:border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Saldo restante al llegar
              </p>
              <p className="text-xl font-bold text-slate-700 font-sans tracking-tight mt-0.5">
                ${remainingAmount.toFixed(2)}{' '}
                <span className="text-xs font-semibold text-slate-400">USD</span>
              </p>
            </div>
            <div className="text-right select-none">
              <span className="inline-block rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-black tracking-widest uppercase px-3 py-1.5 leading-none">
                Saldo 80%
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-normal mt-2.5">
            Pagas este saldo restante directamente en el alojamiento al momento de tu llegada.
          </p>
        </div>
      </div>

      {/* Tasa BCV & Live polling info metadata */}
      <div className="flex items-center justify-between px-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider select-none">
        <div className="flex items-center gap-1.5">
          {!HIDE_BCV_PRICES && (
            <>
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Tasa Oficial BCV: <span className="text-slate-700 font-extrabold">{rates.bcv.toFixed(2)} VES</span></span>
            </>
          )}
        </div>
        <span className="text-[8.5px] font-semibold text-slate-400">
          Actualizado {timeAgoMsg}
        </span>
      </div>
    </div>
  );
};

export default ExchangeCalculator;
