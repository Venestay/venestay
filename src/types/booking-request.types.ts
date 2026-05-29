import { Timestamp } from 'firebase/firestore';

export type BookingRequestStatus =
  | 'pending_host'
  | 'pending_payment'
  | 'awaiting_verification'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'cancelled_by_guest';

export interface BookingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  hostId: string;
  guestId: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  nights: number;
  guestCount: number;
  paymentMethod: 'ves' | 'usdt';
  totalAmount: number;
  anticipoAmount: number;
  remainingAmount: number;
  status: BookingRequestStatus;
  guestMessage: string;
  paymentProofUrl?: string;
  paymentReference?: string;
  hostResponse?: 'approved' | 'rejected';
  hostResponseNote?: string;
  hasDateConflict?: boolean;          // calculado al abrir el drawer
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingRequestAction {
  type: 'approve' | 'reject';
  requestId: string;
  hostNote?: string;
}
