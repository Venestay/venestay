import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ReviewSession {
  id?: string;
  bookingId: string;
  guestId: string;
  propertyId: string;
  status: 'PENDING' | 'SUBMITTED' | 'EXPIRED';
  ucpVerified: boolean;
  expiresAt: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
}

export interface Review {
  listingId: string;
  guestId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | FieldValue;
  reviewSessionId: string;
}

/**
 * Crea una sesión de reseña vinculada a una reserva completada.
 * Nota: Según las reglas de Firestore, esto suele requerir permisos de admin.
 */
export const createReviewSession = async (
  bookingId: string, 
  guestId: string, 
  propertyId: string
) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de vigencia

  const sessionData: Omit<ReviewSession, 'id'> = {
    bookingId,
    guestId,
    propertyId,
    status: 'PENDING',
    ucpVerified: true,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'reviewSessions'), sessionData);
  return docRef.id;
};

/**
 * Envía una reseña utilizando un token de sesión válido.
 */
export const submitVerifiedReview = async (
  reviewData: Omit<Review, 'createdAt'>,
  sessionId: string
) => {
  // 1. Crear la reseña
  const reviewRef = await addDoc(collection(db, 'reviews'), {
    ...reviewData,
    createdAt: serverTimestamp(),
  });

  // 2. Marcar la sesión como enviada
  const sessionRef = doc(db, 'reviewSessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'SUBMITTED',
    updatedAt: serverTimestamp(),
  });

  return reviewRef.id;
};

/**
 * Obtiene la sesión de reseña pendiente para un usuario y una reserva.
 */
export const getPendingReviewSession = async (userId: string, bookingId: string) => {
  const q = query(
    collection(db, 'reviewSessions'),
    where('guestId', '==', userId),
    where('bookingId', '==', bookingId),
    where('status', '==', 'PENDING')
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  return {
    id: querySnapshot.docs[0].id,
    ...querySnapshot.docs[0].data()
  } as ReviewSession;
};

/**
 * Obtiene todas las reseñas de una propiedad.
 */
export const getListingReviews = async (listingId: string) => {
  const q = query(
    collection(db, 'reviews'),
    where('listingId', '==', listingId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (Review & { id: string })[];
};
