import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp();
}

// The custom Firestore database ID used across the project.
// This constant is used both for the `db` instance and for Firestore trigger declarations.
export const DATABASE_ID = 'ai-studio-58b68c99-e33b-41f2-9d14-cb5d47474d97';

export const db = getFirestore(
  admin.app(),
  DATABASE_ID
);
