import { UserProfile } from '@/types';

export const checkProfileCompletion = (profile: UserProfile | null): number => {
  if (!profile) return 0;

  let completedItems = 0;
  const totalItems = 3;

  // 1. Photo
  if (profile.photoURL && !profile.photoURL.includes('pravatar.cc')) {
    completedItems++;
  }

  // 2. Phone
  if (profile.phoneNumber) {
    completedItems++;
  }

  // 3. About
  if (profile.about && profile.about.length > 50) {
    completedItems++;
  }

  return Math.round((completedItems / totalItems) * 100);
};


