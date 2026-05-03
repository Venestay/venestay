import { useState, useEffect } from 'react';
import { Libraries } from '@react-google-maps/api';

// Requerido: API Key con "Maps JavaScript API" habilitada en Google Cloud Console.
// Sin esta API habilitada, recibirás el error "ApiTargetBlockedMapError".
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Prevenir que errores de inicialización de Google Maps rompan pruebas o la consola.
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('Google Maps JavaScript API error')
    ) {
      return; // Ignore API blocked errors gracefully
    }
    originalError(...args);
  };

  (window as unknown as Record<string, unknown>).gm_authFailure = () => {
    console.warn(
      'Google Maps Authentication Failure: SDK configuration is restricted or invalid.'
    );
    (window as unknown as Record<string, unknown>)._mapsAuthErrorOccurred = true;
    window.dispatchEvent(new Event('google-maps-auth-failure'));
  };
}

export const useMapsAuthCheck = () => {
  const [authError, setAuthError] = useState(
    typeof window !== 'undefined'
      ? !!(window as unknown as Record<string, unknown>)._mapsAuthErrorOccurred
      : false
  );

  useEffect(() => {
    const handleError = () => setAuthError(true);
    window.addEventListener('google-maps-auth-failure', handleError);
    return () =>
      window.removeEventListener('google-maps-auth-failure', handleError);
  }, []);

  return authError;
};

export const MAPS_LIBRARIES: Libraries = ['places', 'geometry'];

export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road.local',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    },
  ],
};


