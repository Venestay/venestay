import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeRates } from '@/types';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getExchangeRates } from '@/services/exchange-service';

interface ExchangeCalculatorProps {
  basePriceUSD: number; // This is the 20% deposit amount calculated by ListingDetail
}

type PaymentOption = 'VES' | 'USDT';

const ExchangeCalculator: React.FC<ExchangeCalculatorProps> = ({
  basePriceUSD,
}) => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<PaymentOption>('USDT');
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const fetchedRates = await getExchangeRates();
        setRates(fetchedRates);
      } catch (error) {
        console.error('Error in ExchangeCalculator fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handleSelect = (option: PaymentOption) => {
    setSelectedOption(option);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
  };

  const calculations = useMemo(() => {
    if (!rates) return null;

    const depositVES = basePriceUSD * rates.bcv;
    const depositUSDT = basePriceUSD * 1; // USDT is 1:1 with USD

    // The remaining 80% and 100% total
    const remaining80USD = basePriceUSD * 4;
    const total100USD = basePriceUSD * 5;

    const remaining80VES = remaining80USD * rates.bcv;
    const total100VES = total100USD * rates.bcv;

    return {
      depositVES,
      depositUSDT,
      remaining80USD,
      total100USD,
      remaining80VES,
      total100VES,
    };
  }, [rates, basePriceUSD]);

  if (loading || !rates || !calculations) {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-3xl bg-gray-50 animate-pulse" />
          <div className="h-32 rounded-3xl bg-gray-50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header and rate bar */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-brand-navy/60 text-[10px] font-black tracking-widest uppercase">
          Asegurar con Anticipo (20%)
        </h4>
        <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 uppercase">
          <TrendingUp className="h-3.5 w-3.5 text-brand-500" />
          <span>Tasa BCV: {rates.bcv.toFixed(2)}</span>
        </div>
      </div>

      {/* Cards: VES & USDT Option Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* VES Card */}
        <button
          onClick={() => handleSelect('VES')}
          className={cn(
            'group relative flex flex-col items-start rounded-[24px] border-2 p-5 text-left transition-all duration-300 w-full',
            selectedOption === 'VES'
              ? 'border-brand-navy bg-white shadow-xl scale-[1.01]'
              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
          )}
        >
          <div className="mb-3 flex w-full items-center justify-between">
            <div className={cn(
              "rounded-xl p-2 transition-colors duration-300",
              selectedOption === 'VES' ? "bg-brand-navy text-brand-500" : "bg-gray-200 text-gray-500"
            )}>
              <Building2 className="h-4.5 w-4.5" />
            </div>
            {selectedOption === 'VES' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="text-brand-navy h-5 w-5" />
              </motion.div>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
              Pago en VES
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-brand-navy">
                {calculations.depositVES.toLocaleString('es-VE', {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="text-xs font-black text-brand-navy/40 uppercase">VES</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 leading-none">
              Monto al cambio oficial
            </p>
          </div>
        </button>

        {/* USDT Card */}
        <button
          onClick={() => handleSelect('USDT')}
          className={cn(
            'group relative flex flex-col items-start rounded-[24px] border-2 p-5 text-left transition-all duration-300 w-full',
            selectedOption === 'USDT'
              ? 'border-brand-500 bg-white shadow-xl scale-[1.01]'
              : 'border-gray-100 bg-gray-50/50 hover:border-brand-200'
          )}
        >
          <div className="mb-3 flex w-full items-center justify-between">
            <div className={cn(
              "rounded-xl p-2 transition-colors duration-300",
              selectedOption === 'USDT' ? "bg-brand-500 text-brand-navy" : "bg-gray-200 text-gray-500"
            )}>
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase">
                Mejor Precio
              </div>
              {selectedOption === 'USDT' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="text-brand-500 h-5 w-5" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
              Cripto (Binance)
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-brand-navy">
                {calculations.depositUSDT.toFixed(2)}
              </span>
              <span className="text-xs font-black text-brand-navy/40 uppercase">USDT</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 leading-none">
              Confirmación instantánea 24/7
            </p>
          </div>

          {/* Flash Effect */}
          <AnimatePresence>
            {showFlash && selectedOption === 'USDT' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.15, scale: 1.1 }}
                exit={{ opacity: 0 }}
                className="bg-brand-500 absolute inset-0 rounded-[24px]"
              />
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Security Shield Banner */}
      <motion.div 
        layout
        className="bg-brand-navy brand-gradient relative overflow-hidden rounded-[20px] border border-white/10 p-4 text-white shadow-lg"
      >
        <div className="relative z-10 flex items-start gap-3">
          <div className="bg-brand-500/20 rounded-xl p-1.5">
            <ShieldCheck className="text-brand-500 h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white">
              VeneStay Security Shield
            </p>
            <p className="text-[9px] leading-relaxed font-medium text-white/70">
              {selectedOption === 'USDT' 
                ? 'Al asegurar con USDT, tu reserva se confirma de forma automática y tu saldo queda protegido contra la devaluación.'
                : 'Al asegurar con VES, el monto se calcula a la tasa BCV real del momento. Deberás enviar el comprobante de pago para validación manual.'}
            </p>
          </div>
        </div>
        
        {selectedOption === 'USDT' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -right-3 -bottom-3 opacity-10"
          >
            <Sparkles className="h-16 w-16 text-brand-500" />
          </motion.div>
        )}
      </motion.div>

      {/* Visual Timeline: UCP 20/80 Stepper */}
      <div className="rounded-[20px] border border-gray-100 bg-gray-50/40 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[8px] font-black tracking-widest text-gray-400 uppercase">
            Protocolo de Pago VeneStay (UCP 20/80)
          </p>
          <span className="text-[8px] font-bold text-brand-navy/60 px-2 py-0.5 bg-brand-500/10 rounded-full">
            Seguro & Protegido
          </span>
        </div>
        
        <div className="relative flex items-center justify-between pt-1">
          {/* Connector Line */}
          <div className="absolute top-4 left-[20%] right-[20%] h-[1.5px] border-t-2 border-dashed border-brand-500/25 -z-10" />

          {/* Stepper Dot 1: 20% down payment */}
          <div className="flex flex-col items-center text-center w-[45%]">
            <div className="h-8 w-8 rounded-full bg-brand-navy border-2 border-brand-500 text-brand-500 flex items-center justify-center font-black text-[10px] shadow-md shadow-brand-500/5">
              20%
            </div>
            <p className="mt-1.5 text-[9px] font-black text-brand-navy uppercase leading-none">Pagas Hoy</p>
            <p className="text-[8px] font-bold text-gray-400 mb-0.5">En la web para asegurar</p>
            <p className="text-[11px] font-black text-emerald-600">
              {selectedOption === 'USDT' 
                ? `${calculations.depositUSDT.toFixed(2)} USDT` 
                : `${calculations.depositVES.toLocaleString('es-VE', { maximumFractionDigits: 0 })} VES`}
            </p>
          </div>

          {/* Stepper Dot 2: 80% remaining */}
          <div className="flex flex-col items-center text-center w-[45%]">
            <div className="h-8 w-8 rounded-full bg-brand-navy border border-white/10 text-white/50 flex items-center justify-center font-black text-[10px]">
              80%
            </div>
            <p className="mt-1.5 text-[9px] font-black text-brand-navy/70 uppercase leading-none">Pagas en el Destino</p>
            <p className="text-[8px] font-bold text-gray-400 mb-0.5">Al anfitrión en el Check-in</p>
            <p className="text-[11px] font-black text-brand-navy/60">
              {selectedOption === 'USDT' 
                ? `${calculations.remaining80USD.toFixed(2)} USDT` 
                : `${calculations.remaining80VES.toLocaleString('es-VE', { maximumFractionDigits: 0 })} VES`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabular Cost Summary Breakdown */}
      <div className="border-t border-gray-100 pt-3.5 space-y-2">
        <div className="flex justify-between text-xs font-bold text-gray-500">
          <span>Total de la Estancia (100%):</span>
          <span className="text-brand-navy font-black">
            {selectedOption === 'USDT' 
              ? `${calculations.total100USD.toFixed(2)} USDT` 
              : `${calculations.total100VES.toLocaleString('es-VE', { maximumFractionDigits: 0 })} VES`}
          </span>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-500">
          <span>Anticipo de Reserva (20% hoy):</span>
          <span className="text-emerald-600 font-black">
            {selectedOption === 'USDT' 
              ? `${calculations.depositUSDT.toFixed(2)} USDT` 
              : `${calculations.depositVES.toLocaleString('es-VE', { maximumFractionDigits: 0 })} VES`}
          </span>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-400 border-t border-gray-100/50 pt-2">
          <span>Saldo Restante (80% al llegar):</span>
          <span className="text-brand-navy/70 font-semibold">
            {selectedOption === 'USDT' 
              ? `${calculations.remaining80USD.toFixed(2)} USDT` 
              : `${calculations.remaining80VES.toLocaleString('es-VE', { maximumFractionDigits: 0 })} VES`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExchangeCalculator;
