import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
// Evitar re-inicialización en HMR de Vite
const app = getApps().length ? getApps()[0] : initializeApp(finalConfig);

// Initialize Services
export const auth = getAuth(app);

// Connectivity fix: Use initializeFirestore with forced long polling in production.
// Emulators crash with INTERNAL ASSERTION FAILED if long polling is forced locally.
// We also use ignoreUndefinedProperties in DEV to prevent the {"ve":-1} internal SDK crash
// caused by undefined payload serialization.
export let db: ReturnType<typeof getFirestore>;

try {
  const firestoreSettings = import.meta.env.DEV 
    ? { ignoreUndefinedProperties: true } 
    : { experimentalForceLongPolling: true };

  db = initializeFirestore(
    app,
    firestoreSettings,
    (firebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || '(default)'
  );
} catch (error) {
  // Safe fallback for Vite HMR if Firestore was already initialized on this app instance
  db = getFirestore(app, (firebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || '(default)');
}

console.log(
  `[Firebase] Initialized with database: ${(firebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || '(default)'}`
);

import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

export const storage = getStorage(app);
storage.maxUploadRetryTime = 120000;
storage.maxOperationRetryTime = 120000;
export const googleProvider = new GoogleAuthProvider();
export const functions = getFunctions(app);

// --- Conexión a emuladores ---
// Flag global: previene doble llamada en hot-reload (Vite HMR)
declare global {
  interface Window { _emulatorsConnected?: boolean; }
}

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (import.meta.env.DEV && useEmulator && !window._emulatorsConnected) {
  window._emulatorsConnected = true;
  console.warn(
    '[VeneStay DEV] Conectando a emuladores de Firebase.\n' +
    '  Firestore   localhost:8080\n' +
    '  Functions   localhost:5001\n' +
    '  Auth        http://localhost:9099\n' +
    '  Storage     localhost:9199\n' +
    '  Si ves errores de red: firebase emulators:start'
  );

  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
  connectStorageEmulator(storage, 'localhost', 9199);
} else if (import.meta.env.DEV && !useEmulator) {
  console.info(
    `[Firebase] Conectado a NUBE — proyecto: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`
  );
}

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


