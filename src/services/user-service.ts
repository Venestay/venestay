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
  let score = 20; // Base for having an account/email

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

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    
    // Recalculate trust score if relevant fields changed
    const currentProfile = await getUserProfile(uid);
    const mergedProfile = { ...currentProfile, ...data };
    const newTrustScore = calculateTrustScore(mergedProfile);
    
    const updateData = {
      ...data,
      trustScore: newTrustScore,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(userDocRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
