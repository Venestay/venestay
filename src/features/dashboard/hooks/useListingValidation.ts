import { useState, useCallback } from 'react';
import { z } from 'zod';
import { listingSchema, ListingSchema } from '../types/dashboard.schema';

export type FormErrors = Partial<Record<keyof ListingSchema, string>>;

export type FieldValidation<T> = {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
};

export type FormStepState =
  | { step: 1; data: Partial<Pick<ListingSchema, 'title' | 'description' | 'pricePerNight' | 'city' | 'maxGuests' | 'bedrooms' | 'beds' | 'baths' | 'buildingFloors' | 'propertyFloor' | 'constructionYear' | 'minNights'>> }
  | { step: 2; data: Partial<Pick<ListingSchema, 'images' | 'environmentPhotos'>> }
  | { step: 3; data: Partial<Pick<ListingSchema, 'latitude' | 'longitude' | 'manualAddress'>> }
  | { step: 4; data: Partial<Pick<ListingSchema, 'paymentMethods'>> };

export const useListingValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(<K extends keyof ListingSchema>(field: K, value: unknown) => {
    try {
      const fieldSchema = listingSchema.shape[field];
      if (!fieldSchema) return;

      fieldSchema.parse(value);
      
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.issues?.[0]?.message || 'Valor inválido',
        }));
      }
    }
  }, []);

  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateStep = useCallback((stepState: FormStepState): boolean => {
    const { step, data } = stepState;
    const newErrors: FormErrors = {};
    let isValid = true;
    
    const fieldsToValidate = Object.keys(data) as Array<keyof typeof data>;

    fieldsToValidate.forEach((field) => {
      try {
        const fieldSchema = listingSchema.shape[field as keyof typeof listingSchema.shape];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
          delete newErrors[field];
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors[field as keyof ListingSchema] = error.issues?.[0]?.message || 'Valor inválido';
          isValid = false;
        }
      }
    });

    if (step === 1) {
      const propertyFloor = Number(data.propertyFloor || 0);
      const buildingFloors = Number(data.buildingFloors || 0);
      if (propertyFloor > buildingFloors) {
        newErrors['propertyFloor'] = "El piso del alojamiento no puede ser mayor que el total de pisos del edificio";
        isValid = false;
      }
    }

    if (step === 2) {
      const imagesLength = data.images?.length || 0;
      const envPhotosLength = Object.keys(data.environmentPhotos || {}).length;
      if (imagesLength === 0 && envPhotosLength === 0) {
        newErrors['images'] = "Debes subir al menos una imagen a la galería";
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
      fieldsToValidate.forEach(f => delete next[f]);
      return { ...next, ...newErrors };
    });
    
    const newTouched = { ...touched };
    fieldsToValidate.forEach(f => newTouched[f as string] = true);
    setTouched(newTouched);

    return isValid;
  }, [touched]);

  const isStepValid = useCallback((stepState: FormStepState): boolean => {
    const { step, data } = stepState;
    let isValid = true;
    const fieldsToValidate = Object.keys(data) as Array<keyof typeof data>;

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
      if (propertyFloor > buildingFloors) isValid = false;
    }

    if (step === 2) {
      const imagesLength = data.images?.length || 0;
      const envPhotosLength = Object.keys(data.environmentPhotos || {}).length;
      if (imagesLength === 0 && envPhotosLength === 0) isValid = false;
    }

    if (step === 3) {
      if (!data.latitude || !data.longitude) isValid = false;
    }

    if (step === 4) {
      if (!data.paymentMethods || data.paymentMethods.length === 0) isValid = false;
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
