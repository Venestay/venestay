import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Check, ChevronDown, Globe, Sparkles, Smartphone, Landmark, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentMethodType, PaymentMethod } from '@/types';
import { useListingForm } from '../ListingFormContext';

const PAYMENT_OPTIONS = [
  { type: 'Zelle', label: 'ZELLE', icon: Globe, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { type: 'Binance', label: 'BINANCE PAY', icon: Sparkles, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { type: 'PagoMovil', label: 'PAGO MÓVIL', icon: Smartphone, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  { type: 'Transferencia', label: 'TRANSFERENCIA', icon: Landmark, color: 'text-brand-500', bgColor: 'bg-brand-50' },
  { type: 'Otro', label: 'OTRO', icon: PlusCircle, color: 'text-gray-500', bgColor: 'bg-gray-100' },
] as const;

const StepPayments: React.FC = () => {
  const { editingListing, setEditingListing, validation } = useListingForm();
  const { errors } = validation;
  const [activePaymentType, setActivePaymentType] = useState<PaymentMethodType | null>(null);
  const [tempPaymentData, setTempPaymentData] = useState<Record<string, string>>({});
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepContainerRef.current?.focus();
  }, []);

  const handlePaymentTypeSelect = (type: PaymentMethodType) => {
    if (activePaymentType === type) {
      setActivePaymentType(null);
      setTempPaymentData({});
      return;
    }

    const existingMethod = editingListing.paymentMethods?.find(m => m.type === type);
    if (existingMethod) {
      setTempPaymentData({ ...existingMethod.data });
    } else {
      setTempPaymentData({});
    }
    setActivePaymentType(type);
  };

  const validatePaymentInput = (): string | null => {
    if (activePaymentType === 'Otro') {
      if (!tempPaymentData.otherName || tempPaymentData.otherName.trim().length < 2) return "Debe ingresar el nombre del método de pago";
      if (!tempPaymentData.email && !tempPaymentData.otherDetails) return "Debe proveer un correo o detalles de la cuenta";
    }

    if (activePaymentType === 'Zelle') {
      if (!tempPaymentData.accountHolder || tempPaymentData.accountHolder.trim().length < 3) return "Debe ingresar el nombre del titular para Zelle";
      if (!tempPaymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempPaymentData.email)) return "El correo de Zelle no es válido";
    }

    if (activePaymentType === 'Binance') {
      if (!tempPaymentData.binanceId || tempPaymentData.binanceId.trim().length < 6) return "El Binance Pay ID debe tener al menos 6 dígitos";
      if (!tempPaymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempPaymentData.email)) return "Debe ingresar el correo asociado a Binance";
      if (!tempPaymentData.accountHolder || tempPaymentData.accountHolder.trim().length < 3) return "Debe ingresar el nombre del titular para Binance Pay";
    }

    if (activePaymentType === 'Transferencia' || activePaymentType === 'PagoMovil') {
      if (!tempPaymentData.bankName || tempPaymentData.bankName.trim() === '') return "Debe especificar el banco";
      if (!tempPaymentData.accountHolder || tempPaymentData.accountHolder.trim() === '') return "Debe ingresar el nombre del titular";

      if (!tempPaymentData.idNumber || !/^[VJEG]-?\d{7,10}$/i.test(tempPaymentData.idNumber.trim())) {
        return "Cédula/RIF inválido. Use formato V-12345678, J-123456789";
      }

      if (activePaymentType === 'PagoMovil') {
        if (!tempPaymentData.phoneNumber || !/^(0414|0424|0412|0416|0426)-?\d{7}$/.test(tempPaymentData.phoneNumber.trim())) {
          return "Teléfono inválido. Formato esperado: 04141234567";
        }
      }

      if (activePaymentType === 'Transferencia') {
        const acc = (tempPaymentData.accountNumber || '').replace(/\s/g, '');
        if (acc.length !== 20 || !/^\d{20}$/.test(acc)) return "La cuenta bancaria debe tener exactamente 20 dígitos numéricos";
        if (!tempPaymentData.accountType || tempPaymentData.accountType === '') return "Debe seleccionar el tipo de cuenta";
      }
    }
    return null;
  };

  const confirmPaymentMethod = () => {
    const error = validatePaymentInput();
    if (error) {
      toast.error(error);
      return;
    }

    const newMethod: PaymentMethod = {
      id: Math.random().toString(36).substr(2, 9),
      type: activePaymentType!,
      label: PAYMENT_OPTIONS.find(o => o.type === activePaymentType)?.label || activePaymentType!,
      isVerified: true,
      data: { ...tempPaymentData } as Record<string, string>
    };

    const currentMethods = editingListing.paymentMethods || [];
    const filtered = currentMethods.filter(m => m.type !== activePaymentType);

    setEditingListing(prev => prev ? { ...prev, paymentMethods: [...filtered, newMethod] } : null);
    setActivePaymentType(null);
    setTempPaymentData({});
  };

  return (
    <motion.div 
      key="step4" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="space-y-6"
      ref={stepContainerRef}
      tabIndex={-1}
      aria-label="Paso 4: Métodos de cobro"
    >
      <div className="text-center">
        <h4 className="text-brand-navy text-lg font-black tracking-tight">Métodos de Cobro</h4>
        <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Validación bancaria activa</p>
      </div>

      {errors.paymentMethods && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-500 border border-red-100" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-widest">{errors.paymentMethods}</p>
        </div>
      )}

      <div className="border-brand-navy/10 rounded-[40px] border bg-gray-50/50 p-8 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6" role="group" aria-label="Opciones de pago">
          {PAYMENT_OPTIONS.map((opt) => {
            const isActive = activePaymentType === opt.type;
            const isSaved = editingListing.paymentMethods?.some(m => m.type === opt.type);
            return (
              <button 
                key={opt.type} 
                type="button" 
                aria-pressed={isActive}
                onClick={() => handlePaymentTypeSelect(opt.type as PaymentMethodType)} 
                className={`group relative flex flex-col items-center gap-3 rounded-[2rem] border-2 p-5 transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500 ${isActive ? 'bg-brand-navy border-brand-navy text-white shadow-xl -translate-y-1 motion-reduce:transform-none' : 'bg-white border-transparent text-brand-navy hover:border-brand-500/20 shadow-sm'}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? 'bg-white/10' : opt.bgColor}`} aria-hidden="true">
                  <opt.icon className={`h-6 w-6 ${isActive ? 'text-brand-500' : opt.color}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">{opt.label}</span>
                {isSaved && <div className="bg-brand-500 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full shadow-lg" aria-label="Configurado"><Check className="text-brand-navy h-3 w-3" /></div>}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activePaymentType && (
            <motion.div key={activePaymentType} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6 rounded-[35px] border border-gray-100 bg-white p-8 shadow-xl">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {activePaymentType === 'Transferencia' || activePaymentType === 'PagoMovil' ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="payment-bank" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Banco</label>
                      <input id="payment-bank" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100 min-h-[44px]" placeholder="Ej: Banesco, Mercantil" value={tempPaymentData.bankName || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, bankName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="payment-holder" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular</label>
                      <input id="payment-holder" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100 min-h-[44px]" placeholder="Nombre del propietario" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountHolder: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="payment-id" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Cédula / RIF</label>
                      <input id="payment-id" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100 min-h-[44px]" placeholder="V-12345678" value={tempPaymentData.idNumber || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, idNumber: e.target.value.toUpperCase() })} />
                    </div>

                    {activePaymentType === 'PagoMovil' && (
                      <div className="space-y-2">
                        <label htmlFor="payment-phone" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Teléfono Celular</label>
                        <input id="payment-phone" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100 min-h-[44px]" placeholder="04141234567" value={tempPaymentData.phoneNumber || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, phoneNumber: e.target.value })} />
                      </div>
                    )}

                    {activePaymentType === 'Transferencia' && (
                      <>
                        <div className="space-y-2">
                          <label htmlFor="payment-account-type" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Tipo de Cuenta</label>
                          <select id="payment-account-type" className="w-full appearance-none rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100 min-h-[44px]" value={tempPaymentData.accountType || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountType: e.target.value })}>
                            <option value="">Selecciona tipo</option>
                            <option value="Corriente">Corriente</option>
                            <option value="Ahorros">Ahorros</option>
                            <option value="Custodia">Custodia / USD</option>
                          </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label htmlFor="payment-account-number" className={`text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase ${tempPaymentData.accountNumber && tempPaymentData.accountNumber.length !== 20 ? 'text-red-500' : ''}`}>Número de Cuenta (20 dígitos)</label>
                          <input id="payment-account-number" type="text" maxLength={20} className={`w-full rounded-2xl px-6 py-4 text-xs font-bold outline-none min-h-[44px] ${tempPaymentData.accountNumber && tempPaymentData.accountNumber.length !== 20 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 focus:bg-gray-100'}`} placeholder="01020000000000000000" value={tempPaymentData.accountNumber || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountNumber: e.target.value.replace(/\D/g, '') })} />
                        </div>
                      </>
                    )}
                  </>
                ) : activePaymentType === 'Zelle' ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="payment-zelle-holder" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular de la Cuenta</label>
                      <input id="payment-zelle-holder" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="Nombre completo" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountHolder: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="payment-zelle-email" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo Zelle</label>
                      <input id="payment-zelle-email" type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, email: e.target.value })} />
                    </div>
                  </>
                ) : activePaymentType === 'Otro' ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="payment-other-name" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Nombre del Método (Ej: PayPal)</label>
                      <input id="payment-other-name" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="Nombre de la billetera o banco" value={tempPaymentData.otherName || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, otherName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="payment-other-email" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo asociado</label>
                      <input id="payment-other-email" type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="Opcional" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="payment-other-details" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Detalles / Cuenta</label>
                      <input id="payment-other-details" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="Número de cuenta o detalles adicionales" value={tempPaymentData.otherDetails || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, otherDetails: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="payment-binance-id" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Binance Pay ID</label>
                      <input id="payment-binance-id" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="ID de 9 dígitos" value={tempPaymentData.binanceId || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, binanceId: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="payment-binance-email" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo asociado</label>
                      <input id="payment-binance-email" type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, email: e.target.value })} />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label htmlFor="payment-binance-holder" className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular de la Cuenta (Nombre Completo)</label>
                      <input id="payment-binance-holder" type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none min-h-[44px]" placeholder="Nombre y Apellido" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountHolder: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <button type="button" onClick={confirmPaymentMethod} className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all min-h-[44px]">
                {editingListing.paymentMethods?.some(m => m.type === activePaymentType) ? 'Actualizar' : 'Confirmar'} {activePaymentType} <ChevronDown className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StepPayments;
