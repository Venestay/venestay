export * from '@/features/auth/types';
export * from '@/features/bookings/types';
export * from '@/features/listings/types';
export * from './booking-request.types';



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
  recipientId?: string;
  text?: string;
  imageUrl?: string;
  type: 'text' | 'image';
  status: 'sent' | 'read';
  /** Marcado como true por Cloud Function tras enviar email de notificación al destinatario. Anti-spam: solo se notifica por el primer mensaje del hilo. */
  emailNotified?: boolean;
  createdAt: string | Date;
}



