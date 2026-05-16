import React from 'react';
import { Landmark, Globe, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile, CurrencyPreference, PaymentMethod } from '@/features/auth/types';

interface TransactionalEngineProps {
  profile: UserProfile | null;
  currency: CurrencyPreference;
  setCurrency: (c: CurrencyPreference) => void;
  onOpenPaymentModal: () => void;
  onRemovePaymentMethod: (id: string) => void;
}

export const TransactionalEngine: React.FC<TransactionalEngineProps> = ({
  profile,
  currency,
  setCurrency,
  onOpenPaymentModal,
  onRemovePaymentMethod
}) => {
  return (
    <div className="py-12 md:py-16 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-brand-navy">Motor Transaccional</h3>
          <p className="text-xs text-gray-600 mt-1 font-medium">Configura cómo interactúas con el modelo P2P 20/80.</p>
        </div>
        <Landmark className="text-brand-500 h-6 w-6 opacity-40" aria-hidden="true" />
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-4">
          <label className="text-[10px] font-black tracking-[0.2em] text-gray-600 uppercase">Preferencia de Moneda</label>
          <div 
            role="radiogroup" 
            aria-label="Moneda de visualización"
            className="flex gap-2 rounded-2xl bg-gray-50 p-1.5 border border-gray-200"
          >
            {(['USD', 'VES'] as CurrencyPreference[]).map((curr) => (
              <button
                key={curr}
                type="button"
                role="radio"
                aria-checked={currency === curr}
                onClick={() => setCurrency(curr)}
                className={cn(
                  "flex-1 rounded-xl py-3 text-xs font-black tracking-widest transition-all focus:outline-none focus:ring-1 focus:ring-brand-500",
                  currency === curr 
                    ? "bg-brand-500 text-white shadow-lg" 
                    : "text-gray-500 hover:bg-white hover:text-brand-navy"
                )}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black tracking-[0.2em] text-gray-700 uppercase">Métodos de Pago VIP</label>
          <div className="space-y-3" role="list">
            {profile?.paymentMethods && profile.paymentMethods.length > 0 ? (
              profile.paymentMethods.map((method: PaymentMethod) => (
                <div 
                  key={method.id} 
                  role="listitem"
                  className="flex items-center justify-between rounded-2xl bg-white border border-gray-200 px-5 py-4 hover:border-brand-500/30 hover:bg-gray-50 transition-all cursor-pointer group focus-within:ring-1 focus-within:ring-brand-500 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gray-100 p-2">
                      {method.type === 'Zelle' && <Globe className="h-4 w-4 text-purple-700" />}
                      {method.type === 'Binance' && <Sparkles className="h-4 w-4 text-yellow-700" />}
                      {method.type === 'PagoMovil' && <Landmark className="h-4 w-4 text-emerald-700" />}
                    </div>
                    <span className="text-xs font-bold text-brand-navy">{method.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePaymentMethod(method.id);
                      }}
                      className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Eliminar ${method.label}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                    <ChevronRight className="h-3 w-3 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-500 font-bold italic py-2">No has vinculado métodos de pago aún.</p>
            )}
            <button 
              type="button" 
              onClick={onOpenPaymentModal}
              className="w-full rounded-2xl border-2 border-dashed border-gray-200 py-4 text-[10px] font-black tracking-[0.2em] text-brand-500 uppercase hover:border-brand-500/50 hover:bg-brand-50/50 transition-all focus:ring-1 focus:ring-brand-500"
            >
              + Vincular Nuevo Método
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
