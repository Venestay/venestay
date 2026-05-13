export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  role: 'user' | 'host' | 'admin';
  createdAt: string | Date;
  phoneNumber?: string;
  // Host Info
  about?: string;
  interests?: string;
  languages?: string;
  location?: string;
  responseTime?: string;
  responseRate?: string;
  isVerified?: boolean;
}




