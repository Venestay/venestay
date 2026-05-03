import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '@/lib/firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);

// Connectivity fix: Use initializeFirestore with forced long polling.
// This is critical for environments with restrictive proxies or erratic networks.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  (firebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || '(default)'
);

console.log(
  `[Firebase] Initialized with database: ${(firebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || '(default)'}`
);

export const storage = getStorage(app);
storage.maxUploadRetryTime = 120000;
storage.maxOperationRetryTime = 120000;
export const googleProvider = new GoogleAuthProvider();

// Connection diagnostic
async function testConnection() {
  try {
    const testDoc = doc(db, 'system', 'connection-check');
    await getDocFromServer(testDoc);
    console.log('[Firebase] Firestore connection test: SUCCESS');
  } catch (error: unknown) {
    console.error(
      '[Firebase] Firestore connection test: FAILED',
      (error as { code?: string }).code,
      (error as Error).message
    );
    if ((error as { code?: string }).code === 'unavailable') {
      console.warn(
        '[Firebase] Connection unavailable. This might be a temporary network issue or incorrect Database ID.'
      );
    }
  }
}

testConnection();


