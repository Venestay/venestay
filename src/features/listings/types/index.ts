import { PaymentMethod } from '@/types';

export type City =
  | 'Caracas'
  | 'Margarita'
  | 'Falcon'
  | 'Lechería'
  | 'Maracaibo'
  | 'All'
  | 'Petfriendly'
  | 'Puerto La Cruz';


export interface Listing {
  id: string;
  title: string;
  description: string;
  city: City;
  location: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  amenities: string[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  hostName: string;
  hostAvatar: string;
  hostId: string;
  isVerified: boolean;
  isPetFriendly: boolean;
  blockedDates?: string[];
  paymentInstructions?: string;
  createdAt?: any;
  updatedAt?: any;
  minNights?: number;
  maxNights?: number;
  propertyType?: string;
  accommodationType?: string;
  buildingFloors?: number;
  propertyFloor?: number;
  constructionYear?: number;
  latitude?: number;
  longitude?: number;
  nearbyActivities?: string;
  manualAddress?: string;
  environmentPhotos?: Record<string, string>;
  paymentMethods?: PaymentMethod[];
  isPublishedFromDashboard?: boolean;
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    idNumber: string;
    phoneNumber?: string; // Pago Móvil
  };
}




