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
} from 'lucide-react';
import { GoogleMap, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import { Listing, City, PaymentMethodType } from '@/types';
import { listingSchema } from '../types/dashboard.schema';
import { toast } from 'sonner';
import Skeleton from '@/components/ui/Skeleton';

interface ListingFormProps {
  editingListing: Listing;
  setEditingListing: React.Dispatch<React.SetStateAction<Listing | null>>;
  handleUpdateListing: (e: React.FormEvent, listing?: Listing) => Promise<void>;
  isSaving: boolean;
  isUploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeImage: (index: number) => void;
  isLoaded: boolean;
  loadError: any;
  LECHERIA_CENTER: { lat: number; lng: number };
  DEFAULT_MAP_OPTIONS: any;
  user: any;
}

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
  loadError,
  LECHERIA_CENTER,
  DEFAULT_MAP_OPTIONS,
  user,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  
  const [activePaymentType, setActivePaymentType] = useState<PaymentMethodType | null>(null);
  const [tempPaymentData, setTempPaymentData] = useState<any>({});
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const currentYear = new Date().getFullYear();
  const yearError = Number(editingListing.constructionYear) > currentYear;

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (step === 1 && yearError) {
      toast.error('El año de construcción no puede ser superior al actual');
      return;
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
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleImageUpload({ target: { files: e.dataTransfer.files } } as any);
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
            prev ? { ...prev, latitude: location.lat(), longitude: location.lng(), location: place.formatted_address || prev.location } : null
          );
        }
      }
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
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Título del Alojamiento</label>
                      <input
                        type="text"
                        className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none"
                        value={editingListing.title}
                        onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })}
                        placeholder="Ej: Penthouse de Lujo en Lechería"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Descripción del Alojamiento</label>
                      <textarea
                        className="text-brand-navy focus:border-brand-500 h-32 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 text-xs font-bold outline-none"
                        value={editingListing.description || ''}
                        onChange={(e) => setEditingListing({ ...editingListing, description: e.target.value })}
                        placeholder="Describe los lujos, la zona y por qué es la mejor opción..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Precio por Noche ($)</label>
                      <input
                        type="number"
                        className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none"
                        value={editingListing.pricePerNight}
                        onChange={(e) => setEditingListing({ ...editingListing, pricePerNight: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Ciudad</label>
                      <select
                        className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 font-bold outline-none"
                        value={editingListing.city}
                        onChange={(e) => setEditingListing({ ...editingListing, city: e.target.value as City })}
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
                          <label className="text-[8px] font-black tracking-widest text-gray-400 uppercase">{item.label}</label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-white bg-white p-3 text-sm font-bold shadow-sm"
                            value={(editingListing as any)[item.key]}
                            onChange={(e) => setEditingListing({ ...editingListing, [item.key]: Number(e.target.value) })}
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
                            <label className={`text-[8px] font-black tracking-widest uppercase ${item.key === 'propertyFloor' && Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors) ? 'text-red-500' : 'text-gray-400'}`}>
                              {item.label}
                            </label>
                            <input
                              type="number"
                              className={`w-full rounded-xl border p-3 text-sm font-bold shadow-sm ${item.key === 'propertyFloor' && Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors) ? 'border-red-200 bg-red-50 text-red-600' : 'border-white bg-white'}`}
                              value={(editingListing as any)[item.key] || ''}
                              onChange={(e) => setEditingListing({ ...editingListing, [item.key]: Number(e.target.value) })}
                            />
                          </div>
                        ))}
                      </div>
                      {Number(editingListing.propertyFloor) > Number(editingListing.buildingFloors) && (
                        <div className="flex items-center gap-2 text-red-500 text-[9px] font-bold uppercase animate-pulse">
                          <AlertCircle className="h-3 w-3" /> El piso del alojamiento es superior al del edificio
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
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-brand-navy text-lg font-black tracking-tight">Galería Visual Premium</h4>
                    <p className="text-gray-400 text-xs mt-1">Arrastra tus fotos o haz clic para subir</p>
                  </div>
                  
                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-[32px] p-12 text-center transition-all ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-500 hover:bg-gray-50'}`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subiendo imágenes...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-full shadow-sm">
                          <ImageIcon className="h-8 w-8 text-brand-navy" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Añadir Fotos</span>
                      </div>
                    )}
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
                        {editingListing.latitude && <Marker position={{ lat: editingListing.latitude, lng: editingListing.longitude! }} />}
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
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-brand-navy text-lg font-black tracking-tight">Métodos de Cobro</h4>
                    <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Validación bancaria activa</p>
                  </div>
                  
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
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="Ej: Banesco, Mercantil" value={tempPaymentData.bankName || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, bankName: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="Nombre del propietario" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, accountHolder: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Cédula / RIF</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="V-12345678" value={tempPaymentData.idNumber || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, idNumber: e.target.value.toUpperCase()})} />
                                </div>

                                {activePaymentType === 'PagoMovil' && (
                                  <div className="space-y-2">
                                    <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Teléfono Celular</label>
                                    <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="04141234567" value={tempPaymentData.phoneNumber || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, phoneNumber: e.target.value})} />
                                  </div>
                                )}

                                {activePaymentType === 'Transferencia' && (
                                  <>
                                    <div className="space-y-2">
                                      <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Tipo de Cuenta</label>
                                      <select className="w-full appearance-none rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" value={tempPaymentData.accountType || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, accountType: e.target.value})}>
                                        <option value="">Selecciona tipo</option>
                                        <option value="Corriente">Corriente</option>
                                        <option value="Ahorros">Ahorros</option>
                                        <option value="Custodia">Custodia / USD</option>
                                      </select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                      <label className={`text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase ${tempPaymentData.accountNumber && tempPaymentData.accountNumber.length !== 20 ? 'text-red-500' : ''}`}>Número de Cuenta (20 dígitos)</label>
                                      <input type="text" maxLength={20} className={`w-full rounded-2xl px-6 py-4 text-xs font-bold outline-none ${tempPaymentData.accountNumber && tempPaymentData.accountNumber.length !== 20 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 focus:bg-gray-100'}`} placeholder="01020000000000000000" value={tempPaymentData.accountNumber || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, accountNumber: e.target.value.replace(/\D/g, '')})} />
                                    </div>
                                  </>
                                )}
                              </>
                            ) : activePaymentType === 'Zelle' ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular de la Cuenta</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="Nombre completo" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, accountHolder: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo Zelle</label>
                                  <input type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, email: e.target.value})} />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Binance Pay ID</label>
                                  <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="ID de 9 dígitos" value={tempPaymentData.binanceId || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, binanceId: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo asociado</label>
                                  <input type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, email: e.target.value})} />
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
              <button type="button" onClick={handleNextStep} className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all flex-grow">
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
                  onClick={() => setEditingListing(null)}
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
