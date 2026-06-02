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

import { query, where, getDocs, setDoc, DocumentReference, DocumentData } from 'firebase/firestore';

/**
 * Verifica si dos rangos de fechas se solapan.
 */
const checkDatesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return Math.max(s1, s2) <= Math.min(e1, e2);
};

/**
 * Approves a booking request with payment details and prevents race conditions.
 * Transitions status:
 * - From PENDING_APPROVAL to PENDING_PAYMENT
 * - Auto-rejects overlapping requests.
 */
export const approveBookingRequestWithDetails = async (
  requestId: string, 
  hostNote: string,
  paymentInstructions: string,
  hostId: string
): Promise<void> => {
  if (USE_CLOUD_FUNCTIONS) {
    const functions = getFunctions();
    const approveFn = httpsCallable<{ requestId: string; hostNote: string; paymentInstructions: string; hostId: string }, void>(
      functions, 
      'approveBookingRequestWithDetails'
    );
    await approveFn({ requestId, hostNote, paymentInstructions, hostId });
    return;
  }

  // Pre-fetch all PENDING_APPROVAL bookings to check for collisions
  const bookingsCol = collection(db, 'bookings');
  
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

    // Identify collisions: overlapping dates for the same listing
    const collisionsQuery = query(
      bookingsCol,
      where('listingId', '==', booking.listingId),
      where('status', '==', 'PENDING_APPROVAL')
    );
    const collisionsSnap = await getDocs(collisionsQuery);
    
    const conflictingDocs: { ref: DocumentReference<DocumentData, DocumentData>; data: Booking }[] = [];
    collisionsSnap.forEach(docSnap => {
      if (docSnap.id !== requestId) {
        const otherBooking = docSnap.data() as Booking;
        if (checkDatesOverlap(booking.startDate, booking.endDate, otherBooking.startDate, otherBooking.endDate)) {
          conflictingDocs.push({ ref: docSnap.ref, data: otherBooking });
        }
      }
    });

    const nextStatus: BookingStatus = 'PENDING_PAYMENT';
    const nowStr = new Date().toISOString();
    
    // Set payment TTL to 24 hours from now
    const expiresAtDate = new Date();
    expiresAtDate.setHours(expiresAtDate.getHours() + 24);
    const paymentExpiresAt = expiresAtDate.toISOString();

    const historyEntry = {
      status: nextStatus,
      timestamp: nowStr,
      actorId: hostId,
      actorName: 'Anfitrión',
      note: hostNote,
    };

    transaction.update(bookingRef, {
      status: nextStatus,
      hostResponseNote: hostNote,
      paymentInstructions: paymentInstructions,
      paymentExpiresAt: paymentExpiresAt,
      updatedAt: serverTimestamp(),
      statusHistory: [...(booking.statusHistory || []), historyEntry],
    });

    // Reject all conflicting bookings
    for (const conflict of conflictingDocs) {
      transaction.update(conflict.ref, {
        status: 'REJECTED',
        rejectionReason: 'Las fechas fueron reservadas por otra persona simultáneamente.',
        updatedAt: serverTimestamp(),
        statusHistory: [...(conflict.data.statusHistory || []), {
          status: 'REJECTED',
          timestamp: nowStr,
          actorId: 'system',
          actorName: 'Sistema VeneStay',
          note: 'Auto-rechazado por colisión de fechas.',
        }],
      });
    }
  });

  // 2. Inyectar de forma atómica en el Chat (Simulación de Trigger Backend si no hay Cloud Functions)
  try {
    const messagesColRef = collection(db, 'messages');
    const msgDocRef = doc(messagesColRef);
    await setDoc(msgDocRef, {
      id: msgDocRef.id,
      bookingId: requestId,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text: `📢 SOLICITUD APROBADA POR EL ANFITRIÓN\n\nMensaje:\n"${hostNote}"\n\nMétodo de Pago Habilitado:\n${paymentInstructions}\n\nPor favor, ingresa a 'Mis Viajes' para subir tu comprobante de pago antes de 24 horas.`,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error inyectando chat post-aprobación:', err);
  }
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
          
          const current = new Date(start);
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
