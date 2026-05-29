import { useState, useEffect } from 'react';
import { UserProfile } from '@/features/auth/types';
import { calculateTrustScore, subscribeToUserProfile } from '@/services/user-service';

interface UseGuestProfileReturn {
  guestProfile: UserProfile | null;
  trustScore: number;
  isLoading: boolean;
}

/**
 * Custom hook to reactively subscribe to a guest's profile from Firestore
 * and compute their VeneStay Trust Score dynamically.
 */
export const useGuestProfile = (guestId: string | null | undefined): UseGuestProfileReturn => {
  const [guestProfile, setGuestProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trustScore, setTrustScore] = useState(0);

  useEffect(() => {
    if (!guestId) {
      setGuestProfile(null);
      setTrustScore(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToUserProfile(guestId, (profile) => {
      if (profile) {
        setGuestProfile(profile);
        const score = calculateTrustScore(profile);
        setTrustScore(score);
      } else {
        setGuestProfile(null);
        setTrustScore(0);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [guestId]);

  return { guestProfile, trustScore, isLoading };
};
