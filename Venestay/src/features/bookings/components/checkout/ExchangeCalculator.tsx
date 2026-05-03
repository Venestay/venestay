import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeRates } from '@/types';
import {
  TrendingUp,
  Wallet,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExchangeCalculatorProps {
  basePriceUSD: number;
}

type PaymentOption = 'VES' | 'USDT';

const ExchangeCalculator: React.FC<ExchangeCalculatorProps> = ({
  basePriceUSD,
}) => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<PaymentOption>('USDT');

  const discountRate = 0.15; // 15% incentive
  const usdtPriceUSD = basePriceUSD * (1 - discountRate);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        // Simulating fetch
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockRates: ExchangeRates = {
          bcv: 36.45,
          p2p: 41.2,
          lastUpdated: new Date().toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setRates(mockRates);
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const calculations = useMemo(() => {
    if (!rates) return null;

    const totalVES = basePriceUSD * rates.bcv;
    const totalUSDT = usdtPriceUSD;
    const gap = ((rates.p2p - rates.bcv) / rates.bcv) * 100;

    const vesAtBcv = basePriceUSD * rates.bcv;
    const usdtValueInVes = totalUSDT * rates.p2p;
    const savingsVES = vesAtBcv - usdtValueInVes;

    return {
      totalVES,
      totalUSDT,
      gap,
      savingsVES,
    };
  }, [rates, basePriceUSD, usdtPriceUSD]);

  if (loading || !rates || !calculations) {
    return (
      <div className="w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <div className="mb-4 h-4 w-32 rounded bg-gray-200"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-xl bg-gray-200"></div>
          <div className="h-24 rounded-xl bg-gray-200"></div>
        </div>
      </div>
    );
  }

  const isGapHigh = calculations.gap > 20;

  return (
    <div className="animate-fade-in w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-brand-navy/60 text-[11px] font-black tracking-widest uppercase">
          Modalidad de Pago
        </h4>
        <div
          className={cn(
            'flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[10px] font-black tracking-tight transition-all duration-500',
            isGapHigh
              ? 'bg-brand-500 text-brand-navy shadow-lg'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          <TrendingUp
            className={cn('h-3 w-3', isGapHigh && 'animate-bounce')}
          />
          <span>Brecha: {calculations.gap.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* VES Card */}
        <div
          onClick={() => setSelectedOption('VES')}
          className={cn(
            'relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300',
            selectedOption === 'VES'
              ? 'border-brand-navy scale-[1.02] bg-white shadow-xl'
              : 'hover:border-brand-200 border-gray-100 bg-gray-50 opacity-60 hover:opacity-100'
          )}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="bg-brand-navy text-brand-500 rounded-xl p-2">
              <Building2 className="h-4 w-4" />
            </div>
            {selectedOption === 'VES' && (
              <CheckCircle2 className="text-brand-navy h-5 w-5" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-brand-navy/40 text-[10px] font-black uppercase">
              Transferencia VES
            </p>
            <p className="text-brand-navy text-xl leading-none font-black">
              {calculations.totalVES.toLocaleString('es-VE', {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-[10px] font-bold text-gray-400">
              1$ = {rates.bcv} (BCV)
            </p>
          </div>
        </div>

        {/* USDT Card */}
        <div
          onClick={() => setSelectedOption('USDT')}
          className={cn(
            'relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300',
            selectedOption === 'USDT'
              ? 'scale-[1.02] border-emerald-500 bg-white shadow-xl'
              : 'border-gray-100 bg-gray-50 opacity-60 hover:border-emerald-200 hover:opacity-100'
          )}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl bg-emerald-500 p-2 text-white">
              <Zap className="h-4 w-4" />
            </div>
            {selectedOption === 'USDT' && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
          </div>

          <div className="space-y-1">
            <p className="flex items-center text-[10px] font-black text-emerald-600 uppercase">
              PAGAR CON USDT <Star className="ml-1 h-3 w-3 fill-emerald-500" />
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-xl leading-none font-black text-emerald-600">
                {calculations.totalUSDT.toFixed(2)}
              </p>
              <span className="text-xs font-bold text-gray-400 line-through">
                ${basePriceUSD}
              </span>
            </div>

            <div className="mt-2 inline-block rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
              AHORRO:{' '}
              {calculations.savingsVES.toLocaleString('es-VE', {
                maximumFractionDigits: 0,
              })}{' '}
              VES
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-navy brand-gradient rounded-2xl border border-white/10 p-4 text-white/90 shadow-lg">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="text-brand-500 mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-[10px] leading-relaxed font-medium">
            <span className="mb-1 block font-black text-white">
              VeneStay Security Shield
            </span>
            Al reservar con USDT obtienes confirmación inmediata y el tipo de
            cambio se congela durante la negociación.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExchangeCalculator;






