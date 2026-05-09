import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
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
  onError?: (error: any) => void
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

