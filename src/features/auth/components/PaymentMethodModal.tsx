import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Globe, Sparkles, Landmark, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethodType } from '@/types';
import { PaymentMethod } from '@/features/auth/types';
import { toast } from 'sonner';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (method: PaymentMethod) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState<PaymentMethodType>('Zelle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    email: '',
    binanceId: '',
    accountHolder: '',
    phoneNumber: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate validation/connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newMethod = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        label: formData.label || (type === 'Zelle' ? formData.email : formData.binanceId),
        isVerified: true,
        data: { ...formData }
      };

      onAdd(newMethod);
      toast.success(`${type} vinculado correctamente`);
      onClose();
    } catch (error) {
      toast.error('No se pudo vincular el método');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-gray-100 bg-white p-8 text-brand-navy shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-gray-300 hover:text-brand-navy transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-black tracking-tight">Vincular Método de Pago</h3>
                <p className="text-sm text-gray-500 mt-1">Configura tu motor transaccional VIP.</p>
              </div>

              <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                {(['Zelle', 'Binance', 'PagoMovil'] as PaymentMethodType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      type === t ? "bg-white text-brand-500 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-4">
                  {type === 'Zelle' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Correo de Zelle</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ejemplo@correo.com"
                        className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-brand-navy focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {type === 'Binance' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Binance Pay ID</label>
                      <input
                        required
                        value={formData.binanceId}
                        onChange={(e) => setFormData({ ...formData, binanceId: e.target.value })}
                        placeholder="8 dígitos"
                        className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-brand-navy focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Titular de la Cuenta</label>
                    <input
                      required
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      placeholder="Nombre Completo"
                      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-brand-navy focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-brand-500 py-5 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-brand-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    `Vincular ${type}`
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentMethodModal;
