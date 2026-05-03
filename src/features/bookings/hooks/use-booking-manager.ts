import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { BookingStatus } from '@/types';
import { logger } from '@/lib/logger';

export const useBookingManager = () => {
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading || !isAdmin) return;

    const q = query(
      collection(db, 'bookings'),
      where('status', '==', 'PENDING_PAYMENT')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const now = new Date();
        const EXPIRE_TIME_MINUTES = 30; // Standard VeneStay expiration
        const batch = writeBatch(db);
        let hasChanges = false;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          let createdAtDate: Date | null = null;

          if (data.createdAt?.toDate) {
            createdAtDate = data.createdAt.toDate();
          } else if (data.createdAt) {
            createdAtDate = new Date(data.createdAt);
          }

          if (createdAtDate && !isNaN(createdAtDate.getTime())) {
            if (
              now.getTime() - createdAtDate.getTime() >
              EXPIRE_TIME_MINUTES * 60 * 1000
            ) {
              const historyEntry = {
                status: 'CANCELLED' as BookingStatus,
                timestamp: new Date().toISOString(),
                actorId: 'system',
                actorName: 'VeneStay System',
                note: 'Cancelación automática por falta de pago (Time-out)',
              };

              batch.update(doc(db, 'bookings', docSnap.id), {
                status: 'CANCELLED',
                updatedAt: serverTimestamp(),
                statusHistory: [...(data.statusHistory || []), historyEntry],
              });
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          try {
            await batch.commit();
            logger.info('Cancelled expired bookings successfully.');
          } catch (err) {
            logger.error('Error cancelling expired bookings:', err);
          }
        }
      },
      (error) => {
        logger.error('App: Error in booking auto-cancellation sync:', error);
      }
    );

    return () => unsubscribe();
  }, [loading, isAdmin]);
};


