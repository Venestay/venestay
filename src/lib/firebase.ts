import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let firebaseConfig: Record<string, any> = {};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)',
};

// Check if we have a full JSON config string as fallback
let finalConfig = firebaseConfig;
if (!firebaseConfig.apiKey && import.meta.env.VITE_FIREBASE_CONFIG_JSON) {
  try {
    finalConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG_JSON);
  } catch (e) {
    console.error('[Firebase] Failed to parse VITE_FIREBASE_CONFIG_JSON');
  }
}

// Initialize Firebase
const app = initializeApp(finalConfig);

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


