const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize with Application Default Credentials
admin.initializeApp({
  projectId: 'gen-lang-client-0727178605'
});

const db = getFirestore();

async function analyze() {
  const bookingsSnap = await db.collection('bookings').get();
  let found = false;
  for (const doc of bookingsSnap.docs) {
    const data = doc.data();
    const id = doc.id.toLowerCase();
    const refStr = JSON.stringify(data).toLowerCase();
    
    if (id.includes('yzybonhz') || refStr.includes('yzybonhz')) {
      console.log('--- FOUND BOOKING ---');
      console.log('ID:', doc.id);
      console.log('Data:', JSON.stringify(data, null, 2));
      found = true;
    }
  }
  if (!found) {
    console.log('Booking not found in DB.');
  }
}

analyze().catch(console.error);
