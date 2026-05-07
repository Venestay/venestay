import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  city: z.enum(['Caracas', 'Margarita', 'Falcon', 'Lechería', 'Maracaibo', 'Puerto La Cruz']),
  location: z.string().min(5, 'La ubicación es obligatoria'),
  pricePerNight: z.coerce.number().positive('El precio debe ser un valor positivo'),
  maxGuests: z.coerce.number().min(1, 'Mínimo 1 huésped'),
  bedrooms: z.coerce.number().min(0),
  beds: z.coerce.number().min(1, 'Mínimo 1 cama'),
  baths: z.coerce.number().min(1, 'Mínimo 1 baño'),
  minNights: z.coerce.number().min(1).default(1),
  maxNights: z.coerce.number().min(1).default(30),
  propertyType: z.string().default('Apartamento'),
  accommodationType: z.string().default('Alojamiento entero'),
  buildingFloors: z.coerce.number().min(1, 'Mínimo 1 piso'),
  propertyFloor: z.coerce.number().min(0),
  constructionYear: z.coerce.number().min(1900).max(new Date().getFullYear()).default(2024),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).min(1, 'Debes subir al menos una imagen'),
  amenities: z.array(z.string()).default([]),
  isVerified: z.boolean().default(true),
  isPetFriendly: z.boolean().default(false),
  paymentMethods: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    isVerified: z.boolean(),
    data: z.record(z.string(), z.any()).refine((data: Record<string, any>) => {
      // Validaciones específicas por método
      if (data.email && typeof data.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return false;
      if (data.accountNumber && typeof data.accountNumber === 'string' && data.accountNumber.replace(/\s/g, '').length !== 20) return false;
      return true;
    }, { message: 'Formato de datos de pago inválido' })
  })).default([]),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
    accountNumber: z.string().optional(),
    idNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
  }).optional(),
  paymentInstructions: z.string().optional(),
}).refine((data) => data.propertyFloor <= data.buildingFloors, {
  message: "El piso del alojamiento no puede ser mayor que el total de pisos del edificio",
  path: ["propertyFloor"],
});

export type ListingSchema = z.infer<typeof listingSchema>;
