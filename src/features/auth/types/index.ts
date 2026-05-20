import { FieldValue } from 'firebase/firestore';

export type UserRole = 'user' | 'host' | 'admin';
export type CurrencyPreference = 'USD' | 'VES';
export type TravelInterest = 'Playa' | 'Mascotas' | 'Trabajo' | 'Lujo' | 'Aventura' | 'Ciudad';

export type PaymentMethodType =
  | 'Zelle'
  | 'Binance'
  | 'PagoMovil'
  | 'Transferencia'
  | 'Otro';

export type KYCStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  isVerified: boolean;
  data: {
    email?: string;
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    idNumber?: string;
    phoneNumber?: string;
    binanceId?: string;
    otherName?: string;
    otherDetails?: string;
  };
}

export type LoyaltyTierType = 'BRONCE' | 'PLATA' | 'ORO';

export interface HostLoyaltyStats {
  completedRentalsCount: number;
  rollingTwelveMonthsGMV: number;
  currentCommissionRate: 0.12 | 0.10 | 0.08;
  averageRating: number;
  loyaltyTier: LoyaltyTierType;
  lastRecalculatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  createdAt: string | number | Date | { seconds: number; nanoseconds: number } | FieldValue;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isIdentityVerified?: boolean;
  kycStatus?: KYCStatus;
  isVerified?: boolean;
  
  // Pasaporte VeneStay / Identity
  bio?: string;
  about?: string;
  trustScore?: number;
  currency?: CurrencyPreference;
  selectedInterests?: TravelInterest[];
  interests?: string;
  languages?: string[];
  
  // Notification Channels
  notifications?: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };

  // Financial Engine
  paymentMethods?: PaymentMethod[];

  // Host Info
  location?: string;
  responseTime?: string;
  responseRate?: string;

  // Host Loyalty (v2.3.0)
  loyaltyStats?: HostLoyaltyStats;
  currentCommissionRate?: number;
}





