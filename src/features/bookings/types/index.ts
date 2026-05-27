import { CommissionBreakdown } from '@/lib/commission';
import { FieldValue } from 'firebase/firestore';

export type BookingStatus =
  | 'NEGOTIATING'
  | 'PENDING_PAYMENT'
  | 'AWAITING_VERIFICATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PENDING_APPROVAL'
  | 'EXPIRED';

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  guestId: string;
  guestName: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  agreedPercentage: number;
  status: BookingStatus;
  financials?: CommissionBreakdown;
  proofUrl?: string;
  paymentReference?: string;
  paymentSubmittedAt?: string;
  paymentInstructions?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  guests: number;
  isDraft?: boolean;
  cancellationPolicySnapshot?: 'flexible' | 'moderate' | 'strict';
  bookingMode?: 'instant' | 'request';
  guestMessage?: string;
  hostResponseNote?: string;
  expiresAt?: string;
  createdAt: string | Date | FieldValue;
  updatedAt: string | Date | FieldValue;
  statusHistory?: {
    status: BookingStatus;
    timestamp: string | Date | FieldValue;
    actorId: string;
    actorName: string;
    note?: string;
  }[];
}

export interface BookingDetails {
  id: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  guests: number;
  totalAmount?: number;
  paymentInstructions?: string;
}

export interface PaymentLog {
  id?: string;
  bookingId: string;
  amount: number;
  reference: string;
  proofUrl: string;
  method: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string | Date;
}





export interface UCPTransactionPayload {
  transactionId: string;
  intent: 'escrow_deposit';
  currency: 'USD' | 'VES';
  amounts: {
    total: number;
    depositRequired: number; // 20%
    offlineBalance: number; // 80%
  };
  metadata: { agenticReady: true };
}
