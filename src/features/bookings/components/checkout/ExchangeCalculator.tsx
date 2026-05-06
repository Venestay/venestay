import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeRates } from '@/types';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Star,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
  const [showFlash, setShowFlash] = useState(false);

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

  const handleSelect = (option: PaymentOption) => {
    setSelectedOption(option);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
  };

  const calculations = useMemo(() => {
    if (!rates) return null;

    const totalVES = basePriceUSD * rates.bcv;
    const totalUSDT = basePriceUSD * 1; // USDT is 1:1 with USD but in crypto
    const gap = ((rates.p2p - rates.bcv) / rates.bcv) * 100;

    return {
      totalVES,
      totalUSDT,
      gap,
    };
  }, [rates, basePriceUSD]);

  if (loading || !rates || !calculations) {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-3xl bg-gray-50" />
          <div className="h-32 rounded-3xl bg-gray-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-brand-navy/60 text-[10px] font-black tracking-widest uppercase">
          Asegurar con Anticipo (20%)
        </h4>
        <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 uppercase">
          <TrendingUp className="h-3 w-3" />
          <span>Tasa BCV: {rates.bcv}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* VES Card */}
        <button
          onClick={() => handleSelect('VES')}
          className={cn(
            'group relative flex flex-col items-start rounded-[32px] border-2 p-6 text-left transition-all duration-500',
            selectedOption === 'VES'
              ? 'border-brand-navy bg-white shadow-2xl scale-[1.02]'
              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
          )}
        >
          <div className="mb-4 flex w-full items-center justify-between">
            <div className={cn(
              "rounded-2xl p-2.5 transition-colors duration-500",
              selectedOption === 'VES' ? "bg-brand-navy text-brand-500" : "bg-gray-200 text-gray-500"
            )}>
              <Building2 className="h-5 w-5" />
            </div>
            {selectedOption === 'VES' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="text-brand-navy h-6 w-6" />
              </motion.div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Pago en VES
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-navy">
                {calculations.totalVES.toLocaleString('es-VE', {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="text-xs font-black text-brand-navy/40 uppercase">VES</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400">
              Monto hoy al cambio oficial
            </p>
          </div>
        </button>

        {/* USDT Card */}
        <button
          onClick={() => handleSelect('USDT')}
          className={cn(
            'group relative flex flex-col items-start rounded-[32px] border-2 p-6 text-left transition-all duration-500',
            selectedOption === 'USDT'
              ? 'border-brand-500 bg-white shadow-2xl scale-[1.02]'
              : 'border-gray-100 bg-gray-50/50 hover:border-brand-200'
          )}
        >
          <div className="mb-4 flex w-full items-center justify-between">
            <div className={cn(
              "rounded-2xl p-2.5 transition-colors duration-500",
              selectedOption === 'USDT' ? "bg-brand-500 text-brand-navy" : "bg-gray-200 text-gray-500"
            )}>
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50 text-emerald-600 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest uppercase">
                Mejor Precio
              </div>
              {selectedOption === 'USDT' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="text-brand-500 h-6 w-6" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Cripto (Binance)
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-navy">
                {calculations.totalUSDT.toFixed(2)}
              </span>
              <span className="text-xs font-black text-brand-navy/40 uppercase">USDT</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400">
              Confirmación instantánea 24/7
            </p>
          </div>

          {/* Flash Effect */}
          <AnimatePresence>
            {showFlash && selectedOption === 'USDT' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.2, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="bg-brand-500 absolute inset-0 rounded-[32px]"
              />
            )}
          </AnimatePresence>
        </button>
      </div>

      <motion.div 
        layout
        className="bg-brand-navy brand-gradient relative overflow-hidden rounded-3xl border border-white/10 p-5 text-white shadow-xl"
      >
        <div className="relative z-10 flex items-start gap-4">
          <div className="bg-brand-500/20 rounded-2xl p-2">
            <ShieldCheck className="text-brand-500 h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest">
              VeneStay Security Shield
            </p>
            <p className="text-[11px] leading-relaxed font-medium text-white/70">
              {selectedOption === 'USDT' 
                ? 'Al asegurar con USDT, tu reserva se confirma de forma automática y tu saldo queda protegido contra devaluación.'
                : 'Al asegurar con VES, el monto se calcula a tasa BCV del momento. Deberás enviar el comprobante para validación manual.'}
            </p>
          </div>
        </div>
        
        {/* Decorative Sparkle */}
        {selectedOption === 'USDT' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -right-4 -bottom-4 opacity-10"
          >
            <Sparkles className="h-24 w-24 text-brand-500" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ExchangeCalculator;
