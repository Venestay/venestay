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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingStatus } from '@/types';
import { parseISO } from 'date-fns';

export const getReservedDates = async (listingId: string): Promise<{ start: Date; end: Date; type: 'confirmed' | 'pending' }[]> => {
  const q = query(
    collection(db, 'bookings'),
    where('listingId', '==', listingId),
    where('status', 'in', ['CONFIRMED', 'AWAITING_VERIFICATION'])
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      start: parseISO(data.startDate),
      end: parseISO(data.endDate),
      type: data.status === 'CONFIRMED' ? 'confirmed' : 'pending'
    };
  });
};

export const createBooking = async (bookingData: Partial<Booking>) => {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...bookingData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
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
  return await runTransaction(db, async (transaction) => {
    const listingId = bookingData.listingId;
    if (!listingId) throw new Error('Falta el ID del alojamiento.');

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('listingId', '==', listingId),
      where('status', 'in', ['CONFIRMED', 'AWAITING_VERIFICATION', 'PENDING_APPROVAL'])
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

    if (initialMessage && initialMessage.trim().length > 0) {
      const messagesColRef = collection(db, 'messages');
      const newMessageDocRef = doc(messagesColRef);
      transaction.set(newMessageDocRef, {
        id: newMessageDocRef.id,
        bookingId: docId,
        senderId: bookingData.guestId || 'guest',
        senderName: bookingData.guestName || 'Huésped',
        text: initialMessage,
        type: 'text',
        status: 'sent',
        createdAt: new Date().toISOString(),
      });
    }

    return docId;
  });
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


