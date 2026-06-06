import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { Booking } from '../types';
import { Listing } from '@/features/listings/types';

export const useBookingSummary = (booking: Booking | null, isOpen: boolean) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [proofSignedUrl, setProofSignedUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  // Load listing details
  useEffect(() => {
    if (!isOpen || !booking || !booking.listingId) {
      setListing(null);
      return;
    }

    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'listings', booking.listingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        } else {
          setError('No se pudo encontrar la propiedad vinculada.');
        }
      } catch (err) {
        console.error('Error fetching listing details:', err);
        setError('Error al cargar los detalles de la propiedad.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [booking, isOpen]);

  // Load signed proof url
  useEffect(() => {
    if (!isOpen || !booking?.id || !booking?.proofUrl) {
      setProofSignedUrl(null);
      return;
    }

    setProofLoading(true);
    const getSignedUrlFn = httpsCallable(functions, 'getProofSignedURL');
    
    getSignedUrlFn({ bookingId: booking.id })
      .then((result) => {
        const data = result.data as { signedUrl?: string };
        if (data?.signedUrl) {
          setProofSignedUrl(data.signedUrl);
        } else {
          setProofSignedUrl(null);
        }
      })
      .catch((err) => {
        console.error('Error fetching signed URL for payment proof:', err);
        setProofSignedUrl(null);
      })
      .finally(() => {
        setProofLoading(false);
      });
  }, [booking?.id, booking?.proofUrl, isOpen]);

  return {
    listing,
    loading,
    error,
    proofSignedUrl,
    proofLoading,
  };
};
