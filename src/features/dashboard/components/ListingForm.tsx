import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { Listing } from '@/types';
import { listingSchema } from '../types/dashboard.schema';
import { cn } from '@/lib/utils';
import { useListingValidation } from '../hooks/useListingValidation';
import { toast } from 'sonner';
import { useListingForm, ListingFormProvider } from './ListingFormContext';
import StepGeneral from './form-steps/StepGeneral';

const StepGallery = React.lazy(() => import('./form-steps/StepGallery'));
const StepMap = React.lazy(() => import('./form-steps/StepMap'));
const StepPayments = React.lazy(() => import('./form-steps/StepPayments'));

interface ListingFormProps {
  editingListing: Listing;
  setEditingListing: React.Dispatch<React.SetStateAction<Listing | null>>;
  handleUpdateListing: (e: React.FormEvent, listing?: Listing) => Promise<void>;
  isSaving: boolean;
  isUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement> | { files: FileList }, environmentId?: string) => Promise<void>;
  removeImage: (index: number) => void;
  isLoaded: boolean;
  loadError: { message: string } | null;
  LECHERIA_CENTER: { lat: number; lng: number };
  DEFAULT_MAP_OPTIONS: google.maps.MapOptions;
  user: { uid: string; displayName?: string; photoURL?: string } | null;
}

const ListingFormContent: React.FC<{
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setShowWarningModal: React.Dispatch<React.SetStateAction<boolean>>;
  isPublished: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}> = ({ step, setStep, setShowWarningModal, isPublished, handleSubmit }) => {
  const { editingListing, isSaving, isUploading, validation, setEditingListing: contextSetEditingListing } = useListingForm();
  const { isStepValid, validateStep, errors } = validation;
  const navigate = useNavigate();

  // Extracts only the fields relevant to the current step for scoped validation
  const getStepData = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return {
          title: editingListing.title,
          description: editingListing.description,
          pricePerNight: editingListing.pricePerNight,
          city: editingListing.city,
          maxGuests: editingListing.maxGuests,
          bedrooms: editingListing.bedrooms,
          beds: editingListing.beds,
          baths: editingListing.baths,
          buildingFloors: editingListing.buildingFloors,
          propertyFloor: editingListing.propertyFloor,
          constructionYear: editingListing.constructionYear,
        };
      case 2:
        return {
          images: editingListing.images,
          environmentPhotos: editingListing.environmentPhotos,
        };
      case 3:
        return {
          latitude: editingListing.latitude,
          longitude: editingListing.longitude,
          manualAddress: editingListing.manualAddress,
        };
      case 4:
        return {
          paymentMethods: editingListing.paymentMethods,
        };
      default:
        return {};
    }
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (step < 4) {
      const stepState = { step: step as 1 | 2 | 3 | 4, data: getStepData(step) };
      const isValid = validateStep(stepState);
      if (!isValid) {
        toast.error('Por favor completa la información requerida de este paso', {
          description: Object.values(errors)[0] as string || 'Campos requeridos faltantes'
        });
        return;
      }
    }

    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 0);
  };

  return (
    <AnimatePresence mode="wait">
      {!isPublished ? (
        <motion.form
          key="listing-form-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target instanceof HTMLInputElement) e.preventDefault(); }}
          className="flex h-full flex-col md:max-h-[95vh]"
        >
          {/* Header */}
          <div className="bg-brand-navy flex shrink-0 items-center justify-between p-6 text-white md:p-8 relative overflow-hidden">
            <div className="z-10">
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                {editingListing.id.startsWith('listing-') ? 'Nueva Propiedad' : 'Editar Propiedad'}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-brand-500 text-[9px] font-black tracking-[0.3em] uppercase md:text-[10px]">
                  {editingListing.id.startsWith('listing-') ? 'Publicación en Lechería' : `Ref: ${editingListing.id}`}
                </p>
                <AnimatePresence>
                  {editingListing.id.startsWith('listing-') && (
                    <motion.span 
                      key="autosave"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white/10 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-gray-300"
                    >
                      <Check className="h-2 w-2 text-brand-500" /> Guardado
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <button type="button" onClick={() => setShowWarningModal(true)} className="rounded-2xl bg-white/10 p-3 transition-transform hover:bg-white/20 active:scale-95 z-10">
              <X className="h-6 w-6" />
            </button>
            
            {/* Dynamic Progress Bar Background */}
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-brand-500"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Stepper Indicator */}
          <div className="bg-gray-50 flex items-center justify-between border-b border-gray-100 px-6 py-4 md:px-8 relative">
            <div className="absolute top-1/2 left-6 right-6 h-[2px] -translate-y-1/2 bg-gray-200 pointer-events-none md:left-8 md:right-8" />
            <motion.div 
              className="absolute top-1/2 left-6 h-[2px] -translate-y-1/2 bg-brand-navy pointer-events-none md:left-8"
              initial={{ width: 0 }}
              animate={{ width: `calc(${((step - 1) / 3) * 100}% - ${((step - 1) / 3) * 32}px)` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            {[
              { num: 1, label: 'General', copy: 'Info base' },
              { num: 2, label: 'Galería', copy: 'Sube fotos' },
              { num: 3, label: 'Mapa', copy: 'Ubicación' },
              { num: 4, label: 'Pagos', copy: 'Métodos' }
            ].map((s) => (
              <div key={s.num} className={`relative z-10 flex items-center gap-2 bg-gray-50 pr-4 md:pr-0 ${s.num === step ? 'text-brand-navy' : 'text-gray-300'}`}>
                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: s.num === step ? 1.1 : 1,
                    backgroundColor: s.num === step ? '#0B1120' : s.num < step ? '#C5A059' : '#E5E7EB',
                    color: s.num <= step ? '#FFFFFF' : '#9CA3AF'
                  }}
                  className="flex h-8 w-8 md:h-6 md:w-6 items-center justify-center rounded-full text-xs font-black shadow-sm"
                >
                  {s.num < step ? <Check className="h-4 w-4 md:h-3 md:w-3" /> : s.num}
                </motion.div>
                <div className="hidden flex-col md:flex bg-gray-50 px-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    {s.label}
                  </span>
                  <span className={`text-[9px] ${s.num === step ? 'text-brand-500 font-bold' : 'text-gray-400'}`}>
                    {s.copy}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="no-scrollbar flex-grow overflow-y-auto p-6 md:p-8">
            <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>}>
              <AnimatePresence mode="wait">
                {step === 1 && <StepGeneral />}
                {step === 2 && <StepGallery />}
                {step === 3 && <StepMap />}
                {step === 4 && <StepPayments />}
              </AnimatePresence>
            </Suspense>
          </div>

          <div className="bg-gray-50 shrink-0 border-t border-gray-100 p-6 md:p-8 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="bg-white border border-gray-200 text-brand-navy hover:bg-gray-100 flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all w-1/3">
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
            ) : (
              <div className="w-1/3"></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isStepValid({ step: step as 1 | 2 | 3 | 4, data: getStepData(step) })}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all flex-grow",
                  isStepValid({ step: step as 1 | 2 | 3 | 4, data: getStepData(step) })
                    ? "bg-brand-navy text-white hover:bg-brand-500 hover:text-brand-navy"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={isSaving || isUploading} className="bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all flex-grow disabled:opacity-50">
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Check className="h-4 w-4" /> Publicar Propiedad</>}
              </button>
            )}
          </div>
        </motion.form>
      ) : (
        <motion.div
          key="success-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-full flex-col items-center justify-center p-8 text-center space-y-8 min-h-[400px]"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="bg-brand-500 text-white p-6 rounded-full shadow-2xl shadow-brand-500/40"
            >
              <Check className="h-16 w-16 stroke-[3]" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-brand-500 rounded-full -z-10"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-3xl font-black text-brand-navy">¡Propiedad Publicada!</h3>
            <p className="text-gray-500 font-medium max-w-sm">Tu propiedad ya está disponible para recibir reservaciones. ¡Felicidades!</p>
          </div>

          <div className="flex flex-col w-full gap-4 max-w-sm">
            <button
              onClick={() => navigate('/')}
              className="w-full py-5 bg-brand-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-500 hover:text-brand-navy transition-all shadow-xl active:scale-95"
            >
              Volver al Inicio
            </button>
            <button
              onClick={() => {
                contextSetEditingListing(null);
              }}
              className="w-full py-5 bg-gray-100 text-brand-navy rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all active:scale-95"
            >
              Ver mis Propiedades
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ListingForm: React.FC<ListingFormProps> = ({
  editingListing,
  setEditingListing,
  handleUpdateListing,
  isSaving,
  isUploading,
  handleImageUpload,
  removeImage,
  isLoaded,
  LECHERIA_CENTER,
  DEFAULT_MAP_OPTIONS,
  user,
  loadError,
}) => {
  const [step, setStep] = useState(1);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const validation = useListingValidation();
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const currentCount = parseInt(document.body.dataset.modalCount || '0', 10);
    document.body.dataset.modalCount = String(currentCount + 1);
    document.body.style.overflow = 'hidden';

    if (editingListing.id.startsWith('listing-')) {
      const savedDraft = localStorage.getItem('venestay_draft_listing');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.id.startsWith('listing-')) {
            setEditingListing(draft);
          }
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }

    return () => {
      const newCount = parseInt(document.body.dataset.modalCount || '1', 10) - 1;
      document.body.dataset.modalCount = String(newCount);
      if (newCount <= 0) {
        document.body.style.overflow = '';
        document.body.removeAttribute('data-modal-count');
      }
    };
  }, []);

  useEffect(() => {
    if (editingListing.id.startsWith('listing-')) {
      localStorage.setItem('venestay_draft_listing', JSON.stringify(editingListing));
    }
  }, [editingListing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = listingSchema.safeParse(editingListing);
    if (!result.success) {
      const errorMsg = result.error.issues[0].message;
      toast.error(`Error: ${errorMsg}`);
      return;
    }

    const finalizedListing = {
      ...editingListing,
      hostName: user?.displayName || editingListing.hostName,
      hostAvatar: user?.photoURL || editingListing.hostAvatar,
      hostId: user?.uid || editingListing.hostId,
      updatedAt: new Date().toISOString(),
    };

    await handleUpdateListing(e, finalizedListing);
    localStorage.removeItem('venestay_draft_listing');
    setIsPublished(true);
  };

  return (
    <div className="bg-brand-navy/60 fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-w-5xl md:rounded-[40px]"
      >
        <ListingFormProvider
          editingListing={editingListing}
          setEditingListing={setEditingListing}
          validation={validation}
          isSaving={isSaving}
          isUploading={isUploading}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          isLoaded={isLoaded}
          LECHERIA_CENTER={LECHERIA_CENTER}
          DEFAULT_MAP_OPTIONS={DEFAULT_MAP_OPTIONS}
        >
          <ListingFormContent
            step={step}
            setStep={setStep}
            setShowWarningModal={setShowWarningModal}
            isPublished={isPublished}
            handleSubmit={handleSubmit}
          />
        </ListingFormProvider>
      </motion.div>

      {/* Warning Modal for Unsaved Changes */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-navy/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-full mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-navy">¿Salir sin guardar?</h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">Los cambios que hayas realizado se perderán. ¿Estás seguro que deseas salir?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full py-4 bg-brand-navy text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-500 transition-colors"
                >
                  Continuar editando
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('venestay_draft_listing');
                    setEditingListing(null);
                  }}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  Salir sin guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingForm;
