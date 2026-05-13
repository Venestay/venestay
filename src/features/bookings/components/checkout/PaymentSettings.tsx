import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Smartphone,
  Landmark,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { PaymentMethod, PaymentMethodType, Listing } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentSettingsProps {
  listing: Listing;
  onChange?: (updatedMethods: PaymentMethod[]) => void;
}

const PAYMENT_OPTIONS: {
  type: PaymentMethodType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    type: 'Zelle',
    label: 'Zelle',
    icon: Globe,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    type: 'Binance',
    label: 'Binance Pay',
    icon: Sparkles,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    type: 'PagoMovil',
    label: 'Pago Móvil',
    icon: Smartphone,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
  },
  {
    type: 'Transferencia',
    label: 'Transferencia',
    icon: Landmark,
    color: 'text-brand-500',
    bgColor: 'bg-brand-50',
  },
];

const PaymentSettings: React.FC<PaymentSettingsProps> = ({
  listing,
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentMethodType | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    accountType: '', // Added for Transferencia
    idNumber: '',
    phoneNumber: '',
    binanceId: '',
  });

  const handleSelectType = (e: React.MouseEvent, type: PaymentMethodType) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedType(type === selectedType ? null : type);
  };

  const handleAddField = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedType) return;

    const newMethod: PaymentMethod = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      label:
        PAYMENT_OPTIONS.find((o) => o.type === selectedType)?.label ||
        selectedType,
      isVerified: true,
      data: { ...formData },
    };

    const updatedMethods = [...(listing.paymentMethods || []), newMethod];

    if (onChange) {
      onChange(updatedMethods);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsAdding(false);
        setSelectedType(null);
        setFormData({
          email: '',
          accountHolder: '',
          bankName: '',
          accountNumber: '',
          accountType: '',
          idNumber: '',
          phoneNumber: '',
          binanceId: '',
        });
      }, 800);
    }
  };

  const handleRemoveField = (e: React.MouseEvent, methodId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedMethods = (listing.paymentMethods || []).filter(
      (m) => m.id !== methodId
    );
    if (onChange) onChange(updatedMethods);
  };

  return (
    <div className="space-y-8">
      <div className="bg-brand-navy/5 border-brand-navy/10 rounded-[2.5rem] border p-6">
        <div className="flex gap-4">
          <div className="bg-brand-navy/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
            <ShieldCheck className="text-brand-navy h-5 w-5" />
          </div>
          <div>
            <h3 className="text-brand-navy mb-1 text-sm font-black tracking-widest uppercase">
              Privacidad y Seguridad
            </h3>
            <p className="text-brand-navy/70 text-[11px] leading-relaxed font-bold">
              Estos datos serán visibles{' '}
              <span className="text-brand-navy decoration-brand-500/30 font-black underline">
                solo para huéspedes con una reserva activa
              </span>
              . VeneStay garantiza que tu información bancaria sea compartida
              únicamente cuando hay un compromiso real de estadía.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
            Métodos de cobro activos
          </h4>
          {!isAdding && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsAdding(true);
              }}
              className="text-brand-navy hover:bg-brand-navy border-brand-navy/10 flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all hover:text-white"
            >
              <Plus className="h-3 w-3" />
              Añadir Método
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(!listing.paymentMethods || listing.paymentMethods.length === 0) &&
            !isAdding && (
              <div className="flex flex-col items-center justify-center rounded-[35px] border border-dashed border-gray-200 bg-white p-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                  <AlertCircle className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  No hay métodos registrados
                </p>
              </div>
            )}

          {listing.paymentMethods?.map((method) => {
            const config = PAYMENT_OPTIONS.find((o) => o.type === method.type);
            const Icon = config?.icon || Landmark;
            return (
              <motion.div
                layout
                key={method.id}
                className="group hover:border-brand-500/30 flex items-center justify-between rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      config?.bgColor,
                      config?.color
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-brand-navy text-[11px] font-black tracking-widest uppercase">
                        {method.label}
                      </h5>
                      <div className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5">
                        <ShieldCheck className="h-2 w-2 text-emerald-500" />
                        <span className="text-[7px] font-black tracking-widest text-emerald-500 uppercase">
                          Activo
                        </span>
                      </div>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] font-bold tracking-tight text-gray-400">
                      {method.type === 'Zelle'
                        ? method.data.email
                        : method.type === 'Binance'
                          ? method.data.binanceId
                          : method.data.accountNumber ||
                            method.data.phoneNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemoveField(e, method.id)}
                  className="rounded-xl p-2.5 text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border-brand-500/10 relative space-y-8 overflow-hidden rounded-[40px] border-2 bg-gray-50 p-8"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="text-brand-500 h-32 w-32" />
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                setIsAdding(false);
                setSelectedType(null);
              }}
              className="absolute top-6 right-6 z-10 rounded-full p-2 text-gray-400 transition-all hover:bg-white hover:text-red-500"
            >
              <Plus className="h-5 w-5 rotate-45" />
            </button>

            <div className="relative z-10 space-y-6">
              <div className="text-center">
                <h4 className="text-brand-navy text-[11px] font-black tracking-widest uppercase">
                  Configurar Cobro
                </h4>
                <p className="mt-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                  Selecciona la plataforma de tu preferencia
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {PAYMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon as React.ElementType;
                  return (
                  <button
                    key={opt.type}
                    onClick={(e) => handleSelectType(e, opt.type)}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 rounded-[2rem] border-2 p-5 transition-all',
                      selectedType === opt.type
                        ? 'bg-brand-navy border-brand-navy translate-y-[-4px] text-white shadow-xl'
                        : 'text-brand-navy hover:border-brand-500/20 border-transparent bg-white hover:translate-y-[-2px]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                        selectedType === opt.type ? 'bg-white/10' : opt.bgColor
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          selectedType === opt.type
                            ? 'text-brand-500'
                            : opt.color
                        )}
                      />
                    </div>
                    <span className="text-[10px] leading-none font-black tracking-widest uppercase">
                      {opt.label}
                    </span>
                    {selectedType === opt.type && (
                      <div className="bg-brand-500 absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-lg">
                        <Check className="text-brand-navy h-3 w-3" />
                      </div>
                    )}
                  </button>
                )})}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedType && (
                <motion.div
                  key={selectedType}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl"
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {selectedType === 'Zelle' && (
                      <>
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                            Correo Zelle
                          </label>
                          <input
                            type="email"
                            autoFocus
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            placeholder="nombre@ejemplo.com"
                            className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                            Nombre del Titular
                          </label>
                          <input
                            type="text"
                            value={formData.accountHolder}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountHolder: e.target.value,
                              })
                            }
                            placeholder="Nombre y Apellido"
                            className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                          />
                        </div>
                      </>
                    )}

                    {selectedType === 'Binance' && (
                      <div className="col-span-2">
                        <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                          Binance Pay ID o Email
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={formData.binanceId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              binanceId: e.target.value,
                            })
                          }
                          placeholder="ID de 9 dígitos o correo registrado"
                          className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                        />
                      </div>
                    )}

                    {(selectedType === 'PagoMovil' ||
                      selectedType === 'Transferencia') && (
                      <>
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                            Banco
                          </label>
                          <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankName: e.target.value,
                              })
                            }
                            placeholder="Ej: Banesco, Mercantil"
                            className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                          />
                        </div>

                        {selectedType === 'PagoMovil' ? (
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              value={formData.phoneNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phoneNumber: e.target.value,
                                })
                              }
                              placeholder="0412-1234567"
                              className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                                Tipo de Cuenta
                              </label>
                              <select
                                value={formData.accountType}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    accountType: e.target.value,
                                  })
                                }
                                className="focus:border-brand-500 w-full appearance-none rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                              >
                                <option value="">Selecciona tipo</option>
                                <option value="Corriente">Corriente</option>
                                <option value="Ahorros">Ahorros</option>
                                <option value="Custodia">Custodia / USD</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                                Número de Cuenta
                              </label>
                              <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    accountNumber: e.target.value,
                                  })
                                }
                                placeholder="0102 0000 00 0000000000"
                                className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                              />
                            </div>
                          </>
                        )}

                        <div className="col-span-2 md:col-span-1">
                          <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                            Titular
                          </label>
                          <input
                            type="text"
                            value={formData.accountHolder}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountHolder: e.target.value,
                              })
                            }
                            placeholder="Nombre del propietario"
                            className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                          />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                          <label className="text-brand-navy mb-2 ml-2 block text-[9px] font-black tracking-widest uppercase">
                            Cédula / RIF
                          </label>
                          <input
                            type="text"
                            value={formData.idNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                idNumber: e.target.value,
                              })
                            }
                            placeholder="V-12345678"
                            className="focus:border-brand-500 w-full rounded-[1.2rem] border border-transparent bg-gray-50 px-5 py-4 text-sm font-black transition-all outline-none focus:bg-white"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      disabled={loading}
                      onClick={handleAddField}
                      className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy group flex w-full items-center justify-center gap-3 rounded-[1.5rem] py-5 text-xs font-black tracking-widest text-white uppercase transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : success ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <>
                          Confirmar{' '}
                          {
                            PAYMENT_OPTIONS.find((o) => o.type === selectedType)
                              ?.label
                          }
                          <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentSettings;






