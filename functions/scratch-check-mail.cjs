const admin = require('firebase-admin');

// Ensure we initialize exactly with the right project
admin.initializeApp({
  projectId: 'gen-lang-client-0727178605',
});

// Explicitly target the custom database
const db = admin.firestore(admin.app(), 'ai-studio-58b68c99-e33b-41f2-9d14-cb5d47474d97');

async function checkEmails() {
  try {
    const mailRef = db.collection('mail');
    const snapshot = await mailRef.limit(5).orderBy('delivery.startTime', 'desc').get().catch(async (e) => {
        // If ordering fails because of no index or missing fields, just get 5
        return await mailRef.limit(5).get();
    });

    if (snapshot.empty) {
      console.log('No documents found in the "mail" collection of database "ai-studio-58b68c99-e33b-41f2-9d14-cb5d47474d97".');
      return;
    }

    console.log(`Found ${snapshot.size} emails in the queue:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('---');
      console.log('To:', data.to);
      console.log('Delivery Status:', data.delivery ? data.delivery.state : 'PENDING (NO DELIVERY FIELD)');
      if (data.delivery && data.delivery.error) {
        console.log('Error:', data.delivery.error);
      }
    });
  } catch (error) {
    console.error('Error querying mail:', error);
  }
}

checkEmails();
