const admin = require('firebase-admin');

const { getFirestore } = require('firebase-admin/firestore');

// Initialize with Application Default Credentials
admin.initializeApp({
  projectId: 'gen-lang-client-0727178605'
});

const db = getFirestore();

async function analyze() {
  console.log("Analyzing Listings and Bookings...");
  
  // Get all listings with blocked dates
  const listingsSnap = await db.collection('listings').get();
  let foundListingId = null;
  
  for (const doc of listingsSnap.docs) {
    const data = doc.data();
    if (data.blockedDates && data.blockedDates.length > 0) {
      console.log(`\nListing ID: ${doc.id}`);
      console.log(`Blocked Dates: ${data.blockedDates.join(', ')}`);
      foundListingId = doc.id;
    }
  }
  
  if (!foundListingId) {
    console.log("\nNo listings with blocked dates found.");
    // Fallback: just pick any listing to check bookings
    if (!listingsSnap.empty) {
      foundListingId = listingsSnap.docs[0].id;
    }
  }

  if (foundListingId) {
    console.log(`\nQuerying Bookings for Listing: ${foundListingId}`);
    const bookingsSnap = await db.collection('bookings').where('listingId', '==', foundListingId).get();
    
    if (bookingsSnap.empty) {
      console.log("No bookings found for this listing.");
    } else {
      for (const bDoc of bookingsSnap.docs) {
        const b = bDoc.data();
        console.log(`- Booking ID: ${bDoc.id}`);
        console.log(`  Status: ${b.status}`);
        console.log(`  isTestBooking: ${b.isTestBooking}`);
        console.log(`  Dates: ${b.startDate || b.checkIn} to ${b.endDate || b.checkOut}`);
      }
    }
  }
}

analyze().catch(console.error);
