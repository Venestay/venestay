import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { LISTINGS as STATIC_LISTINGS } from '@/constants';

export const useDatabaseSeeder = () => {
  useEffect(() => {
    // Solo permitimos el seeding en entorno de desarrollo
    if (import.meta.env.PROD) return;

    const seedListings = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'listings'));
        if (snapshot.empty) {
          console.log('Database empty, seeding initial listings...');
          for (const listing of STATIC_LISTINGS) {
            await setDoc(doc(db, 'listings', listing.id), {
              ...listing,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error('Error seeding listings:', e);
      }
    };

    seedListings();
  }, []);
};


