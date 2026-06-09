const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'gen-lang-client-0727178605'
});

const db = admin.firestore();

const listingIds = [
  'listing-1780275845612',
  'listing-1779549166840',
  'listing-1780872174378',
  'listing-1778769400229'
];

async function unlock() {
  for (const id of listingIds) {
    const docRef = db.collection('listings').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`Listing ${id} not found.`);
    } else {
      await docRef.update({ blockedDates: [] });
      console.log(`Listing ${id} unlocked.`);
    }
  }
}

unlock().catch(console.error);
