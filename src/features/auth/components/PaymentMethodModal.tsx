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
    bankName: '',
    idNumber: '',
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
        label: formData.label || (
          type === 'Zelle' ? formData.email :
          type === 'Binance' ? formData.binanceId :
          `${formData.bankName} - ${formData.phoneNumber}`
        ),
        isVerified: true,
        data: {
          email: type === 'Zelle' ? formData.email : undefined,
          binanceId: type === 'Binance' ? formData.binanceId : undefined,
          accountHolder: formData.accountHolder,
          bankName: type === 'PagoMovil' ? formData.bankName : undefined,
          idNumber: type === 'PagoMovil' ? formData.idNumber : undefined,
          phoneNumber: type === 'PagoMovil' ? formData.phoneNumber : undefined,
        }
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

                  {type === 'PagoMovil' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Banco</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full rounded-2xl border border-gray-200 bg-white p-4 pr-10 text-sm text-brand-navy focus:border-brand-500 focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="">Selecciona tu banco...</option>
                            <option value="Banesco">Banesco</option>
                            <option value="Banco de Venezuela">Banco de Venezuela</option>
                            <option value="Mercantil">Mercantil</option>
                            <option value="Provincial">Provincial</option>
                            <option value="BNC">BNC (Banco Nacional de Crédito)</option>
                            <option value="Bancamiga">Bancamiga</option>
                            <option value="Bancaribe">Bancaribe</option>
                            <option value="Otros Bancos">Otros Bancos</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                            <Landmark className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Cédula de Identidad</label>
                          <input
                            required
                            value={formData.idNumber}
                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                            placeholder="V-12345678"
                            className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-brand-navy focus:border-brand-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Teléfono Pago Móvil</label>
                          <input
                            required
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="0414-1234567"
                            className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-brand-navy focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
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
