import {
  signOut as firebaseSignOut,
  User as FirebaseUser,
  sendEmailVerification as firebaseSendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import { UserProfile } from '@/types';

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (user: FirebaseUser): Promise<void> => {
  try {
    const sendCustomVerificationEmail = httpsCallable(functions, 'sendCustomVerificationEmail');
    await sendCustomVerificationEmail({ 
      email: user.email, 
      displayName: user.displayName || 'Huésped',
      appBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://venestay.com'
    });
  } catch (error) {
    console.error('Error sending custom verification email:', error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    const sendCustomPasswordResetEmail = httpsCallable(functions, 'sendCustomPasswordResetEmail');
    await sendCustomPasswordResetEmail({ 
      email,
      appBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://venestay.com'
    });
  } catch (error) {
    console.error('Error sending custom password reset email:', error);
    throw error;
  }
};

export const isEmailVerified = (user: FirebaseUser | null): boolean => {
  if (!user) return false;
  return user.emailVerified;
};

export const confirmEmailVerification = async (oobCode: string) => {
  return await applyActionCode(auth, oobCode);
};

export const verifyPasswordReset = async (oobCode: string) => {
  return await verifyPasswordResetCode(auth, oobCode);
};

export const resetPasswordWithCode = async (oobCode: string, newPassword: string) => {
  return await confirmPasswordReset(auth, oobCode, newPassword);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

export const subscribeToProfile = (
  uid: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
) => {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    onError
  );
};

export const createUserProfile = async (firebaseUser: FirebaseUser, role: 'user' | 'admin' = 'user') => {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const newProfile: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || 'Usuario de VeneStay',
    photoURL: firebaseUser.photoURL || '',
    createdAt: serverTimestamp(),
    role: role,
    kycStatus: 'UNVERIFIED',
  };
  await setDoc(userDocRef, newProfile);
  return newProfile;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data, { merge: true });
};


