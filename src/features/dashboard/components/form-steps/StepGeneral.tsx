import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { City } from '@/types';
import { useListingForm } from '../ListingFormContext';

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

  // Focus management: move focus to first input when step mounts
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

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

        <div className="space-y-2">
          <label htmlFor="listing-city" className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Ciudad</label>
          <select
            id="listing-city"
            className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none transition-all appearance-none"
            value={editingListing.city || 'Lechería'}
            onChange={(e) => {
              const val = 'Lechería' as City;
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
      </section>

      {/* Detalles de Edificación */}
      <section className="bg-gray-50 space-y-6 rounded-[32px] p-6 border border-gray-100/50 shadow-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {[
            { label: 'Huéspedes', key: 'maxGuests' as const },
            { label: 'Dormitorios', key: 'bedrooms' as const },
            { label: 'Camas', key: 'beds' as const },
            { label: 'Baños', key: 'baths' as const },
          ].map(item => (
            <div key={item.key} className="space-y-3">
              <label htmlFor={`listing-${item.key}`} className={cn(
                "text-[10px] font-black tracking-widest uppercase transition-colors ml-1",
                touched[item.key] && errors[item.key] ? "text-red-500" : "text-brand-navy/40"
              )}>{item.label}</label>
              <NumberStepper
                id={`listing-${item.key}`}
                value={Number(editingListing[item.key]) || 0}
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
          {['WiFi', 'A/A', 'TV', 'Cocina equipada', 'Piscina', 'Planta Eléctrica', 'Tanque de Agua', 'Vista al Mar', 'Gimnasio', 'Estacionamiento', 'Elementos de seguridad', 'Extintor de incendios', 'Botiquín de primeros auxilios'].map(amenity => {
            const isActive = editingListing.amenities?.includes(amenity);
            return (
              <button key={amenity} type="button" aria-pressed={isActive} onClick={() => {
                const current = editingListing.amenities || [];
                const next = isActive ? current.filter(a => a !== amenity) : [...current, amenity];
                setEditingListing(prev => prev ? { ...prev, amenities: next } : null);
              }} className={`rounded-full px-5 py-2.5 text-[10px] font-bold transition-all min-h-[44px] ${isActive ? 'bg-brand-navy text-white shadow-md' : 'bg-gray-100 text-brand-navy/60 hover:bg-gray-200'}`}>{amenity}</button>
            );
          })}
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
    </motion.div>
  );
};

export default StepGeneral;

