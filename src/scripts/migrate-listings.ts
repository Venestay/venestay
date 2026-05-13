import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function migrateListings() {
  console.log('🚀 Iniciando migración de listados...');
  
  try {
    const listingsRef = collection(db, 'listings');
    const snapshot = await getDocs(listingsRef);
    
    console.log(`🔍 Se encontraron ${snapshot.size} listados.`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const listingDoc of snapshot.docs) {
      const data = listingDoc.data();
      
      // Si ya está publicado, no hacemos nada (a menos que queramos forzarlo)
      if (data.isPublishedFromDashboard === true) {
        skippedCount++;
        continue;
      }

      console.log(`Updating listing: ${listingDoc.id} - ${data.title || 'Sin título'}`);
      
      await updateDoc(doc(db, 'listings', listingDoc.id), {
        isPublishedFromDashboard: true,
        updatedAt: new Date().toISOString()
      });
      
      updatedCount++;
    }

    console.log('\n✅ Migración completada con éxito.');
    console.log(`📊 Resumen:`);
    console.log(`   - Actualizados: ${updatedCount}`);
    console.log(`   - Omitidos (ya publicados): ${skippedCount}`);
    console.log(`   - Total procesado: ${snapshot.size}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrateListings().then(() => {
  console.log('Script finalizado.');
  process.exit(0);
});
