import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Loader2,
  Trash2,
  Globe,
  Sparkles,
  Smartphone,
  Landmark,
  ShieldCheck,
  Check,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Sofa,
  UtensilsCrossed,
  Bed,
  BedDouble,
  Bath,
  Mountain,
  LayoutGrid,
} from 'lucide-react';
import { ENVIRONMENTS } from '../constants/dashboard.constants';
import { GoogleMap, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import { Listing, City, PaymentMethodType } from '@/types';
import { listingSchema } from '../types/dashboard.schema';
import { cn } from '@/lib/utils';
import { useListingValidation } from '../hooks/useListingValidation';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';

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

// PAYMENT_OPTIONS below...

const PAYMENT_OPTIONS = [
  { type: 'Zelle', label: 'ZELLE', icon: Globe, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { type: 'Binance', label: 'BINANCE PAY', icon: Sparkles, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { type: 'PagoMovil', label: 'PAGO MÓVIL', icon: Smartphone, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  { type: 'Transferencia', label: 'TRANSFERENCIA', icon: Landmark, color: 'text-brand-500', bgColor: 'bg-brand-50' },
] as const;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const [activePaymentType, setActivePaymentType] = useState<PaymentMethodType | null>(null);
  const [tempPaymentData, setTempPaymentData] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const targetEnvRef = useRef<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const { errors, touched, validateField, setFieldTouched, validateStep, isStepValid } = useListingValidation();

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Cargar borrador si existe y estamos en modo "nueva propiedad"
    if (editingListing.id.startsWith('listing-')) {
      const savedDraft = localStorage.getItem('venestay_draft_listing');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          // Solo cargar si el ID coincide o si el ID actual es genérico
          if (draft.id.startsWith('listing-')) {
            setEditingListing(draft);
          }
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Guardar borrador automáticamente
  useEffect(() => {
    if (editingListing.id.startsWith('listing-')) {
      localStorage.setItem('venestay_draft_listing', JSON.stringify(editingListing));
    }
  }, [editingListing]);



  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (step < 4) {
      const isValid = validateStep(step, editingListing);
      if (!isValid) {
        toast.error('Por favor completa la información requerida de este paso', {
          description: Object.values(errors)[0] || 'Campos requeridos faltantes'
        });
        return;
      }
    }

    // Evitar la carrera de eventos (Event Bubbling) que dispara el submit del botón en el paso 4
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 0);
  };

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
      // Use explicit environmentId if provided (dropped on a slot), otherwise use targetEnvRef
      await handleImageUpload({ files: e.dataTransfer.files }, environmentId || targetEnvRef.current || undefined);
      targetEnvRef.current = null;
    }
  };

  const onSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
    searchBoxRef.current = ref;
  };

  const onPlacesChanged = () => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const location = place.geometry?.location;
        if (location) {
          setEditingListing((prev) =>
            prev ? {
              ...prev,
              latitude: location.lat(),
              longitude: location.lng(),
              location: place.formatted_address || prev.location,
              manualAddress: place.formatted_address || prev.manualAddress
            } : null
          );
        }
      }
    }
  };

  const handleGeocodeManualAddress = () => {
    if (!editingListing.manualAddress || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: editingListing.manualAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        setEditingListing(prev => prev ? {
          ...prev,
          latitude: lat(),
          longitude: lng(),
          location: results[0].formatted_address
        } : null);
        toast.success('Ubicación actualizada en el mapa');
      } else {
        toast.error('No se pudo encontrar la ubicación exacta');
      }
    });
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setEditingListing(prev => prev ? {
        ...prev,
        latitude: e.latLng!.lat(),
        longitude: e.latLng!.lng()
      } : null);
    }
  };

  const validatePaymentInput = (): string | null => {
    if (activePaymentType === 'Zelle') {
      if (!tempPaymentData.accountHolder || tempPaymentData.accountHolder.trim().length < 3) return "Debe ingresar el nombre del titular para Zelle";
      if (!tempPaymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempPaymentData.email)) return "El correo de Zelle no es válido";
    }

    if (activePaymentType === 'Binance') {
      if (!tempPaymentData.binanceId || tempPaymentData.binanceId.trim().length < 6) return "El Binance Pay ID debe tener al menos 6 dígitos";
      if (!tempPaymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempPaymentData.email)) return "Debe ingresar el correo asociado a Binance";
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

    const newMethod = {
      id: Math.random().toString(36).substr(2, 9),
      type: activePaymentType!,
      label: PAYMENT_OPTIONS.find(o => o.type === activePaymentType)?.label || activePaymentType!,
      isVerified: true,
      data: { ...tempPaymentData }
    };

    const currentMethods = editingListing.paymentMethods || [];
    const filtered = currentMethods.filter(m => m.type !== activePaymentType);

    setEditingListing({ ...editingListing, paymentMethods: [...filtered, newMethod] as any });
    setActivePaymentType(null);
    setTempPaymentData({});
  };

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
    // Limpiar persistencia tras éxito
    localStorage.removeItem('venestay_draft_listing');
  };

  return (
    <div className="bg-brand-navy/60 fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-w-5xl md:rounded-[40px]"
      >
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target instanceof HTMLInputElement) e.preventDefault(); }}
          className="flex h-full flex-col md:max-h-[95vh]"
        >
          {/* Header */}
          <div className="bg-brand-navy flex shrink-0 items-center justify-between p-6 text-white md:p-8">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                {editingListing.id.startsWith('listing-') ? 'Nueva Propiedad' : 'Editar Propiedad'}
              </h3>
              <p className="text-brand-500 mt-1 text-[9px] font-black tracking-[0.3em] uppercase md:text-[10px]">
                {editingListing.id.startsWith('listing-') ? 'Publicación en Lechería' : `Ref: ${editingListing.id}`}
              </p>
            </div>
            <button type="button" onClick={() => setShowWarningModal(true)} className="rounded-2xl bg-white/10 p-3 transition-transform hover:bg-white/20 active:scale-95">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="bg-gray-50 flex items-center justify-between border-b border-gray-100 px-6 py-4 md:px-8">
            {[
              { num: 1, label: 'General', copy: 'Info base' },
              { num: 2, label: 'Galería', copy: 'Sube fotos' },
              { num: 3, label: 'Mapa', copy: 'Ubicación' },
              { num: 4, label: 'Pagos', copy: 'Métodos' }
            ].map((s) => (
              <div key={s.num} className={`flex items-center gap-2 ${s.num === step ? 'text-brand-navy' : 'text-gray-300'}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition-colors ${s.num === step ? 'bg-brand-navy text-white shadow-md' : s.num < step ? 'bg-brand-500 text-white' : 'bg-gray-200'}`}>
                  {s.num < step ? <Check className="h-3 w-3" /> : s.num}
                </div>
                <div className="hidden flex-col md:flex">
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
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  {/* Información General */}
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="col-span-2 space-y-2">
                      <label className={cn(
                        "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
                        touched.title && errors.title ? "text-red-500" : "text-brand-navy/40"
                      )}>
                        Título del Alojamiento
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className={cn(
                            "text-brand-navy w-full rounded-2xl border bg-gray-50 px-6 py-4 font-bold outline-none transition-all",
                            touched.title && errors.title ? "border-red-200 bg-red-50 focus:border-red-500" :
                              touched.title && !errors.title ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                                "border-gray-100 focus:border-brand-500"
                          )}
                          value={editingListing.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingListing({ ...editingListing, title: val });
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
                      {touched.title && errors.title && <p className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.title}</p>}
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className={cn(
                        "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
                        touched.description && errors.description ? "text-red-500" : "text-brand-navy/40"
                      )}>
                        Descripción del Alojamiento
                      </label>
                      <textarea
                        className={cn(
                          "text-brand-navy h-32 w-full resize-none rounded-2xl border bg-gray-50 px-6 py-4 text-xs font-bold outline-none transition-all",
                          touched.description && errors.description ? "border-red-200 bg-red-50 focus:border-red-500" :
                            touched.description && !errors.description ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                              "border-gray-100 focus:border-brand-500"
                        )}
                        value={editingListing.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingListing({ ...editingListing, description: val });
                          if (touched.description) validateField('description', val);
                        }}
                        onBlur={() => {
                          setFieldTouched('description');
                          validateField('description', editingListing.description);
                        }}
                        placeholder="Describe los lujos, la zona y por qué es la mejor opción..."
                      />
                      {touched.description && errors.description && <p className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className={cn(
                        "text-[10px] font-black tracking-widest uppercase ml-1 transition-colors",
                        touched.pricePerNight && errors.pricePerNight ? "text-red-500" : "text-brand-navy/40"
                      )}>
                        Precio por Noche ($)
                      </label>
                      <input
                        type="number"
                        className={cn(
                          "text-brand-navy w-full rounded-2xl border bg-gray-50 px-6 py-4 font-bold outline-none transition-all",
                          touched.pricePerNight && errors.pricePerNight ? "border-red-200 bg-red-50 focus:border-red-500" :
                            touched.pricePerNight && !errors.pricePerNight ? "border-emerald-100 bg-emerald-50/30 focus:border-emerald-500" :
                              "border-gray-100 focus:border-brand-500"
                        )}
                        value={editingListing.pricePerNight}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingListing({ ...editingListing, pricePerNight: val });
                          if (touched.pricePerNight) validateField('pricePerNight', val);
                        }}
                        onBlur={() => {
                          setFieldTouched('pricePerNight');
                          validateField('pricePerNight', editingListing.pricePerNight);
                        }}
                      />
                      {touched.pricePerNight && errors.pricePerNight && <p className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.pricePerNight}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Ciudad</label>
                      <select
                        className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none transition-all"
                        value={editingListing.city}
                        onChange={(e) => {
                          const val = e.target.value as City;
                          setEditingListing({ ...editingListing, city: val });
                          validateField('city', val);
                        }}
                      >
                        {['Lechería', 'Caracas', 'Margarita', 'Falcon', 'Maracaibo', 'Puerto La Cruz'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </section>

                  {/* Detalles de Edificación */}
                  <section className="bg-gray-50 space-y-6 rounded-[32px] p-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {[
                        { label: 'Huéspedes', key: 'maxGuests' },
                        { label: 'Dormitorios', key: 'bedrooms' },
                        { label: 'Camas', key: 'beds' },
                        { label: 'Baños', key: 'baths' },
                      ].map(item => (
                        <div key={item.key} className="space-y-1">
                          <label className={cn(
                            "text-[8px] font-black tracking-widest uppercase transition-colors",
                            touched[item.key] && errors[item.key] ? "text-red-500" : "text-gray-400"
                          )}>{item.label}</label>
                          <input
                            type="number"
                            className={cn(
                              "w-full rounded-xl border p-3 text-sm font-bold shadow-sm transition-all",
                              touched[item.key] && errors[item.key] ? "border-red-200 bg-red-50 text-red-600 focus:border-red-500" :
                                touched[item.key] && !errors[item.key] ? "border-emerald-100 bg-emerald-50/20" :
                                  "border-white bg-white focus:border-brand-500"
                            )}
                            value={(editingListing as Record<string, any>)[item.key]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditingListing({ ...editingListing, [item.key]: val });
                              validateField(item.key, val);
                            }}
                            onBlur={() => setFieldTouched(item.key)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Pisos Edificio', key: 'buildingFloors' },
                          { label: 'Piso Alojamiento', key: 'propertyFloor' },
                          { label: 'Año Const.', key: 'constructionYear' },
                        ].map(item => (
                          <div key={item.key} className="space-y-1">
                            <label className={cn(
                              "text-[8px] font-black tracking-widest uppercase transition-colors",
                              (touched[item.key] && errors[item.key]) || (item.key === 'propertyFloor' && Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors)) ? "text-red-500" : "text-gray-400"
                            )}>
                              {item.label}
                            </label>
                            <input
                              type="number"
                              className={cn(
                                "w-full rounded-xl border p-3 text-sm font-bold shadow-sm transition-all",
                                (touched[item.key] && errors[item.key]) || (item.key === 'propertyFloor' && Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors)) ? "border-red-200 bg-red-50 text-red-600" : "border-white bg-white focus:border-brand-500"
                              )}
                              value={(editingListing as Record<string, any>)[item.key] || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingListing({ ...editingListing, [item.key]: val });
                                validateField(item.key, val);
                              }}
                              onBlur={() => setFieldTouched(item.key)}
                            />
                          </div>
                        ))}
                      </div>
                      {(errors.propertyFloor || Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors)) && (
                        <div className="flex items-center gap-2 text-red-500 text-[9px] font-bold uppercase animate-pulse">
                          <AlertCircle className="h-3 w-3" /> {errors.propertyFloor || "El piso del alojamiento es superior al del edificio"}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Comodidades y Servicios */}
                  <section className="space-y-4">
                    <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Comodidades y Servicios Adicionales</label>
                    <div className="flex flex-wrap gap-2">
                      {['WiFi', 'A/A', 'TV', 'Cocina equipada', 'Piscina', 'Planta Eléctrica', 'Tanque de Agua', 'Vista al Mar', 'Gimnasio', 'Estacionamiento', 'Elementos de seguridad', 'Extintor de incendios', 'Botiquín de primeros auxilios'].map(amenity => {
                        const isActive = editingListing.amenities?.includes(amenity);
                        return (
                          <button key={amenity} type="button" onClick={() => {
                            const current = editingListing.amenities || [];
                            const next = isActive ? current.filter(a => a !== amenity) : [...current, amenity];
                            setEditingListing({ ...editingListing, amenities: next });
                          }} className={`rounded-full px-5 py-2.5 text-[10px] font-bold transition-all ${isActive ? 'bg-brand-navy text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{amenity}</button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Entorno / Actividades */}
                  <section className="space-y-2">
                    <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Entorno (Actividades o lugares de interés cercanos)</label>
                    <textarea
                      className="text-brand-navy focus:border-brand-500 h-24 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 text-xs font-bold outline-none"
                      value={editingListing.nearbyActivities || ''}
                      onChange={(e) => setEditingListing({ ...editingListing, nearbyActivities: e.target.value })}
                      placeholder="Menciona centros comerciales, playas, restaurantes u otros sitios de interés cerca..."
                    />
                  </section>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  {/* Quality Gauge Header */}
                  <div className="flex flex-col items-center justify-between gap-6 rounded-[32px] border border-brand-navy/5 bg-gray-50/50 p-8 md:flex-row">
                    <div className="flex items-center gap-6">
                      <div className="relative flex h-20 w-20 items-center justify-center">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path
                            className="stroke-gray-200"
                            strokeDasharray="100, 100"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="stroke-brand-500 transition-all duration-1000"
                            strokeDasharray={`${Math.min(100, ((editingListing.images?.length || 0) / 6) * 100)}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="text-brand-navy absolute text-sm font-black">
                          {Math.min(100, Math.round(((editingListing.images?.length || 0) / 6) * 100))}%
                        </span>
                      </div>
                      <div>
                        <h4 className="text-brand-navy text-xl font-black tracking-tight">Calidad de Galería</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Recomendamos subir al menos 6 fotos de alta calidad
                        </p>
                      </div>
                    </div>
                  </div>

                  {errors.images && (
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-500 border border-red-100 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{errors.images}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-brand-navy text-lg font-black tracking-tight">Galería Visual Premium</h4>
                      <p className="text-gray-400 text-xs mt-1">Completa los ambientes sugeridos para una publicación perfecta</p>
                    </div>

                    {/* Guided Environment Slots */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {ENVIRONMENTS.map((env) => {
                        const photo = editingListing.environmentPhotos?.[env.id];
                        return (
                          <div
                            key={env.id}
                            onClick={() => {
                              if (!isUploading) {
                                targetEnvRef.current = env.id;
                                fileInputRef.current?.click();
                              }
                            }}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => handleDrop(e, env.id)}
                            className={`group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 transition-all duration-300 ${photo
                                ? 'border-transparent bg-brand-navy ring-2 ring-emerald-500/30'
                                : 'border-dashed border-gray-100 bg-white hover:border-brand-500 hover:bg-gray-50'
                              }`}
                          >
                            {photo ? (
                              <>
                                <img src={photo} alt={env.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-brand-navy/60 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newEnvPhotos = { ...editingListing.environmentPhotos };
                                      delete newEnvPhotos[env.id];
                                      setEditingListing({ ...editingListing, environmentPhotos: newEnvPhotos });
                                    }}
                                    className="bg-red-500/90 hover:bg-red-500 p-2.5 rounded-2xl text-white shadow-xl transform transition-transform active:scale-95"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                                <div className="absolute top-3 right-3 bg-brand-500 text-brand-navy rounded-xl px-3 py-1.5 shadow-lg shadow-brand-500/30 flex items-center gap-1.5 border border-brand-400/50 backdrop-blur-md transform transition-transform group-hover:scale-110">
                                  <div className="bg-brand-navy/10 p-0.5 rounded-full">
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                  </div>
                                  <span className="text-[8px] font-black uppercase tracking-widest">Verificado</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 p-4 text-center">
                                <div className="bg-gray-50 p-3 rounded-xl transition-transform group-hover:scale-110">
                                  <env.icon className="h-5 w-5 text-brand-navy/30" />
                                </div>
                                <span className="text-brand-navy/60 text-[9px] font-black uppercase tracking-widest">{env.label}</span>
                              </div>
                            )}
                            {isUploading && !photo && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
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
                      onChange={(e) => {
                        const envId = targetEnvRef.current;
                        handleImageUpload(e, envId || undefined);
                        targetEnvRef.current = null;
                        // Reset input value to allow the same file to be selected again if needed
                        // and to ensure onChange fires for subsequent selections
                        e.target.value = '';
                      }}
                    />

                    {/* Extra Photos Dropzone */}
                    <div className="mt-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-grow bg-gray-100" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Otras Fotos</span>
                        <div className="h-[1px] flex-grow bg-gray-100" />
                      </div>

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          targetEnvRef.current = null;
                          fileInputRef.current?.click();
                        }}
                        className={`cursor-pointer border-2 border-dashed rounded-[32px] p-8 text-center transition-all ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-500 hover:bg-gray-50'}`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <LayoutGrid className="h-6 w-6 text-brand-navy" />
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Añadir más fotos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingListing.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                      {editingListing.images.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 rounded-lg bg-red-500/90 p-1.5 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-brand-navy text-lg font-black tracking-tight">Ubicación de la Propiedad</h4>
                    <p className="text-gray-400 text-xs mt-1">Verifica la dirección exacta en el mapa</p>
                  </div>

                  {errors.latitude && (
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-500 border border-red-100">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{errors.latitude}</p>
                    </div>
                  )}

                  <div className="relative h-[400px] overflow-hidden rounded-[32px] border border-gray-100 shadow-inner">
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={editingListing.latitude ? { lat: editingListing.latitude, lng: editingListing.longitude! } : LECHERIA_CENTER}
                        zoom={15}
                        onClick={(e) => e.latLng && setEditingListing({ ...editingListing, latitude: e.latLng.lat(), longitude: e.latLng.lng() })}
                        options={DEFAULT_MAP_OPTIONS}
                      >
                        <StandaloneSearchBox onLoad={onSearchBoxLoad} onPlacesChanged={onPlacesChanged}>
                          <input type="text" placeholder="🔍 Buscar dirección..." className="absolute top-4 left-1/2 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-2xl bg-white/95 p-4 text-xs font-bold shadow-xl outline-none border border-gray-100" />
                        </StandaloneSearchBox>
                        {editingListing.latitude && (
                          <Marker
                            position={{ lat: editingListing.latitude, lng: editingListing.longitude! }}
                            draggable={true}
                            onDragEnd={handleMarkerDragEnd}
                            icon={{
                              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#C5A059" stroke="#0B1120" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                  <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                              `),
                              scaledSize: new window.google.maps.Size(40, 40),
                              anchor: new window.google.maps.Point(20, 40),
                            }}
                          />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="bg-gray-50 flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <p className="text-brand-navy text-sm font-black">API de Google Maps no disponible</p>
                          <p className="text-gray-400 text-xs font-medium max-w-xs mx-auto mb-4">Usa el botón de bypass temporal para forzar las coordenadas en Lechería mientras se restablece el servicio.</p>
                          <button
                            id="bypass-maps-btn"
                            type="button"
                            onClick={() => {
                              setEditingListing({
                                ...editingListing,
                                latitude: 10.2167,
                                longitude: -67.95,
                                location: 'Lechería (Bypass)',
                              });
                              toast.success('Bypass Activado: Ubicación establecida en Lechería');
                            }}
                            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-6 py-3 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-transform active:scale-95"
                          >
                            Forzar Ubicación (Bypass)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Address Input */}
                  <div className="bg-gray-50 flex flex-col gap-4 rounded-[32px] border border-gray-100 p-6 md:p-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Dirección Detallada / Punto de Referencia</label>
                      <div className="flex gap-3">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-white px-6 py-4 text-xs font-bold outline-none shadow-sm"
                            value={editingListing.manualAddress || ''}
                            onChange={(e) => setEditingListing({ ...editingListing, manualAddress: e.target.value })}
                            onBlur={handleGeocodeManualAddress}
                            placeholder="Ej: Edificio Yacht Club, frente al Bodegón X..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleGeocodeManualAddress}
                          className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy flex items-center justify-center gap-2 rounded-2xl px-6 font-black text-[10px] tracking-widest text-white uppercase transition-all shadow-md active:scale-95"
                        >
                          Ubicar
                        </button>
                      </div>
                      <p className="text-[9px] font-medium text-gray-400 mt-1 ml-1 italic">
                        * Puedes escribir la dirección y presionar "Ubicar" o arrastrar el ícono de la casa en el mapa.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-brand-navy text-lg font-black tracking-tight">Métodos de Cobro</h4>
                    <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Validación bancaria activa</p>
                  </div>

                  {errors.paymentMethods && (
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-500 border border-red-100">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{errors.paymentMethods}</p>
                    </div>
                  )}

                  <div className="border-brand-navy/10 rounded-[40px] border bg-gray-50/50 p-8 shadow-sm">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const isActive = activePaymentType === opt.type;
                        const isSaved = editingListing.paymentMethods?.some(m => m.type === opt.type);
                        return (
                          <button key={opt.type} type="button" onClick={() => setActivePaymentType(isActive ? null : opt.type)} className={`group relative flex flex-col items-center gap-3 rounded-[2rem] border-2 p-5 transition-all ${isActive ? 'bg-brand-navy border-brand-navy text-white shadow-xl -translate-y-1' : 'bg-white border-transparent text-brand-navy hover:border-brand-500/20 shadow-sm'}`}>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? 'bg-white/10' : opt.bgColor}`}>
                              <opt.icon className={`h-6 w-6 ${isActive ? 'text-brand-500' : opt.color}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter">{opt.label}</span>
                            {isSaved && <div className="bg-brand-500 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full shadow-lg"><Check className="text-brand-navy h-3 w-3" /></div>}
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
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Banco</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="Ej: Banesco, Mercantil" value={tempPaymentData.bankName || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, bankName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="Nombre del propietario" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountHolder: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Cédula / RIF</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="V-12345678" value={tempPaymentData.idNumber || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, idNumber: e.target.value.toUpperCase() })} />
                                </div>

                                {activePaymentType === 'PagoMovil' && (
                                  <div className="space-y-2">
                                    <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Teléfono Celular</label>
                                    <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="04141234567" value={tempPaymentData.phoneNumber || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, phoneNumber: e.target.value })} />
                                  </div>
                                )}

                                {activePaymentType === 'Transferencia' && (
                                  <>
                                    <div className="space-y-2">
                                      <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Tipo de Cuenta</label>
                                      <select className="w-full appearance-none rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" value={tempPaymentData.accountType || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountType: e.target.value })}>
                                        <option value="">Selecciona tipo</option>
                                        <option value="Corriente">Corriente</option>
                                        <option value="Ahorros">Ahorros</option>
                                        <option value="Custodia">Custodia / USD</option>
                                      </select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                      <label className={`text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase ${tempPaymentData.accountNumber && tempPaymentData.accountNumber.length !== 20 ? 'text-red-500' : ''}`}>Número de Cuenta (20 dígitos)</label>
                                      <input type="text" maxLength={20} className={`w-full rounded-2xl px-6 py-4 text-xs font-bold outline-none ${tempPaymentData.accountNumber && tempPaymentData.accountNumber.length !== 20 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 focus:bg-gray-100'}`} placeholder="01020000000000000000" value={tempPaymentData.accountNumber || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountNumber: e.target.value.replace(/\D/g, '') })} />
                                    </div>
                                  </>
                                )}
                              </>
                            ) : activePaymentType === 'Zelle' ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular de la Cuenta</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="Nombre completo" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, accountHolder: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo Zelle</label>
                                  <input type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, email: e.target.value })} />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Binance Pay ID</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="ID de 9 dígitos" value={tempPaymentData.binanceId || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, binanceId: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo asociado</label>
                                  <input type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({ ...tempPaymentData, email: e.target.value })} />
                                </div>
                              </>
                            )}
                          </div>
                          <button type="button" onClick={confirmPaymentMethod} className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all">
                            Confirmar {activePaymentType} <ChevronDown className="h-4 w-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                disabled={!isStepValid(step, editingListing)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase shadow-xl transition-all flex-grow",
                  isStepValid(step, editingListing)
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
        </form>
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
