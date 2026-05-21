# Especificación Técnica (v2.2.0): Sincronización de Borradores (useDraftSync)

Esta especificación describe el diseño del custom hook **`useDraftSync`** desarrollado para dar resiliencia de datos ante cortes eléctricos o de red en el ecosistema **VeneStay**.

---

## 1. Objetivo del Hook
Evitar la frustración del anfitrión y la pérdida de conversión guardando automáticamente el progreso del formulario de 4 pasos de manera local en el navegador del usuario de forma transparente.

---

## 2. Comportamiento y Reglas de Negocio

### 2.1. Persistencia Debounceada
*   El hook escucha de forma reactiva los cambios del estado local del formulario de publicación de propiedades.
*   Aplica un retraso (debounce) de **500ms** antes de escribir en el `localStorage` del navegador. Esto evita saturar el hilo principal y disminuye el impacto en dispositivos móviles de recursos limitados.

### 2.2. Recuperación al Montar
*   Al montarse el Wizard del formulario, el hook evalúa si existe un borrador de sesión con la clave `venestay_listing_draft_v2`.
*   El borrador caduca automáticamente a las **48 horas** de su creación. Si el borrador está vigente, se inyectan los datos recuperados en el formulario y se dispara un aviso premium en la interfaz (Toaster): *"Hemos recuperado tu borrador guardado automáticamente de forma segura."*

### 2.3. Blindaje contra Fugas de Información (FSD-lite Security Filter)
*   **REGLA CRÍTICA DE PRIVACIDAD:** Para prevenir vectores de ataque de inyección XSS que puedan comprometer información bancaria guardada en el cliente, el hook aplica un filtro estricto sobre las propiedades del formulario antes de serializar.
*   **Campos Permitidos para Almacenamiento:** Título, descripción, dormitorios, baños, camas, capacidad de huéspedes, check-in/out, reglas de la casa descriptivas, URLs temporales de fotos, latitud y longitud.
*   **Campos Prohibidos (Descartados Automáticamente):** `depositAmount`, `paymentMethods`, `bankDetails`, correos de Zelle o cuentas de Binance. Estos campos jamás deben tocar el `localStorage`.

---

## 3. Implementación Conceptual (TypeScript)
```typescript
import { useEffect, useRef } from 'react';
import { ListingSchema } from '../types/dashboard.schema';

const STORAGE_KEY = 'venestay_listing_draft_v2';
const DEBOUNCE_DELAY = 500;

export const useDraftSync = (formData: Partial<ListingSchema>, step: number, isResetting: boolean = false) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isResetting) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      // Filtrado estricto para evitar almacenamiento de datos financieros sensibles
      const secureDraft: Partial<ListingSchema> = {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        location: formData.location,
        maxGuests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        baths: formData.baths,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        houseRules: formData.houseRules,
        images: formData.images,
        latitude: formData.latitude,
        longitude: formData.longitude,
        manualAddress: formData.manualAddress
        // Se descartan explícitamente depositAmount y bankDetails
      };

      const payload = {
        data: secureDraft,
        step,
        timestamp: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [formData, step, isResetting]);
};
```
