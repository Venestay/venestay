import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/types';
import * as authService from '@/services/auth-service';

interface AuthContextType {
  user: FirebaseUser | null;
  profileData: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setEmailVerified(firebaseUser.emailVerified);

        const adminEmails = [
          'rodriguezzcarlose@gmail.com',
          'zabalareduardoc@gmail.com',
          'anfitrionvenestay@venestay.com',
        ];
        const isHardcodedAdmin = firebaseUser.email
          ? adminEmails.some((email) => email.toLowerCase() === firebaseUser.email?.toLowerCase())
          : false;

        unsubscribeProfile = authService.subscribeToProfile(
          firebaseUser.uid,
          async (profile) => {
            if (!profile) {
              const role = isHardcodedAdmin ? 'admin' : 'user';
              await authService.createUserProfile(firebaseUser, role);
            } else {
              // Override display name for the demo user to prevent personal name leakage
              const isDemoUser = firebaseUser.email?.toLowerCase() === 'anfitrionvenestay@venestay.com';
              const finalProfile = isDemoUser 
                ? { ...profile, displayName: 'Anfitrión VeneStay' }
                : profile;

              setProfileData(finalProfile);
              setIsAdmin(profile.role === 'admin' || isHardcodedAdmin);

              if (isHardcodedAdmin && profile.role !== 'admin') {
                await authService.updateUserProfile(firebaseUser.uid, { role: 'admin' });
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('AuthContext: Profile subscription error:', error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setProfileData(null);
        setIsAdmin(false);
        setEmailVerified(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profile = await authService.getUserProfile(user.uid);
      if (profile) setProfileData(profile);
    }
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profileData, loading, isAdmin, emailVerified, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};






