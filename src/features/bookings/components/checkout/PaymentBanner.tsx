import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PaymentBanner: React.FC = () => {
  return (
    <div className="bg-brand-navy brand-gradient animate-fade-in group hover:shadow-brand-500/20 rounded-2xl border border-white/10 p-4 text-white/90 shadow-lg transition-all duration-300">
      <div className="flex items-start space-x-3">
        <ShieldCheck className="text-brand-500 mt-0.5 h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
        <p className="text-[10px] leading-relaxed font-medium">
          <span className="mb-1 block text-xs font-black tracking-widest text-white uppercase">
            Reserva Protegida
          </span>
          Solo transfiere el 20% de anticipo y el saldo restante se liquida
          directamente con el anfitrión al ingresar a la propiedad.
        </p>
      </div>
    </div>
  );
};

export default PaymentBanner;






