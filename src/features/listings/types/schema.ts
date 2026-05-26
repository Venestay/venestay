import { z } from 'zod';

export const ListingSchema = z.object({
  id: z.string(),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  city: z.preprocess(
    (val) => (val === 'Lecheria' ? 'Lechería' : val),
    z.enum(['Caracas', 'Margarita', 'Falcon', 'Lechería', 'Maracaibo', 'All', 'Petfriendly', 'Puerto La Cruz'])
  ),
  location: z.string(),
  pricePerNight: z.number().positive(),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().min(0),
  images: z.array(z.string()).min(1, "Debe tener al menos una imagen"),
  amenities: z.array(z.string()),
  maxGuests: z.number().int().positive(),
  bedrooms: z.number().int().min(0),
  beds: z.number().int().min(0),
  baths: z.number().min(0),
  hostName: z.string(),
  hostAvatar: z.string().url(),
  hostId: z.string(),
  isVerified: z.boolean(),
  isPetFriendly: z.boolean(),
  blockedDates: z.array(z.string()).optional(),
  paymentInstructions: z.string().optional(),
  minNights: z.number().int().positive().optional(),
  maxNights: z.number().int().positive().optional(),
  propertyType: z.string().optional(),
  accommodationType: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  paymentMethods: z.array(z.any()).optional(),
  bankDetails: z.object({
    bankName: z.string(),
    accountHolder: z.string(),
    accountNumber: z.string(),
    idNumber: z.string(),
    phoneNumber: z.string().optional(),
  }).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).optional().default('moderate'),
});

export type ValidatedListing = z.infer<typeof ListingSchema>;


