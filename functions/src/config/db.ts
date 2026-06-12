import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Ensure we connect to the specific database from the environment or fallback to default
export const db = getFirestore(
  admin.app(),
  process.env.FIRESTORE_DATABASE_ID || '(default)'
);
