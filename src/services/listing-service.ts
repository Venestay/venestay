import {
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Listing } from '@/types';

export const subscribeToListings = (
  onUpdate: (listings: Listing[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'listings'),
    where('isPublishedFromDashboard', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Listing[];
      onUpdate(data);
    },
    onError
  );
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  const docRef = doc(db, 'listings', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as Listing;
  }
  return null;
};

/**
 * Limpia todas las fechas bloqueadas de una propiedad.
 * USO EXCLUSIVO: administradores o el propietario del listing.
 * NO borra reservas de la colección `bookings`.
 */
export const clearListingCalendar = async (listingId: string): Promise<void> => {
  const docRef = doc(db, 'listings', listingId);
  await updateDoc(docRef, { blockedDates: [] });
};

/**
 * Reemplaza el array completo de blockedDates de una propiedad.
 * Solo el propietario o un admin deben invocar esta función (verificar en el componente llamante).
 * No cancela ni modifica reservas activas en la colección `bookings`.
 */
export const updateBlockedDates = async (
  listingId: string,
  blockedDates: string[]
): Promise<void> => {
  const docRef = doc(db, 'listings', listingId);
  await updateDoc(docRef, { blockedDates });
};
