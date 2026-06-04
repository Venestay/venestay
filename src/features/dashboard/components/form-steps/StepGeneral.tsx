import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Check, Minus, Plus, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { City } from '@/types';
import { useListingForm } from '../ListingFormContext';
import { getAmenityIcon } from '@/features/listings/utils/amenities-icons';

interface NumberStepperProps {
  id: string;
  value: number;
  onChange: (val: number) => void;
  onBlur: () => void;
  min?: number;
  max?: number;
  hasError?: boolean;
}

const NumberStepper: React.FC<NumberStepperProps> = ({ id, value, onChange, onBlur, min = 0, max = 99, hasError }) => {
  return (
    <div className={cn(
      "flex items-center justify-between w-full rounded-2xl border p-2 shadow-sm transition-all bg-white min-h-[44px]",
      hasError ? "border-red-200 bg-red-50" : "border-gray-100 hover:border-brand-500/50"
    )}>
      <button 
        type="button" 
        onClick={() => {
          if (value > min) {
            onChange(value - 1);
            onBlur();
          }
        }}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-brand-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-95 transition-all"
        aria-label="Disminuir"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="number"
        className="w-12 text-center text-sm font-black text-brand-navy outline-none bg-transparent"
        value={value}
        onChange={(e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val)) val = min;
          if (val > max) val = max;
          if (val < min) val = min;
          onChange(val);
        }}
        onBlur={onBlur}
        min={min}
        max={max}
      />
      <button 
        type="button" 
        onClick={() => {
          if (value < max) {
            onChange(value + 1);
            onBlur();
          }
        }}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-brand-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-95 transition-all"
        aria-label="Aumentar"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

const StepGeneral: React.FC = () => {
  const { editingListing, setEditingListing, validation } = useListingForm();
  const { errors, touched, validateField, setFieldTouched } = validation;
  const firstInputRef = useRef<HTMLInputElement>(null);
  const SHOW_CANCELLATION_POLICY_FORM = true;

  // Focus management: move focus to first input when step mounts
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Forzar política única no reembolsable y reprogramable
  useEffect(() => {
    if (editingListing && editingListing.cancellationPolicy !== 'non_refundable_reschedulable') {
      setEditingListing(prev => prev ? { ...prev, cancellationPolicy: 'non_refundable_reschedulable' } : null);
    }
  }, [editingListing, setEditingListing]);

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      {/* Información General */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="col-span-2 space-y-2">
          <label htmlFor="listing-title" className={cn(
            "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
            touched.title && errors.title ? "text-red-500" : "text-brand-navy/40"
          )}>
            Título del Alojamiento
          </label>
          <div className="relative">
            <input
              id="listing-title"
              ref={firstInputRef}
              type="text"
              aria-invalid={!!(touched.title && errors.title)}
              aria-describedby={touched.title && errors.title ? "listing-title-error" : undefined}
              className={cn(
                "text-brand-navy w-full rounded-2xl border bg-gray-50 px-6 py-4 font-bold outline-none transition-all",
                touched.title && errors.title ? "border-red-200 bg-red-50 focus:border-red-500" :
                  touched.title && !errors.title && editingListing.title ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                    "border-gray-100 focus:border-brand-500"
              )}
              value={editingListing.title}
              onChange={(e) => {
                const val = e.target.value;
                setEditingListing(prev => prev ? { ...prev, title: val } : null);
                if (touched.title) validateField('title', val);
              }}
              onBlur={() => {
                setFieldTouched('title');
                validateField('title', editingListing.title);
              }}
              placeholder="Ej: Penthouse de Lujo en Lechería"
            />
            {touched.title && errors.title && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>
            )}
            {touched.title && !errors.title && editingListing.title && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <Check className="h-5 w-5" />
              </div>
            )}
          </div>
          <AnimatePresence>
            {touched.title && errors.title && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} id="listing-title-error" role="alert" className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.title}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="col-span-2 space-y-2">
          <label htmlFor="listing-description" className={cn(
            "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
            touched.description && errors.description ? "text-red-500" : "text-brand-navy/40"
          )}>
            Descripción del Alojamiento
          </label>
          <textarea
            id="listing-description"
            aria-invalid={!!(touched.description && errors.description)}
            aria-describedby={touched.description && errors.description ? "listing-description-error" : undefined}
            className={cn(
              "text-brand-navy h-32 w-full resize-none rounded-2xl border bg-gray-50 px-6 py-4 text-xs font-bold outline-none transition-all",
              touched.description && errors.description ? "border-red-200 bg-red-50 focus:border-red-500" :
                touched.description && !errors.description && editingListing.description ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                  "border-gray-100 focus:border-brand-500"
            )}
            value={editingListing.description || ''}
            onChange={(e) => {
              const val = e.target.value;
              setEditingListing(prev => prev ? { ...prev, description: val } : null);
              if (touched.description) validateField('description', val);
            }}
            onBlur={() => {
              setFieldTouched('description');
              validateField('description', editingListing.description);
            }}
            placeholder="Describe los lujos, la zona y por qué es la mejor opción..."
          />
          <AnimatePresence>
            {touched.description && errors.description && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} id="listing-description-error" role="alert" className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.description}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <label htmlFor="listing-price" className={cn(
            "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
            touched.pricePerNight && errors.pricePerNight ? "text-red-500" : "text-brand-navy/40"
          )}>
            Precio por Noche ($)
          </label>
          <input
            id="listing-price"
            type="number"
            aria-invalid={!!(touched.pricePerNight && errors.pricePerNight)}
            aria-describedby={touched.pricePerNight && errors.pricePerNight ? "listing-price-error" : undefined}
            className={cn(
              "text-brand-navy w-full rounded-2xl border bg-gray-50 px-6 py-4 font-bold outline-none transition-all",
              touched.pricePerNight && errors.pricePerNight ? "border-red-200 bg-red-50 focus:border-red-500" :
                touched.pricePerNight && !errors.pricePerNight && editingListing.pricePerNight ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                  "border-gray-100 focus:border-brand-500"
            )}
            value={editingListing.pricePerNight || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setEditingListing(prev => prev ? { ...prev, pricePerNight: val } : null);
              if (touched.pricePerNight) validateField('pricePerNight', val);
            }}
            onBlur={() => {
              setFieldTouched('pricePerNight');
              validateField('pricePerNight', editingListing.pricePerNight);
            }}
          />
          <AnimatePresence>
            {touched.pricePerNight && errors.pricePerNight && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} id="listing-price-error" role="alert" className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.pricePerNight}</motion.p>
            )}
          </AnimatePresence>
        </div>
        
        {/* Gastos de Limpieza (Opcional) */}
        <div className="space-y-2">
          <label htmlFor="listing-cleaningFee" className={cn(
            "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
            touched.cleaningFee && errors.cleaningFee ? "text-red-500" : "text-brand-navy/40"
          )}>
            Gastos de Limpieza ($)
          </label>
          <input
            id="listing-cleaningFee"
            type="number"
            aria-invalid={!!(touched.cleaningFee && errors.cleaningFee)}
            aria-describedby={touched.cleaningFee && errors.cleaningFee ? "listing-cleaningFee-error" : "listing-cleaningFee-suggestion"}
            className={cn(
              "text-brand-navy w-full rounded-2xl border bg-gray-50 px-6 py-4 font-bold outline-none transition-all",
              touched.cleaningFee && errors.cleaningFee ? "border-red-200 bg-red-50 focus:border-red-500" :
                touched.cleaningFee && !errors.cleaningFee && editingListing.cleaningFee ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                  "border-gray-100 focus:border-brand-500"
            )}
            value={editingListing.cleaningFee ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              setEditingListing(prev => prev ? { ...prev, cleaningFee: val } : null);
              if (touched.cleaningFee) validateField('cleaningFee', val);
            }}
            onBlur={() => {
              setFieldTouched('cleaningFee');
              validateField('cleaningFee', editingListing.cleaningFee);
            }}
            placeholder="Ej: 25"
          />
          <AnimatePresence>
            {touched.cleaningFee && errors.cleaningFee ? (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} id="listing-cleaningFee-error" role="alert" className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.cleaningFee}</motion.p>
            ) : (
              <p id="listing-cleaningFee-suggestion" className="ml-1 text-[9px] font-semibold text-slate-400 tracking-wide">
                💡 Tarifa única por estancia. Sugerido para tu propiedad ({editingListing.bedrooms || 0} hab): {
                  (editingListing.bedrooms || 0) <= 1 ? 'entre $0 y $20 USD' :
                  (editingListing.bedrooms || 0) === 2 ? 'entre $15 y $40 USD' :
                  (editingListing.bedrooms || 0) === 3 ? 'entre $30 y $60 USD' :
                  'entre $50 y $100 USD'
                }.
              </p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <label htmlFor="listing-city" className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Ciudad</label>
          <select
            id="listing-city"
            className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none transition-all appearance-none"
            value={editingListing.city || 'Lechería'}
            onChange={(e) => {
              const val = e.target.value as City;
              setEditingListing(prev => prev ? { ...prev, city: val } : null);
              validateField('city', val);
            }}
          >
            {['Lechería', 'Caracas', 'Margarita', 'Falcon', 'Maracaibo', 'Puerto La Cruz'].map(c => (
              <option key={c} value={c} disabled={c !== 'Lechería'}>
                {c} {c !== 'Lechería' ? '(Próximamente)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Propiedad */}
        <div className="space-y-2">
          <label htmlFor="listing-propertyType" className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Tipo de Propiedad</label>
          <select
            id="listing-propertyType"
            className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none transition-all appearance-none"
            value={editingListing.propertyType || 'Apartamento'}
            onChange={(e) => {
              const val = e.target.value;
              setEditingListing(prev => prev ? { ...prev, propertyType: val } : null);
              validateField('propertyType', val);
            }}
          >
            {['Apartamento', 'Casa', 'Townhouse', 'Villa', 'Estudio', 'Habitación'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Tipo de Alojamiento */}
        <div className="space-y-2">
          <label htmlFor="listing-accommodationType" className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Tipo de Alojamiento</label>
          <select
            id="listing-accommodationType"
            className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none transition-all appearance-none"
            value={editingListing.accommodationType || 'Alojamiento entero'}
            onChange={(e) => {
              const val = e.target.value;
              setEditingListing(prev => prev ? { ...prev, accommodationType: val } : null);
              validateField('accommodationType', val);
            }}
          >
            {['Alojamiento entero', 'Habitación privada', 'Habitación compartida'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Detalles de Edificación */}
      <section className="bg-gray-50 space-y-6 rounded-[32px] p-6 border border-gray-100/50 shadow-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-6">
          {[
            { label: 'Huéspedes', key: 'maxGuests' as const, min: 1 },
            { label: 'Dormitorios', key: 'bedrooms' as const, min: 0 },
            { label: 'Camas', key: 'beds' as const, min: 1 },
            { label: 'Baños', key: 'baths' as const, min: 1 },
            { label: 'Noches Mín.', key: 'minNights' as const, min: 2 },
            { label: 'Noches Máx.', key: 'maxNights' as const, min: 1 },
          ].map(item => (
            <div key={item.key} className="space-y-3">
              <label htmlFor={`listing-${item.key}`} className={cn(
                "text-[10px] font-black tracking-widest uppercase transition-colors ml-1",
                touched[item.key] && errors[item.key] ? "text-red-500" : "text-brand-navy/40"
              )}>{item.label}</label>
              <NumberStepper
                id={`listing-${item.key}`}
                value={Number(editingListing[item.key]) || 0}
                min={item.min}
                hasError={!!(touched[item.key] && errors[item.key])}
                onChange={(val) => {
                  setEditingListing(prev => prev ? { ...prev, [item.key]: val } : null);
                  validateField(item.key, val);
                }}
                onBlur={() => setFieldTouched(item.key)}
              />
              <AnimatePresence>
                {touched[item.key] && errors[item.key] && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} id={`listing-${item.key}-error`} role="alert" className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors[item.key]}</motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="space-y-4 border-t border-gray-200/60 pt-6 mt-2">
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Pisos Edificio', key: 'buildingFloors' as const, min: 1, max: 200 },
              { label: 'Piso Propiedad', key: 'propertyFloor' as const, min: 0, max: 200 },
              { label: 'Año Const.', key: 'constructionYear' as const, min: 1900, max: new Date().getFullYear() },
            ].map(item => (
              <div key={item.key} className="space-y-3">
                <label htmlFor={`listing-${item.key}`} className={cn(
                  "text-[9px] md:text-[10px] font-black tracking-widest uppercase transition-colors ml-1",
                  (touched[item.key] && errors[item.key]) || (item.key === 'propertyFloor' && Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors)) ? "text-red-500" : "text-brand-navy/40"
                )}>
                  {item.label}
                </label>
                <NumberStepper
                  id={`listing-${item.key}`}
                  value={Number(editingListing[item.key]) || 0}
                  min={item.min}
                  max={item.max}
                  hasError={!!((touched[item.key] && errors[item.key]) || (item.key === 'propertyFloor' && Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors)))}
                  onChange={(val) => {
                    setEditingListing(prev => prev ? { ...prev, [item.key]: val } : null);
                    validateField(item.key, val);
                  }}
                  onBlur={() => setFieldTouched(item.key)}
                />
              </div>
            ))}
          </div>
          
          {/* Pet Friendly Toggle Option */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-[10px] font-black tracking-widest uppercase text-brand-navy/40 ml-1">
              ¿Acepta Mascotas? (Pet Friendly)
            </span>
            <button
              type="button"
              onClick={() => {
                const newVal = !editingListing.isPetFriendly;
                setEditingListing(prev => prev ? { ...prev, isPetFriendly: newVal } : null);
                validateField('isPetFriendly', newVal);
              }}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border min-h-[44px]",
                editingListing.isPetFriendly
                  ? "bg-brand-navy border-brand-navy text-white shadow-md"
                  : "bg-gray-100 border-gray-200 text-brand-navy/60 hover:bg-gray-200"
              )}
            >
              {editingListing.isPetFriendly ? 'Sí (Apto)' : 'No'}
            </button>
          </div>
          <AnimatePresence>
            {(errors.propertyFloor || Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors)) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} id="propertyFloor-error" role="alert" className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase pt-2 ml-1">
                <AlertCircle className="h-4 w-4" /> {errors.propertyFloor || "El piso de la propiedad no puede ser mayor a los pisos del edificio"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Comodidades y Servicios */}
      <section className="space-y-4">
        <h3 className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase" id="amenities-label">Comodidades y Servicios Adicionales</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="amenities-label">
          {['WiFi', 'A/A', 'TV', 'Smart TV', 'Cocina equipada', 'Electrodomésticos', 'Calentador de agua', 'Purificador de Agua', 'Lavadora', 'Secadora', 'Piscina', 'Planta Eléctrica', 'Tanque de Agua', 'Vista al Mar', 'Muelle Privado / Acceso al Canal', 'Parrillera / BBQ (a Gas o Carbón)', 'Kayak / Paddle Board incluido', 'Gimnasio', 'Estacionamiento', 'Cerradura Inteligente', 'Elementos de seguridad', 'Extintor de incendios', 'Botiquín de primeros auxilios'].map(amenity => {
            const isActive = editingListing.amenities?.includes(amenity);
            const Icon = getAmenityIcon(amenity);
            return (
              <button key={amenity} type="button" aria-pressed={isActive} onClick={() => {
                const current = editingListing.amenities || [];
                const next = isActive ? current.filter(a => a !== amenity) : [...current, amenity];
                setEditingListing(prev => prev ? { ...prev, amenities: next } : null);
              }} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[10px] font-bold transition-all min-h-[44px] ${isActive ? 'bg-brand-navy text-white shadow-md' : 'bg-gray-100 text-brand-navy/60 hover:bg-gray-200'}`}>
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-brand-navy/60")} />
                {amenity}
              </button>
            );
          })}
        </div>
      </section>

      {/* Normas de la Casa */}
      <section className="space-y-4 border-t border-gray-200/60 pt-6">
        <h3 className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Normas de la Casa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between min-h-[44px]">
              <span className="text-[10px] font-black tracking-widest uppercase text-brand-navy/60 ml-1">
                ¿Se permite fumar?
              </span>
              <button
                type="button"
                aria-label="Permitir fumar"
                onClick={() => {
                  const newVal = !editingListing.allowSmoking;
                  setEditingListing(prev => prev ? { ...prev, allowSmoking: newVal } : null);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border min-h-[44px]",
                  editingListing.allowSmoking
                    ? "bg-brand-navy border-brand-navy text-white shadow-md"
                    : "bg-gray-100 border-gray-200 text-brand-navy/60 hover:bg-gray-200"
                )}
              >
                {editingListing.allowSmoking ? 'Sí' : 'No'}
              </button>
            </div>
            
            <div className="flex items-center justify-between min-h-[44px]">
              <span className="text-[10px] font-black tracking-widest uppercase text-brand-navy/60 ml-1">
                ¿Se permiten fiestas o eventos?
              </span>
              <button
                type="button"
                aria-label="Permitir fiestas o eventos"
                onClick={() => {
                  const newVal = !editingListing.allowEvents;
                  setEditingListing(prev => prev ? { ...prev, allowEvents: newVal } : null);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border min-h-[44px]",
                  editingListing.allowEvents
                    ? "bg-brand-navy border-brand-navy text-white shadow-md"
                    : "bg-gray-100 border-gray-200 text-brand-navy/60 hover:bg-gray-200"
                )}
              >
                {editingListing.allowEvents ? 'Sí' : 'No'}
              </button>
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="check-in-time" className="text-[10px] font-black tracking-widest uppercase text-brand-navy/60 ml-1">
                Horario de Check-in (Entrada)
              </label>
              <select
                id="check-in-time"
                value={editingListing.checkInTime || '14:00'}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingListing(prev => prev ? { ...prev, checkInTime: val } : null);
                }}
                className="w-full text-brand-navy rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-500 min-h-[44px]"
              >
                {Array.from({ length: 16 }, (_, i) => {
                  const hour = i + 8;
                  const formatted = `${hour < 10 ? '0' : ''}${hour}:00`;
                  return <option key={formatted} value={formatted}>{formatted}</option>;
                })}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="check-out-time" className="text-[10px] font-black tracking-widest uppercase text-brand-navy/60 ml-1">
                Horario de Check-out (Salida)
              </label>
              <select
                id="check-out-time"
                value={editingListing.checkOutTime || '11:00'}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingListing(prev => prev ? { ...prev, checkOutTime: val } : null);
                }}
                className="w-full text-brand-navy rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-500 min-h-[44px]"
              >
                {Array.from({ length: 16 }, (_, i) => {
                  const hour = i + 8;
                  const formatted = `${hour < 10 ? '0' : ''}${hour}:00`;
                  return <option key={formatted} value={formatted}>{formatted}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Reglas adicionales list builder */}
        <div className="space-y-3">
          <label htmlFor="additional-rule-input" className="text-[10px] font-black tracking-widest uppercase text-brand-navy/60 ml-1">
            Normas Adicionales del Anfitrión
          </label>
          <div className="flex gap-2">
            <input
              id="additional-rule-input"
              type="text"
              placeholder="Ej: Apagar los aires acondicionados al salir"
              className="text-brand-navy flex-1 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs font-bold outline-none focus:border-brand-500 min-h-[44px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const val = target.value.trim();
                  if (val) {
                    const rules = editingListing.additionalRules || [];
                    if (!rules.includes(val)) {
                      setEditingListing(prev => prev ? { ...prev, additionalRules: [...rules, val] } : null);
                    }
                    target.value = '';
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = document.getElementById('additional-rule-input') as HTMLInputElement | null;
                const val = input?.value.trim();
                if (val) {
                  const rules = editingListing.additionalRules || [];
                  if (!rules.includes(val)) {
                    setEditingListing(prev => prev ? { ...prev, additionalRules: [...rules, val] } : null);
                  }
                  if (input) input.value = '';
                }
              }}
              className="px-6 rounded-xl bg-brand-navy text-white text-[10px] font-black uppercase tracking-widest min-h-[44px] hover:bg-brand-navy/90 active:scale-95 transition-all"
            >
              + Agregar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {(editingListing.additionalRules || []).map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl pl-4 pr-2 py-2 text-xs font-bold text-brand-navy"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  aria-label={`Eliminar norma: ${rule}`}
                  onClick={() => {
                    const next = (editingListing.additionalRules || []).filter((_, i) => i !== idx);
                    setEditingListing(prev => prev ? { ...prev, additionalRules: next } : null);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-red-100 hover:text-red-500 text-brand-navy/60 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
            {(editingListing.additionalRules || []).length === 0 && (
              <p className="text-[10px] font-bold text-brand-navy/30 ml-1">No hay normas adicionales configuradas.</p>
            )}
          </div>
        </div>
      </section>

      {/* Entorno / Actividades */}
      <section className="space-y-2">
        <label htmlFor="listing-nearby" className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Entorno (Actividades o lugares de interés cercanos)</label>
        <textarea
          id="listing-nearby"
          className="text-brand-navy focus:border-brand-500 h-24 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 text-xs font-bold outline-none"
          value={editingListing.nearbyActivities || ''}
          onChange={(e) => setEditingListing(prev => prev ? { ...prev, nearbyActivities: e.target.value } : null)}
          placeholder="Menciona centros comerciales, playas, restaurantes u otros sitios de interés cerca..."
        />
      </section>

      {/* Política de Cancelación - Ocultada por requerimiento de diseño */}
      {SHOW_CANCELLATION_POLICY_FORM && (
        <section className="space-y-3" aria-labelledby="cancellation-policy-label">
          <div className="ml-1 flex items-center gap-2">
            <label id="cancellation-policy-label" className="text-brand-navy/40 text-[10px] font-black tracking-widest uppercase">
              Política de Cancelación Aplicable
            </label>
          </div>
          <div className="rounded-3xl border border-brand-gold/20 bg-brand-gold/[0.03] p-6 space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C5A059] animate-pulse" />
              <h4 className="text-xs font-black tracking-wide text-brand-navy uppercase">
                Política Única VeneStay: No Reembolsable y Reprogramable
              </h4>
              <span className="ml-auto bg-brand-gold/10 text-[#b08f23] rounded-lg px-2.5 py-1 text-[9px] font-black tracking-widest uppercase border border-brand-gold/20">
                Estándar VeneStay
              </span>
            </div>
            <p className="text-[11.5px] font-medium leading-relaxed text-slate-600">
              Todas las propiedades en VeneStay operan bajo la política unificada de depósito del <strong>20% no reembolsable</strong>. El <strong>80% restante</strong> se abona al realizar el check-in. Los huéspedes pueden solicitar reprogramaciones de fechas bajo consentimiento del anfitrión sin perder su depósito.
            </p>
            <div className="border-t border-brand-gold/10 pt-3 flex items-center gap-2 text-[9px] font-bold text-slate-400 tracking-wide">
              <span>💡 Esta política se aplica de forma automática y obligatoria para todos los alojamientos de la plataforma.</span>
            </div>
          </div>
        </section>
      )}

      {/* Modo de Reserva */}
      <section className="space-y-4 border-t border-gray-200/60 pt-8" aria-labelledby="booking-mode-label">
        <div className="ml-1 flex items-center gap-2">
          <label id="booking-mode-label" className="text-brand-navy/40 text-[10px] font-black tracking-widest uppercase">
            Modo de Reserva Preferido
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="group" aria-labelledby="booking-mode-label">
          {/* Opción Reserva Inmediata */}
          <button
            type="button"
            aria-pressed={(editingListing.bookingMode ?? 'instant') === 'instant'}
            onClick={() => setEditingListing(prev => prev ? { ...prev, bookingMode: 'instant' } : null)}
            className={cn(
              'relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 min-h-[44px]',
              (editingListing.bookingMode ?? 'instant') === 'instant'
                ? 'border-brand-navy bg-brand-navy/[0.03] ring-1 ring-brand-navy/20 shadow-md'
                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="h-5 w-5 fill-amber-500/10" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[12px] font-black tracking-wide transition-colors',
                  (editingListing.bookingMode ?? 'instant') === 'instant' ? 'text-brand-navy' : 'text-brand-navy/60'
                )}>
                  Reserva Inmediata
                </span>
                {(editingListing.bookingMode ?? 'instant') === 'instant' && (
                  <Check className="h-4 w-4 text-brand-navy ml-1 shrink-0" />
                )}
              </div>
              <p className={cn(
                'text-[10px] font-semibold leading-relaxed transition-colors',
                (editingListing.bookingMode ?? 'instant') === 'instant' ? 'text-slate-500' : 'text-slate-400'
              )}>
                Los huéspedes reservan al instante sin confirmación manual previa. Mayor conversión.
              </p>
            </div>
          </button>

          {/* Opción Solicitar Reserva */}
          <button
            type="button"
            aria-pressed={editingListing.bookingMode === 'request'}
            onClick={() => setEditingListing(prev => prev ? { ...prev, bookingMode: 'request' } : null)}
            className={cn(
              'relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 min-h-[44px]',
              editingListing.bookingMode === 'request'
                ? 'border-brand-gold bg-brand-gold/[0.03] ring-1 ring-brand-gold/20 shadow-md'
                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[12px] font-black tracking-wide transition-colors',
                  editingListing.bookingMode === 'request' ? 'text-brand-navy' : 'text-brand-navy/60'
                )}>
                  Solicitar Reserva
                </span>
                {editingListing.bookingMode === 'request' && (
                  <Check className="h-4 w-4 text-brand-gold ml-1 shrink-0" />
                )}
              </div>
              <p className={cn(
                'text-[10px] font-semibold leading-relaxed transition-colors',
                editingListing.bookingMode === 'request' ? 'text-slate-500' : 'text-slate-400'
              )}>
                El huésped te contacta primero. Apruebas o rechazas en 24h. Mayor control sobre quién se queda.
              </p>
            </div>
          </button>
        </div>
      </section>
    </motion.div>
  );
};

export default StepGeneral;

