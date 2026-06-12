import * as functions from 'firebase-functions';


import { db } from './config/db';

export const previewTestBookings = functions.https.onCall(
  async (data: { listingId: string }, context) => {

    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores.');
    }

    const snap = await db.collection('bookings')
      .where('listingId', '==', data.listingId)
      .where('isTestBooking', '==', true)
      .where('status', 'in', [
        'PENDING_APPROVAL', 'PENDING_PAYMENT',
        'AWAITING_VERIFICATION', 'CONFIRMED'
      ])
      .get();

    const testBookings = snap.docs.map(doc => {
      const b = doc.data();
      return {
        bookingId: doc.id,
        guestName: b.guestName,
        checkIn: b.startDate || b.checkIn,
        checkOut: b.endDate || b.checkOut,
        status: b.status,
      };
    });

    return { testBookings, count: testBookings.length };
  }
);
