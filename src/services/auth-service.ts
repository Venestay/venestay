import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
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
  onError?: (error: any) => void
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
    photoURL: firebaseUser.photoURL || 'https://i.pravatar.cc/150?u=' + firebaseUser.uid,
    createdAt: serverTimestamp(),
    role: role,
  };
  await setDoc(userDocRef, newProfile);
  return newProfile;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data, { merge: true });
};


