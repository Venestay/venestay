import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, ShieldCheck, Loader2, LayoutGrid } from 'lucide-react';
import { ENVIRONMENTS } from '../../constants/dashboard.constants';
import { useListingForm } from '../ListingFormContext';
import { cn } from '@/lib/utils';

const StepGallery: React.FC = () => {
  const { editingListing, setEditingListing, validation, isUploading, handleImageUpload, removeImage } = useListingForm();
  const { errors } = validation;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetEnvRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepContainerRef.current?.focus();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent, environmentId?: string) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleImageUpload({ files: e.dataTransfer.files }, environmentId || targetEnvRef.current || undefined);
      targetEnvRef.current = null;
    }
  };

  return (
    <motion.div 
      key="step2" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="space-y-10"
      ref={stepContainerRef}
      tabIndex={-1}
      aria-label="Paso 2: Galería de imágenes"
    >
      {/* Quality Gauge Header */}
      <div className="flex flex-col items-center justify-between gap-6 rounded-[32px] border border-brand-navy/5 bg-gray-50/50 p-8 md:flex-row relative overflow-hidden">
        {/* Glow effect when optimal */}
        <AnimatePresence>
          {((editingListing.images?.length || 0) >= 6) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative flex h-24 w-24 items-center justify-center" aria-hidden="true">
            <svg className="h-full w-full -rotate-90 transform drop-shadow-md" viewBox="0 0 36 36">
              <path
                className="stroke-gray-200"
                strokeDasharray="100, 100"
                strokeWidth="2.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${Math.min(100, ((editingListing.images?.length || 0) / 6) * 100)}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn(
                  "transition-colors duration-500 motion-reduce:transition-none",
                  (editingListing.images?.length || 0) >= 6 ? "stroke-emerald-500" : "stroke-brand-500"
                )}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                "text-lg font-black transition-colors duration-500",
                (editingListing.images?.length || 0) >= 6 ? "text-emerald-600" : "text-brand-navy"
              )}>
                {Math.min(100, Math.round(((editingListing.images?.length || 0) / 6) * 100))}%
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-brand-navy text-xl font-black tracking-tight flex items-center gap-2">
              Calidad de Galería
              <AnimatePresence>
                {((editingListing.images?.length || 0) >= 6) && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </h4>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-500",
              (editingListing.images?.length || 0) >= 6 ? "text-emerald-600/80" : "text-gray-400"
            )}>
              {(editingListing.images?.length || 0) >= 6 ? '¡Excelente! Tienes suficientes fotos' : 'Recomendamos subir al menos 6 fotos'}
            </p>
          </div>
        </div>
      </div>

      {errors.images && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-500 border border-red-100 animate-in fade-in slide-in-from-top-1" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-widest">{errors.images}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-brand-navy text-lg font-black tracking-tight">Galería Visual Premium</h4>
          <p className="text-gray-400 text-xs mt-1">Completa los ambientes sugeridos para una publicación perfecta</p>
        </div>

        {/* Guided Environment Slots */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" role="list" aria-label="Ambientes sugeridos">
          {ENVIRONMENTS.map((env) => {
            const photo = editingListing.environmentPhotos?.[env.id];
            return (
              <div
                key={env.id}
                role="button"
                tabIndex={0}
                aria-label={photo ? `Cambiar foto de ${env.label}` : `Subir foto de ${env.label}`}
                onClick={() => {
                  if (!isUploading) {
                    targetEnvRef.current = env.id;
                    fileInputRef.current?.click();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isUploading) {
                      targetEnvRef.current = env.id;
                      fileInputRef.current?.click();
                    }
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => handleDrop(e, env.id)}
                className={`group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500 min-h-[44px] ${photo
                    ? 'border-transparent bg-brand-navy ring-2 ring-emerald-500/30'
                    : 'border-dashed border-gray-100 bg-white hover:border-brand-500 hover:bg-gray-50'
                  }`}
              >
                {photo ? (
                  <>
                    <img src={photo} alt={`Foto de ${env.label}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none" />
                    <div className="absolute inset-0 bg-brand-navy/60 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px] motion-reduce:transition-none">
                      <button
                        type="button"
                        aria-label={`Eliminar foto de ${env.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newEnvPhotos = { ...editingListing.environmentPhotos };
                          delete newEnvPhotos[env.id];
                          setEditingListing(prev => prev ? { ...prev, environmentPhotos: newEnvPhotos } : null);
                        }}
                        className="bg-red-500/90 hover:bg-red-500 flex items-center justify-center rounded-2xl text-white shadow-xl transform transition-transform active:scale-95 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white motion-reduce:transition-none motion-reduce:transform-none"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="absolute top-3 right-3 bg-brand-500 text-brand-navy rounded-xl px-3 py-1.5 shadow-lg shadow-brand-500/30 flex items-center gap-1.5 border border-brand-400/50 backdrop-blur-md transform transition-transform group-hover:scale-110 motion-reduce:transition-none motion-reduce:transform-none">
                      <div className="bg-brand-navy/10 p-0.5 rounded-full" aria-hidden="true">
                        <ShieldCheck className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest">Verificado</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-xl transition-transform group-hover:scale-110 motion-reduce:transition-none motion-reduce:transform-none" aria-hidden="true">
                      <env.icon className="h-5 w-5 text-brand-navy/30" />
                    </div>
                    <span className="text-brand-navy/60 text-[9px] font-black uppercase tracking-widest">{env.label}</span>
                  </div>
                )}
                {isUploading && !photo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center" aria-live="polite">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-500 motion-reduce:animate-none" />
                    <span className="sr-only">Subiendo imagen...</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          aria-label="Subir imágenes de la propiedad"
          onChange={(e) => {
            const envId = targetEnvRef.current;
            handleImageUpload(e, envId || undefined);
            targetEnvRef.current = null;
            e.target.value = '';
          }}
        />

        {/* Extra Photos Dropzone */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-4" aria-hidden="true">
            <div className="h-[1px] flex-grow bg-gray-100" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Otras Fotos</span>
            <div className="h-[1px] flex-grow bg-gray-100" />
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Añadir más fotos (arrastra y suelta o haz clic)"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              targetEnvRef.current = null;
              fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                targetEnvRef.current = null;
                fileInputRef.current?.click();
              }
            }}
            className={`cursor-pointer border-2 border-dashed rounded-[32px] p-8 text-center transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500 ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-500 hover:bg-gray-50'}`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-full shadow-sm" aria-hidden="true">
                <LayoutGrid className="h-6 w-6 text-brand-navy" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Añadir más fotos</span>
            </div>
          </div>
        </div>
      </div>

      {editingListing.images.length > 0 && (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4" role="list" aria-label="Fotos adicionales">
          {editingListing.images.map((img, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
              <img src={img} alt={`Foto adicional ${idx + 1}`} className="h-full w-full object-cover" />
              <button 
                type="button" 
                aria-label={`Eliminar foto adicional ${idx + 1}`}
                onClick={() => removeImage(idx)} 
                className="absolute top-2 right-2 flex items-center justify-center rounded-lg bg-red-500/90 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600 min-h-[44px] min-w-[44px] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white motion-reduce:transition-none"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StepGallery;

