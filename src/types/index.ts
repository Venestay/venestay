export * from '@/features/auth/types';
export * from '@/features/bookings/types';
export * from '@/features/listings/types';

export type PaymentMethodType =
  | 'Zelle'
  | 'Binance'
  | 'PagoMovil'
  | 'Transferencia';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  isVerified: boolean;
  data: {
    email?: string;
    accountHolder: string;
    bankName?: string;
    accountNumber?: string;
    idNumber?: string;
    phoneNumber?: string;
    binanceId?: string;
  };
}

export interface LocalInsight {
  city: string;
  tips: string;
  loading: boolean;
}

export interface ExchangeRates {
  bcv: number;
  p2p: number;
  lastUpdated: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  type: 'text' | 'image';
  status: 'sent' | 'read';
  createdAt: string | Date;
}



