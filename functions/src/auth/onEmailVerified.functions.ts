import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { recalculateKycPhase } from '../auth.functions';

export const onEmailVerified = functions.auth.user().beforeSignIn(async (user) => {
  if (user.emailVerified) {
    const userRef = admin.firestore().collection('users').doc(user.uid);
    await userRef.set(
      {
        trustSignals: {
          emailVerified: true,
        },
      },
      { merge: true }
    );
    await recalculateKycPhase(user.uid);
  }
});
