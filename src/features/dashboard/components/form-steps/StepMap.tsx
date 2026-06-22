import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { GoogleMap, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { useListingForm } from '../ListingFormContext';

const StepMap: React.FC = () => {
  const { editingListing, setEditingListing, validation, isLoaded, LECHERIA_CENTER, DEFAULT_MAP_OPTIONS } = useListingForm();
  const { errors } = validation;
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepContainerRef.current?.focus();
  }, []);

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
          setEditingListing(prev => prev ? {
            ...prev,
            latitude: location.lat(),
            longitude: location.lng(),
            location: place.formatted_address || prev.location,
            manualAddress: place.formatted_address || prev.manualAddress
          } : null);
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

  return (
    <motion.div 
      key="step3" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="space-y-6"
      ref={stepContainerRef}
      tabIndex={-1}
      aria-label="Paso 3: Ubicación de la propiedad"
    >
      <div className="text-center">
        <h4 className="text-brand-navy text-lg font-black tracking-tight">Ubicación de la Propiedad</h4>
        <p className="text-gray-400 text-xs mt-1">Verifica la dirección exacta en el mapa</p>
      </div>

      {errors.latitude && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-500 border border-red-100" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-[10px] font-black uppercase tracking-widest">{errors.latitude}</p>
        </div>
      )}

      <div className="relative h-[400px] overflow-hidden rounded-[32px] border border-gray-100 shadow-inner">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={editingListing.latitude ? { lat: editingListing.latitude, lng: editingListing.longitude! } : LECHERIA_CENTER}
            zoom={15}
            onClick={(e) => e.latLng && setEditingListing(prev => prev ? { ...prev, latitude: e.latLng!.lat(), longitude: e.latLng!.lng() } : null)}
            options={DEFAULT_MAP_OPTIONS}
          >
            <StandaloneSearchBox onLoad={onSearchBoxLoad} onPlacesChanged={onPlacesChanged}>
              <input 
                type="text" 
                placeholder="🔍 Buscar dirección..." 
                aria-label="Buscar dirección en el mapa"
                className="absolute top-4 left-1/2 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-2xl bg-white/95 p-4 text-xs font-bold shadow-xl outline-none border border-gray-100 focus-visible:ring-4 focus-visible:ring-brand-500 min-h-[44px]" 
              />
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
          <div className="bg-gray-50 flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center" role="alert" aria-live="polite">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <p className="text-brand-navy text-sm font-black">API de Google Maps no disponible</p>
              <p className="text-gray-400 text-xs font-medium max-w-xs mx-auto mb-4">Usa el botón de bypass temporal para forzar las coordenadas en Lechería mientras se restablece el servicio.</p>
              <button
                id="bypass-maps-btn"
                type="button"
                onClick={() => {
                  setEditingListing(prev => prev ? {
                    ...prev,
                    latitude: 10.2167,
                    longitude: -67.95,
                    location: 'Lechería (Bypass)',
                  } : null);
                  toast.success('Bypass Activado: Ubicación establecida en Lechería');
                }}
                className="bg-brand-500 hover:bg-brand-600 rounded-xl px-6 py-3 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-transform active:scale-95 min-h-[44px]"
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
          <label htmlFor="listing-manual-address" className="text-brand-navy/40 ml-1 text-[10px] font-black tracking-widest uppercase">Dirección Detallada / Punto de Referencia</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative grow">
              <input
                id="listing-manual-address"
                type="text"
                className="text-brand-navy focus:border-brand-500 w-full rounded-2xl border border-gray-100 bg-white px-6 py-4 text-xs font-bold outline-none shadow-sm min-h-[44px]"
                value={editingListing.manualAddress || ''}
                onChange={(e) => setEditingListing(prev => prev ? { ...prev, manualAddress: e.target.value } : null)}
                onBlur={handleGeocodeManualAddress}
                placeholder="Ej: Edificio Yacht Club, frente al Bodegón X..."
                aria-describedby="manual-address-help"
              />
            </div>
            <button
              type="button"
              onClick={handleGeocodeManualAddress}
              className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest text-white uppercase transition-all shadow-md active:scale-95 min-h-[44px]"
            >
              Ubicar
            </button>
          </div>
          <p id="manual-address-help" className="text-[9px] font-medium text-gray-400 mt-1 ml-1 italic">
            * Puedes escribir la dirección y presionar "Ubicar" o arrastrar el ícono de la casa en el mapa.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StepMap;
