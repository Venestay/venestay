import React, { useRef, useState } from 'react';
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
      if (!tempPaymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempPaymentData.email)) {
        return "El correo de Zelle no es válido";
      }
    }
    if (activePaymentType === 'Transferencia' || activePaymentType === 'PagoMovil') {
      const acc = (tempPaymentData.accountNumber || '').replace(/\s/g, '');
      if (acc.length !== 20) {
        return "La cuenta bancaria debe tener exactamente 20 dígitos";
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
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-auto md:max-w-3xl md:rounded-[40px]"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col md:max-h-[95vh]">
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
            <button type="button" onClick={() => setEditingListing(null)} className="rounded-2xl bg-white/10 p-3 transition-transform hover:bg-white/20 active:scale-95">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="no-scrollbar flex-grow space-y-8 overflow-y-auto p-6 md:p-8">
            {/* 1. Galería */}
            <section className="space-y-4">
              <label className="text-brand-navy/40 ml-1 flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                <span>Galería Visual Premium</span>
                <span className="font-bold text-gray-400">{editingListing.images.length} fotos</span>
              </label>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
                {editingListing.images.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 rounded-lg bg-white/90 p-1 text-red-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="hover:border-brand-500 hover:text-brand-500 flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-all">
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              </div>
            </section>

            {/* 2. Información General (RESTAURADA) */}
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
              
              {/* RESTORATION: Description Field */}
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
                  onChange={(e) => setEditingListing({ ...editingListing, pricePerNight: e.target.value as any })}
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

            {/* 3. Detalles de Edificación (BORDADO CON LOGICA) */}
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
                      onChange={(e) => setEditingListing({ ...editingListing, [item.key]: e.target.value })}
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
                        onChange={(e) => setEditingListing({ ...editingListing, [item.key]: e.target.value })}
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

            {/* 4. Amenidades */}
            <section className="space-y-4">
              <label className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Amenidades</label>
              <div className="flex flex-wrap gap-2">
                {['WiFi', 'A/A', 'Piscina', 'Planta Eléctrica', 'Tanque de Agua', 'Vista al Mar', 'Gimnasio', 'Estacionamiento'].map(amenity => {
                  const isActive = editingListing.amenities?.includes(amenity);
                  return (
                    <button key={amenity} type="button" onClick={() => {
                      const current = editingListing.amenities || [];
                      const next = isActive ? current.filter(a => a !== amenity) : [...current, amenity];
                      setEditingListing({ ...editingListing, amenities: next });
                    }} className={`rounded-full px-5 py-2.5 text-[10px] font-bold transition-all ${isActive ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{amenity}</button>
                  );
                })}
              </div>
            </section>

            {/* 5. Mapa */}
            <section className="space-y-3">
              <div className="relative h-64 overflow-hidden rounded-[32px] border border-gray-100 shadow-inner">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={editingListing.latitude ? { lat: editingListing.latitude, lng: editingListing.longitude! } : LECHERIA_CENTER}
                    zoom={15}
                    onClick={(e) => e.latLng && setEditingListing({ ...editingListing, latitude: e.latLng.lat(), longitude: e.latLng.lng() })}
                    options={DEFAULT_MAP_OPTIONS}
                  >
                    <StandaloneSearchBox onLoad={onSearchBoxLoad} onPlacesChanged={onPlacesChanged}>
                      <input type="text" placeholder="🔍 Buscar dirección..." className="absolute top-4 left-1/2 z-10 w-3/4 -translate-x-1/2 rounded-2xl bg-white/90 p-4 text-xs font-bold shadow-xl outline-none" />
                    </StandaloneSearchBox>
                    {editingListing.latitude && <Marker position={{ lat: editingListing.latitude, lng: editingListing.longitude! }} />}
                  </GoogleMap>
                ) : (
                  <div className="bg-gray-50 flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <p className="text-brand-navy/60 text-xs font-bold">API de Google Maps no disponible</p>
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
                        className="bg-brand-500 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-transform active:scale-95"
                      >
                        Forzar Ubicación (Bypass)
                      </button>
                    </div>
                    <div className="text-[10px] font-black tracking-widest text-gray-300 uppercase animate-pulse mt-2">
                      Esperando Conexión Geoespacial...
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 6. Configuración de Pagos (BLINDADA) */}
            <section className="border-brand-navy/10 space-y-8 rounded-[40px] border bg-gray-50/50 p-8 shadow-sm">
              <div className="text-center">
                <h4 className="text-brand-navy text-[11px] font-black tracking-widest uppercase">Configurar Cobro</h4>
                <p className="mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Validación de precisión bancaria activa</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isActive = activePaymentType === opt.type;
                  const isSaved = editingListing.paymentMethods?.some(m => m.type === opt.type);
                  return (
                    <button key={opt.type} type="button" onClick={() => setActivePaymentType(isActive ? null : opt.type)} className={`group relative flex flex-col items-center gap-3 rounded-[2rem] border-2 p-5 transition-all ${isActive ? 'bg-brand-navy border-brand-navy text-white shadow-xl -translate-y-1' : 'bg-white border-transparent text-brand-navy hover:border-brand-500/20'}`}>
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
                          <div className="space-y-2">
                            <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Titular</label>
                            <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="Nombre del propietario" value={tempPaymentData.accountHolder || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, accountHolder: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Cédula / RIF</label>
                            <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none focus:bg-gray-100" placeholder="V-12345678" value={tempPaymentData.idNumber || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, idNumber: e.target.value})} />
                          </div>
                        </>
                      ) : activePaymentType === 'Zelle' ? (
                        <>
                          <div className="col-span-2 space-y-2">
                            <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Correo Zelle</label>
                            <input type="email" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="nombre@ejemplo.com" value={tempPaymentData.email || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, email: e.target.value})} />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 space-y-2">
                          <label className="text-brand-navy ml-2 text-[9px] font-black tracking-widest uppercase">Binance Pay ID</label>
                          <input type="text" className="w-full rounded-2xl bg-gray-50 px-6 py-4 text-xs font-bold outline-none" placeholder="ID de 9 dígitos" value={tempPaymentData.binanceId || ''} onChange={(e) => setTempPaymentData({...tempPaymentData, binanceId: e.target.value})} />
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={confirmPaymentMethod} className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all">
                      Confirmar {activePaymentType} <ChevronDown className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          <div className="bg-gray-50 shrink-0 border-t border-gray-100 p-6 md:p-8">
            <button type="submit" disabled={isSaving || isUploading} className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy flex w-full items-center justify-center rounded-2xl py-5 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all disabled:opacity-50">
              {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</> : 'Publicar Propiedad'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ListingForm;
