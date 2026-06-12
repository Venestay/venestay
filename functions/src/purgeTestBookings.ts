import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './config/db';

function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  while (currentDate < endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export const purgeTestBookings = functions.https.onCall(
  async (data: { listingId: string; bookingIds: string[] }, context) => {

    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores.');
    }

    if (!data.bookingIds || data.bookingIds.length === 0) {
      return { cancelledCount: 0, releasedDates: 0 };
    }

    const batch = db.batch();
    let releasedDates = 0;
    
    // We will collect all dates to remove from the listing
    const allDatesToRemove = new Set<string>();

    for (const bookingId of data.bookingIds) {
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingSnap = await bookingRef.get();
      const booking = bookingSnap.data();

      // GUARD: verificación final — nunca tocar algo sin el marcador
      if (!booking || booking.isTestBooking !== true) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Booking ${bookingId} no está marcado como prueba. Operación abortada.`
        );
      }
      if (booking.listingId !== data.listingId) {
        throw new functions.https.HttpsError('failed-precondition', 'Booking no pertenece a este listing.');
      }

      // Marcar como cancelado por admin (no eliminar — preserva historial)
      batch.update(bookingRef, {
        status: 'CANCELLED_BY_ADMIN',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledBy: context.auth!.uid,
      });

      // Calcular fechas a liberar
      if (booking.checkIn && booking.checkOut) {
        const dates = getDatesInRange(booking.checkIn, booking.checkOut);
        dates.forEach(d => allDatesToRemove.add(d));
      }
    }

    // Liberar fechas del calendario de la propiedad
    if (allDatesToRemove.size > 0) {
      const listingRef = db.collection('listings').doc(data.listingId);
      batch.update(listingRef, {
        blockedDates: admin.firestore.FieldValue.arrayRemove(...Array.from(allDatesToRemove))
      });
      releasedDates += allDatesToRemove.size;
    }

    await batch.commit();

    // Audit trail
    await db.collection('adminActions').add({
      action: 'PURGE_TEST_BOOKINGS',
      listingId: data.listingId,
      bookingIds: data.bookingIds,
      cancelledCount: data.bookingIds.length,
      adminUid: context.auth!.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { cancelledCount: data.bookingIds.length, releasedDates };
  }
);
