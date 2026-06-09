import { 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, TravelInterest } from '@/features/auth/types';

/**
 * Calculates trust score based on profile completion
 * Strategy: Trust Architect
 */
export const calculateTrustScore = (profile: Partial<UserProfile>): number => {
  let score = 10; // Base for having an account/email

  if (profile.displayName && profile.displayName.length >= 3) score += 20;
  if (profile.bio && profile.bio.length >= 50) score += 20;
  if (profile.selectedInterests && profile.selectedInterests.length >= 2) score += 20;
  if (profile.notifications?.whatsapp) score += 20;
  
  // Bonus for verifications (Phase 2 preview)
  if (profile.isEmailVerified) score += 10;
  if (profile.isPhoneVerified) score += 10;
  if (profile.isIdentityVerified) score += 20;

  return Math.min(score, 100);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const subscribeToUserProfile = (
  uid: string,
  onUpdate: (profile: UserProfile | null) => void
) => {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate({ uid, ...snapshot.data() } as UserProfile);
    } else {
      onUpdate(null);
    }
  });
};

import { withRetry } from './firestore-retry';

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  return withRetry(async () => {
    const userDocRef = doc(db, 'users', uid);
    
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(userDocRef, updateData);
    return updateData;
  });
};
