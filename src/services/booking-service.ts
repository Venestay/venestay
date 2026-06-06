import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  runTransaction,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingStatus } from '@/types';
import { parseISO } from 'date-fns';

import { withRetry } from './firestore-retry';

export const getReservedDates = async (listingId: string): Promise<{ start: Date; end: Date; type: 'confirmed' | 'pending' }[]> => {
  const q = query(
    collection(db, 'bookings'),
    where('listingId', '==', listingId),
    where('status', 'in', ['CONFIRMED', 'AWAITING_VERIFICATION', 'PENDING_PAYMENT', 'PENDING_APPROVAL'])
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      start: parseISO(data.startDate),
      end: parseISO(data.endDate),
      type: ['CONFIRMED', 'AWAITING_VERIFICATION', 'PENDING_PAYMENT'].includes(data.status) ? 'confirmed' : 'pending'
    };
  });
};

export const createBooking = async (bookingData: Partial<Booking>) => {
  return withRetry(async () => {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  });
};

export const subscribeToUserBookings = (
  userId: string,
  onUpdate: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'bookings'),
    where('guestId', '==', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Booking[];
      onUpdate(data);
    },
    onError
  );
};

export const createBookingWithTransaction = async (
  bookingData: Partial<Booking>,
  initialMessage?: string
): Promise<string> => {
  const docId = await withRetry(async () => {
    return runTransaction(db, async (transaction) => {
      const listingId = bookingData.listingId;
      if (!listingId) throw new Error('Falta el ID del alojamiento.');

      // AVAILABILITY CONFLICT CHECK: Solo estados "hard block" (confirmados o en verificación o pago pendiente).
      // PENDING_APPROVAL queda excluido intencionalmente para permitir múltiples solicitudes.
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('listingId', '==', listingId),
        where('status', 'in', ['CONFIRMED', 'AWAITING_VERIFICATION', 'PENDING_PAYMENT'])
      );
      const querySnapshot = await getDocs(bookingsQuery);
      
      const startStr = bookingData.startDate;
      const endStr = bookingData.endDate;
      if (!startStr || !endStr) throw new Error('Faltan fechas de reserva.');

      const requestedStart = parseISO(startStr).getTime();
      const requestedEnd = parseISO(endStr).getTime();

      for (const d of querySnapshot.docs) {
        const data = d.data();
        const existingStart = parseISO(data.startDate).getTime();
        const existingEnd = parseISO(data.endDate).getTime();

        const overlaps = (requestedStart < existingEnd && requestedEnd > existingStart);
        if (overlaps) {
          throw new Error('Lo sentimos, las fechas solicitadas ya se encuentran reservadas.');
        }
      }

      const bookingsColRef = collection(db, 'bookings');
      const newBookingDocRef = doc(bookingsColRef);
      const docId = newBookingDocRef.id;

      const finalBookingData = {
        ...bookingData,
        guestMessage: initialMessage || '',
        id: docId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(newBookingDocRef, finalBookingData);

      return docId;
    });
  });

  // Post-commit: Create the message document since the booking doc now exists.
  // This satisfies the canAccessBooking() rule which get()s the booking document.
  if (initialMessage && initialMessage.trim().length > 0) {
    try {
      const messagesColRef = collection(db, 'messages');
      const newMessageDocRef = doc(messagesColRef);
      await setDoc(newMessageDocRef, {
        id: newMessageDocRef.id,
        bookingId: docId,
        senderId: bookingData.guestId || 'guest',
        senderName: bookingData.guestName || 'Huésped',
        text: initialMessage,
        type: 'text',
        status: 'sent',
        createdAt: new Date().toISOString(),
      });
    } catch (msgError) {
      console.error('Error writing initial message post-commit:', msgError);
    }
  }

  return docId;
};

import { DirectBookingRequestPayload } from '@/features/bookings/types';

export const requestBookingDirectly = async (
  payload: DirectBookingRequestPayload
): Promise<{ bookingId: string }> => {
  const docId = await runTransaction(db, async (transaction) => {
    const listingId = payload.listingId;

    // Verify availability
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('listingId', '==', listingId),
      where('status', 'in', ['CONFIRMED', 'AWAITING_VERIFICATION', 'PENDING_PAYMENT'])
    );
    const querySnapshot = await getDocs(bookingsQuery);
    
    const requestedStart = parseISO(payload.startDate).getTime();
    const requestedEnd = parseISO(payload.endDate).getTime();

    for (const d of querySnapshot.docs) {
      const data = d.data();
      const existingStart = parseISO(data.startDate).getTime();
      const existingEnd = parseISO(data.endDate).getTime();

      const overlaps = (requestedStart < existingEnd && requestedEnd > existingStart);
      if (overlaps) {
        throw new Error('Lo sentimos, las fechas solicitadas ya se encuentran reservadas.');
      }
    }

    const bookingsColRef = collection(db, 'bookings');
    const newBookingDocRef = doc(bookingsColRef);
    const docId = newBookingDocRef.id;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const finalBookingData = {
      id: docId,
      listingId: payload.listingId,
      listingTitle: payload.listingTitle,
      guestId: payload.guestId,
      guestName: payload.guestName,
      ownerId: payload.hostId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalAmount: payload.totalAmount,
      agreedPercentage: 20,
      status: 'PENDING_APPROVAL' as BookingStatus,
      guests: payload.guestsCount,
      bookingMode: 'request' as 'request' | 'instant',
      guestMessage: payload.guestMessage,
      expiresAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(newBookingDocRef, finalBookingData);

    return docId;
  });

  // Post-commit: save system system_booking_request and guest message
  try {
    const messagesColRef = collection(db, 'messages');

    // 1. Initial System message
    const systemMsgDocRef = doc(messagesColRef);
    await setDoc(systemMsgDocRef, {
      id: systemMsgDocRef.id,
      bookingId: docId,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text: `Nueva solicitud de reserva creada para ${payload.listingTitle}. Pendiente de aprobación del anfitrión.`,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });

    // 2. Guest introduction message
    const guestMsgDocRef = doc(messagesColRef);
    await setDoc(guestMsgDocRef, {
      id: guestMsgDocRef.id,
      bookingId: docId,
      senderId: payload.guestId,
      senderName: payload.guestName,
      text: payload.guestMessage,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error writing messages post-commit for direct booking request:', error);
  }

  return { bookingId: docId };
};

export const cleanupExpiredBookings = async (): Promise<void> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('status', '==', 'PENDING_APPROVAL')
    );
    const snapshot = await getDocs(q);
    const now = new Date();

    for (const d of snapshot.docs) {
      const data = d.data() as Booking;
      if (data.expiresAt) {
        const expiresDate = new Date(data.expiresAt);
        if (expiresDate < now) {
          const historyEntry = {
            status: 'EXPIRED' as BookingStatus,
            timestamp: now.toISOString(),
            actorId: 'system',
            actorName: 'Sistema VeneStay',
            note: 'Expiración automática de 24 horas sin respuesta del anfitrión.',
          };

          await updateDoc(doc(db, 'bookings', d.id), {
            status: 'EXPIRED',
            updatedAt: serverTimestamp(),
            statusHistory: [...(data.statusHistory || []), historyEntry],
          });
        }
      }
    }
  } catch (error) {
    console.error('Error executing cleanupExpiredBookings:', error);
  }
};

export const requestReschedule = async (params: {
  bookingId: string;
  proposedStartDate: string;  // ISO
  proposedEndDate: string;    // ISO
  rescheduleNote?: string;
  actorId: string;
  actorName: string;
}): Promise<void> => {
  const bookingRef = doc(db, 'bookings', params.bookingId);
  await runTransaction(db, async (transaction) => {
    const bookingDoc = await transaction.get(bookingRef);
    if (!bookingDoc.exists()) {
      throw new Error('La reserva no existe');
    }
    const data = bookingDoc.data() as Booking;
    const historyEntry = {
      status: 'RESCHEDULE_REQUESTED' as BookingStatus,
      timestamp: new Date().toISOString(),
      actorId: params.actorId,
      actorName: params.actorName,
      note: params.rescheduleNote || 'Solicitud de reprogramación enviada.',
    };

    transaction.update(bookingRef, {
      status: 'RESCHEDULE_REQUESTED',
      proposedStartDate: params.proposedStartDate,
      proposedEndDate: params.proposedEndDate,
      rescheduleNote: params.rescheduleNote || '',
      updatedAt: serverTimestamp(),
      statusHistory: [...(data.statusHistory || []), historyEntry],
    });
  });

  // Post-commit: save system message
  try {
    const messagesColRef = collection(db, 'messages');
    const systemMsgDocRef = doc(messagesColRef);
    await setDoc(systemMsgDocRef, {
      id: systemMsgDocRef.id,
      bookingId: params.bookingId,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text: `Solicitud de reprogramación enviada por el huésped para las fechas ${params.proposedStartDate} a ${params.proposedEndDate}.`,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error writing messages post-commit for requestReschedule:', error);
  }
};

export const approveReschedule = async (params: {
  bookingId: string;
  originalStartDate: string;
  originalEndDate: string;
  seasonalAdjustmentFee: number;  // 0 si no aplica
  actorId: string;
  actorName: string;
}): Promise<void> => {
  const bookingRef = doc(db, 'bookings', params.bookingId);
  await runTransaction(db, async (transaction) => {
    const bookingDoc = await transaction.get(bookingRef);
    if (!bookingDoc.exists()) {
      throw new Error('La reserva no existe');
    }
    const data = bookingDoc.data() as Booking;
    if (!data.proposedStartDate || !data.proposedEndDate) {
      throw new Error('No hay fechas propuestas de reprogramación');
    }

    const nextStatus: BookingStatus = params.seasonalAdjustmentFee > 0 ? 'RESCHEDULE_PENDING' : 'CONFIRMED';
    const historyEntry = {
      status: nextStatus,
      timestamp: new Date().toISOString(),
      actorId: params.actorId,
      actorName: params.actorName,
      note: params.seasonalAdjustmentFee > 0
        ? `Reprogramación aprobada con cargo de ajuste de $${params.seasonalAdjustmentFee}. Esperando pago.`
        : 'Reprogramación aprobada y confirmada sin cargos adicionales.',
    };

    const updates: Partial<Booking> = {
      status: nextStatus,
      seasonalAdjustmentFee: params.seasonalAdjustmentFee,
      updatedAt: serverTimestamp() as unknown as string,
      statusHistory: [...(data.statusHistory || []), historyEntry],
    };

    if (params.seasonalAdjustmentFee === 0) {
      // Confirmado de inmediato: hacer swap de fechas
      updates.startDate = data.proposedStartDate;
      updates.endDate = data.proposedEndDate;
      updates.proposedStartDate = '';
      updates.proposedEndDate = '';
    }

    transaction.update(bookingRef, updates);
  });

  // Post-commit: save system message
  try {
    const messagesColRef = collection(db, 'messages');
    const systemMsgDocRef = doc(messagesColRef);
    const text = params.seasonalAdjustmentFee > 0
      ? `Reprogramación pre-aprobada por el anfitrión. Aplica cargo de ajuste de $${params.seasonalAdjustmentFee}.`
      : `Reprogramación confirmada. Fechas actualizadas con éxito.`;
    await setDoc(systemMsgDocRef, {
      id: systemMsgDocRef.id,
      bookingId: params.bookingId,
      senderId: 'system',
      senderName: 'Sistema VeneStay',
      text,
      type: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error writing messages post-commit for approveReschedule:', error);
  }
};



