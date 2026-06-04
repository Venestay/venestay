import { CommissionBreakdown } from '@/lib/commission';
import { FieldValue } from 'firebase/firestore';
import { PaymentMethod } from '@/features/auth/types';
import { CancellationPolicyType } from '@/features/listings/types';

export type BookingStatus =
  | 'NEGOTIATING'
  | 'PENDING_PAYMENT'
  | 'AWAITING_VERIFICATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PENDING_APPROVAL'
  | 'EXPIRED'
  | 'CANCELLED_BY_GUEST'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULE_PENDING';

export interface DirectBookingRequestPayload {
  listingId: string;
  listingTitle: string;
  startDate: string;            // ISO 8601
  endDate: string;              // ISO 8601
  guestMessage: string;         // mínimo 20 caracteres
  guestId: string;
  guestName: string;
  hostId: string;
  guestsCount: number;
  anticipoAmount: number;       // calculado en Cloud Function / simulador
  totalAmount: number;          // calculado en Cloud Function / simulador
  paymentMethod: 'ves' | 'usdt';
}

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
  cancellationPolicySnapshot?: CancellationPolicyType;
  bookingMode?: 'instant' | 'request';
  guestMessage?: string;
  hostResponseNote?: string;
  paymentExpiresAt?: string;
  expiresAt?: string;
  hostSelectedPaymentMethod?: PaymentMethod;
  createdAt: string | Date | FieldValue;
  updatedAt: string | Date | FieldValue;
  seasonalAdjustmentFee?: number;
  proposedStartDate?: string;
  proposedEndDate?: string;
  rescheduleNote?: string;
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
