export type UserRole = 'user' | 'host' | 'admin';
export type CurrencyPreference = 'USD' | 'VES';
export type TravelInterest = 'Playa' | 'Mascotas' | 'Trabajo' | 'Lujo' | 'Aventura' | 'Ciudad';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: any; // Firestore timestamp or string
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isIdentityVerified?: boolean;
  
  // Pasaporte VeneStay / Identity
  bio?: string;
  trustScore?: number;
  currency?: CurrencyPreference;
  selectedInterests?: TravelInterest[];
  
  // Notification Channels
  notifications?: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };

  // Financial Engine
  paymentMethods?: any[]; // Avoiding circular import if possible, using any for now or importing specifically

  // Host Info
  location?: string;
  responseTime?: string;
  responseRate?: string;
}




