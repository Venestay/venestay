import { useState, useCallback } from 'react';
import { z } from 'zod';
import { listingSchema } from '../types/dashboard.schema';

export type FormErrors = Record<string, string>;

export const useListingValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: keyof typeof listingSchema.shape, value: unknown) => {
    try {
      const fieldSchema = listingSchema.shape[field];
      
      if (!fieldSchema) return;

      fieldSchema.parse(value);
      
      // Si pasa la validación, eliminamos el error
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.errors?.[0]?.message || 'Valor inválido',
        }));
      }
    }
  }, []);

  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateStep = useCallback((step: number, data: Record<string, unknown>) => {
    const stepFields: Record<number, string[]> = {
      1: [
        'title', 
        'description', 
        'pricePerNight', 
        'city', 
        'maxGuests', 
        'bedrooms', 
        'beds', 
        'baths', 
        'buildingFloors', 
        'propertyFloor', 
        'constructionYear'
      ],
      2: ['images'],
      3: ['latitude', 'longitude', 'manualAddress'],
      4: ['paymentMethods'],
    };

    const fieldsToValidate = stepFields[step] || [];
    const newErrors: FormErrors = {};
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      try {
        const fieldSchema = listingSchema.shape[field as keyof typeof listingSchema.shape];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
          // Si pasa la validación individual, lo quitamos de los nuevos errores
          delete newErrors[field];
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors[field] = error.errors?.[0]?.message || 'Valor inválido';
          isValid = false;
        }
      }
    });

    // Validaciones refinadas
    if (step === 1) {
      const propertyFloor = Number(data.propertyFloor || 0);
      const buildingFloors = Number(data.buildingFloors || 0);
      if (propertyFloor > buildingFloors) {
        newErrors['propertyFloor'] = "El piso del alojamiento no puede ser mayor que el total de pisos del edificio";
        isValid = false;
      }
    }
    
    if (step === 3) {
      if (!data.latitude || !data.longitude) {
        newErrors['latitude'] = "Debe especificar la ubicación en el mapa";
        isValid = false;
      }
    }

    if (step === 4) {
      if (!data.paymentMethods || data.paymentMethods.length === 0) {
        newErrors['paymentMethods'] = "Debe agregar al menos un método de pago";
        isValid = false;
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      // Limpiamos los errores de los campos que estamos validando en este paso
      fieldsToValidate.forEach(f => delete next[f]);
      // Añadimos los nuevos errores encontrados
      return { ...next, ...newErrors };
    });
    
    // Marcamos todos los campos del paso como tocados para mostrar errores
    const newTouched = { ...touched };
    fieldsToValidate.forEach(f => newTouched[f] = true);
    setTouched(newTouched);

    return isValid;
  }, [touched]);

  const isStepValid = useCallback((step: number, data: Record<string, unknown>) => {
    const stepFields: Record<number, string[]> = {
      1: [
        'title', 
        'description', 
        'pricePerNight', 
        'city', 
        'maxGuests', 
        'bedrooms', 
        'beds', 
        'baths', 
        'buildingFloors', 
        'propertyFloor', 
        'constructionYear'
      ],
      2: ['images'],
      3: ['latitude', 'longitude', 'manualAddress'],
      4: ['paymentMethods'],
    };

    const fieldsToValidate = stepFields[step] || [];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      try {
        const fieldSchema = listingSchema.shape[field as keyof typeof listingSchema.shape];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
        }
      } catch {
        isValid = false;
      }
    });

    if (step === 1) {
      const propertyFloor = Number(data.propertyFloor || 0);
      const buildingFloors = Number(data.buildingFloors || 0);
      if (propertyFloor > buildingFloors) {
        isValid = false;
      }
    }

    if (step === 3) {
      if (!data.latitude || !data.longitude) {
        isValid = false;
      }
    }

    if (step === 4) {
      if (!data.paymentMethods || data.paymentMethods.length === 0) {
        isValid = false;
      }
    }

    return isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    setFieldTouched,
    validateStep,
    isStepValid,
    clearErrors,
  };
};
