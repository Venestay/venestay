import * as admin from 'firebase-admin';

admin.initializeApp();

// Export domain-specific functions
export * from './booking.functions';
export * from './kyc.functions';
export * from './auth.functions';
export * from './previewTestBookings';
export * from './purgeTestBookings';
export * from './auth/customEmails.functions';
export * from './auth/onEmailVerified.functions';
