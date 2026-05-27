import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  city: z.preprocess(
    (val) => (val === 'Lecheria' ? 'Lechería' : val),
    z.enum(['Caracas', 'Margarita', 'Falcon', 'Lechería', 'Maracaibo', 'Puerto La Cruz'])
  ),
  location: z.string().optional(),
  pricePerNight: z.coerce.number().positive('El precio debe ser un valor positivo'),
  maxGuests: z.coerce.number().min(1, 'Mínimo 1 huésped'),
  bedrooms: z.coerce.number().min(0),
  beds: z.coerce.number().min(1, 'Mínimo 1 cama'),
  baths: z.coerce.number().min(1, 'Mínimo 1 baño'),
  minNights: z.coerce.number().min(2, 'La estadía mínima debe ser de al menos 2 noches').default(2),
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
  nearbyActivities: z.string().optional(),
  manualAddress: z.string().optional(),
  environmentPhotos: z.record(z.string(), z.string()).optional(),
  isVerified: z.boolean().default(true),
  isPetFriendly: z.boolean().default(false),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).default('moderate'),
  paymentMethods: z.array(z.discriminatedUnion('type', [
    z.object({
      id: z.string(),
      type: z.literal('Zelle'),
      label: z.string(),
      isVerified: z.boolean(),
      data: z.object({
        accountHolder: z.string().min(3, "El titular debe tener al menos 3 caracteres"),
        email: z.string().email("Correo de Zelle inválido"),
      })
    }),
    z.object({
      id: z.string(),
      type: z.literal('Binance'),
      label: z.string(),
      isVerified: z.boolean(),
      data: z.object({
        binanceId: z.string().min(6, "El ID de Binance debe tener al menos 6 caracteres"),
        email: z.string().email("Correo de Binance inválido"),
      })
    }),
    z.object({
      id: z.string(),
      type: z.literal('PagoMovil'),
      label: z.string(),
      isVerified: z.boolean(),
      data: z.object({
        bankName: z.string().min(1, "Debe especificar el banco"),
        accountHolder: z.string().min(1, "Debe especificar el titular"),
        idNumber: z.string().regex(/^[VJEG]-?\d{7,10}$/i, "Cédula/RIF inválido"),
        phoneNumber: z.string().regex(/^(0414|0424|0412|0416|0426)-?\d{7}$/, "Teléfono inválido"),
      })
    }),
    z.object({
      id: z.string(),
      type: z.literal('Transferencia'),
      label: z.string(),
      isVerified: z.boolean(),
      data: z.object({
        bankName: z.string().min(1, "Debe especificar el banco"),
        accountHolder: z.string().min(1, "Debe especificar el titular"),
        idNumber: z.string().regex(/^[VJEG]-?\d{7,10}$/i, "Cédula/RIF inválido"),
        accountType: z.string().min(1, "Debe especificar el tipo de cuenta"),
        accountNumber: z.string().length(20, "La cuenta debe tener 20 dígitos"),
      })
    }),
    z.object({
      id: z.string(),
      type: z.literal('Otro'),
      label: z.string(),
      isVerified: z.boolean(),
      data: z.object({
        otherName: z.string().min(2, "Debe ingresar el nombre del método de pago"),
        email: z.string().email().optional().or(z.literal('')),
        otherDetails: z.string().optional(),
      }).refine(data => data.email || (data.otherDetails && data.otherDetails.trim().length > 0), { message: 'Debe proveer un correo o detalles de la cuenta' })
    }),
  ])).default([]),
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
