import * as admin from 'firebase-admin';

admin.initializeApp();

// Export domain-specific functions
export * from './booking.functions';
export * from './kyc.functions';
export * from './auth.functions';
