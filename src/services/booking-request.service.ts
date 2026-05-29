import { 
  doc, 
  runTransaction, 
  serverTimestamp,
  collection
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingStatus } from '@/types';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Service to manage Booking Request approvals and rejections.
 * Implements the Hybrid Switchable Approach:
 * - Local mode: Uses client-side Firestore transactions (runTransaction) for development.
 * - Cloud Functions mode: Calls secure backend endpoints for production.
 */

// Read switch configuration from environment
const USE_CLOUD_FUNCTIONS = import.meta.env.VITE_USE_CLOUD_FUNCTIONS === 'true';

/**
 * Approves a booking request.
 * Transitions status:
 * - From PENDING_APPROVAL to AWAITING_VERIFICATION (if paymentProofUrl/reference exists)
 * - From PENDING_APPROVAL to PENDING_PAYMENT (if no proof exists)
 */
export const approveBookingRequest = async (requestId: string, hostNote?: string): Promise<void> => {
  if (USE_CLOUD_FUNCTIONS) {
    const functions = getFunctions();
    const approveFn = httpsCallable<{ requestId: string; hostNote?: string }, void>(
      functions, 
      'approveBookingRequest'
    );
    await approveFn({ requestId, hostNote });
    return;
  }

  // Local simulation fallback: run transaction client-side
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', requestId);
    const bookingSnap = await transaction.get(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('La solicitud de reserva no existe.');
    }

    const booking = bookingSnap.data() as Booking;

    if (booking.status !== 'PENDING_APPROVAL') {
      throw new Error(`No se puede aprobar una solicitud en estado: ${booking.status}`);
    }

    // Determine next status based on proof of payment existence
    const nextStatus: BookingStatus = (booking.proofUrl || booking.paymentReference)
      ? 'AWAITING_VERIFICATION'
      : 'PENDING_PAYMENT';

    const nowStr = new Date().toISOString();
    const historyEntry = {
      status: nextStatus,
      timestamp: nowStr,
      actorId: booking.ownerId || 'host',
      actorName: 'Anfitrión',
      note: hostNote || 'Solicitud de reserva aprobada por el anfitrión.',
    };

    transaction.update(bookingRef, {
      status: nextStatus,
      hostResponseNote: hostNote || '',
      updatedAt: serverTimestamp(),
      statusHistory: [...(booking.statusHistory || []), historyEntry],
    });
  });
};

/**
 * Rejects a booking request.
 * Transitions status:
 * - From PENDING_APPROVAL to REJECTED
 * - Releases/deletes blocked dates for the corresponding listing.
 */
export const rejectBookingRequest = async (requestId: string, hostNote: string): Promise<void> => {
  if (USE_CLOUD_FUNCTIONS) {
    const functions = getFunctions();
    const rejectFn = httpsCallable<{ requestId: string; hostNote: string }, void>(
      functions, 
      'rejectBookingRequest'
    );
    await rejectFn({ requestId, hostNote });
    return;
  }

  // Local simulation fallback: run transaction client-side
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', requestId);
    const bookingSnap = await transaction.get(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('La solicitud de reserva no existe.');
    }

    const booking = bookingSnap.data() as Booking;

    if (booking.status !== 'PENDING_APPROVAL') {
      throw new Error(`No se puede rechazar una solicitud en estado: ${booking.status}`);
    }

    const nowStr = new Date().toISOString();
    const historyEntry = {
      status: 'REJECTED' as BookingStatus,
      timestamp: nowStr,
      actorId: booking.ownerId || 'host',
      actorName: 'Anfitrión',
      note: hostNote,
    };

    // Update status to REJECTED
    transaction.update(bookingRef, {
      status: 'REJECTED',
      rejectionReason: hostNote,
      hostResponseNote: hostNote,
      updatedAt: serverTimestamp(),
      statusHistory: [...(booking.statusHistory || []), historyEntry],
    });

    // Release soft-blocked dates in the listing if listingId exists
    if (booking.listingId) {
      const listingRef = doc(db, 'listings', booking.listingId);
      const listingSnap = await transaction.get(listingRef);
      if (listingSnap.exists()) {
        const listingData = listingSnap.data();
        let blockedDates: string[] = listingData.blockedDates || [];

        // If the listing blocks dates for this booking, we filter them out.
        // Usually, soft-blocked dates are calculated or stored in an array.
        // We ensure we remove the dates corresponding to this booking request.
        if (booking.startDate && booking.endDate) {
          // Simplistic date filtering if dates are stored as ISO string array
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          const datesToRemove: string[] = [];
          
          let current = new Date(start);
          while (current <= end) {
            datesToRemove.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }

          blockedDates = blockedDates.filter(d => !datesToRemove.includes(d));
          transaction.update(listingRef, {
            blockedDates,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
  });
};
