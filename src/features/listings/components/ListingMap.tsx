import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  MAPS_LIBRARIES,
  DEFAULT_MAP_OPTIONS,
  useMapsAuthCheck,
} from '@/lib/maps';
import { MapPin, Globe, ShieldAlert } from 'lucide-react';

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  locationName: string;
  manualAddress?: string;
}

export const ListingMap: React.FC<ListingMapProps> = ({
  latitude,
  longitude,
  locationName,
  manualAddress,
}) => {
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  const mapsAuthError = useMapsAuthCheck();
  const loadError =
    scriptLoadError ||
    (mapsAuthError ? { message: 'ApiTargetBlockedMapError' } : null);

  const defaultLat = 10.2167;
  const defaultLng = -67.95;
  const mapCenter = {
    lat: latitude || defaultLat,
    lng: longitude || defaultLng,
  };

  const handleOpenExternalMap = () => {
    const lat = latitude || defaultLat;
    const lng = longitude || defaultLng;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const markerIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#C5A059" stroke="#0B1120" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  `;

  return (
    <div className="group relative h-96 w-full overflow-hidden rounded-[40px] border-8 border-gray-100 bg-gray-50 shadow-2xl">
      {isLoaded && !loadError ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={15}
          options={DEFAULT_MAP_OPTIONS}
        >
          {latitude && longitude && window.google && (
            <Marker
              position={{ lat: latitude, lng: longitude }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerIconSvg),
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40),
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="bg-brand-navy group/map-error relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20 grayscale invert" />
          <div className="from-brand-navy via-brand-navy/95 to-brand-500/10 absolute inset-0 bg-linear-to-br" />

          <div className="relative z-10 flex max-w-md flex-col items-center">
            <div className="bg-brand-500/10 border-brand-500/20 mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] border shadow-2xl backdrop-blur-xl transition-transform duration-700 group-hover/map-error:scale-110">
              <MapPin className="text-brand-500 h-12 w-12 animate-bounce" />
            </div>

            <h4 className="mb-4 text-2xl font-black tracking-tight text-white">
              Mapa Interactivo
            </h4>
            <p className="mb-10 text-sm leading-relaxed font-medium text-white/70">
              {loadError
                ? loadError.message?.includes('ApiTargetBlockedMapError')
                  ? "El mapa requiere que habilites 'Maps JavaScript API' en tu Google Cloud Console. Mientras tanto, puedes usar la vista externa."
                  : 'Configuración de API pendiente. Verifica tus permisos de Maps en Google Cloud.'
                : 'Preparando vista detallada del sector...'}
            </p>

            <div className="flex w-full flex-col gap-5 sm:flex-row">
              <button
                onClick={handleOpenExternalMap}
                className="bg-brand-500 text-brand-navy flex grow items-center justify-center gap-3 rounded-2xl px-8 py-5 text-xs font-black tracking-widest uppercase shadow-2xl transition-all hover:bg-white active:scale-95"
              >
                Abrir en Google Maps
                <Globe className="h-4 w-4" />
              </button>
            </div>

            {loadError && (
              <div className="mt-10 w-full border-t border-white/10 pt-8">
                <button
                  onClick={() =>
                    window.open(
                      'https://console.cloud.google.com/google/maps-apis/api-list',
                      '_blank'
                    )
                  }
                  className="text-brand-500 mx-auto flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-colors hover:text-white"
                >
                  <ShieldAlert className="h-3 w-3" />
                  Configuración Técnica: Maps JavaScript API
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide overlay on hover */}
      <div className="absolute right-6 bottom-6 left-6 translate-y-4 rounded-3xl border border-white bg-white/90 p-6 opacity-0 shadow-xl backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center justify-between">
          <div className="mr-4">
            <p className="text-brand-500 mb-1 text-[10px] font-black tracking-widest uppercase">
              Dirección Exacta
            </p>
            <p className="text-brand-navy line-clamp-1 text-sm font-black">
              {manualAddress || locationName}
            </p>
          </div>
          <button
            onClick={handleOpenExternalMap}
            className="bg-brand-navy hover:bg-brand-500 hover:text-brand-navy shrink-0 rounded-xl px-5 py-2.5 text-[10px] font-black tracking-widest text-white uppercase transition-all"
          >
            Ver en Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingMap;
