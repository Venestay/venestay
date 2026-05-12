import { useState, useCallback } from 'react';
import { z } from 'zod';
import { listingSchema } from '../types/dashboard.schema';

export type FormErrors = Record<string, string>;

export const useListingValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: string, value: any) => {
    try {
      // Obtenemos el esquema para el campo específico
      // Nota: listingSchema es un objeto ZodObject
      const fieldSchema = (listingSchema.shape as any)[field];
      
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
          [field]: error.errors[0].message,
        }));
      }
    }
  }, []);

  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateStep = useCallback((step: number, data: any) => {
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
      // Los pasos 3 y 4 se validarán según sea necesario en el futuro
    };

    const fieldsToValidate = stepFields[step] || [];
    const newErrors: FormErrors = {};
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      try {
        const fieldSchema = (listingSchema.shape as any)[field];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors[field] = error.errors[0].message;
          isValid = false;
        }
      }
    });

    // Validaciones refinadas (como propertyFloor <= buildingFloors)
    if (step === 1) {
      if (data.propertyFloor > data.buildingFloors) {
        newErrors['propertyFloor'] = "El piso del alojamiento no puede ser mayor que el total de pisos del edificio";
        isValid = false;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    
    // Marcamos todos los campos del paso como tocados para mostrar errores
    const newTouched = { ...touched };
    fieldsToValidate.forEach(f => newTouched[f] = true);
    setTouched(newTouched);

    return isValid;
  }, [touched]);

  const isStepValid = useCallback((step: number, data: any) => {
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
    };

    const fieldsToValidate = stepFields[step] || [];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      try {
        const fieldSchema = (listingSchema.shape as any)[field];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
        }
      } catch (error) {
        isValid = false;
      }
    });

    if (step === 1) {
      if (data.propertyFloor > data.buildingFloors) {
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
