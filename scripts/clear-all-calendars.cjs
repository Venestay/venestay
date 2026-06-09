/**
 * Script de Utilidad: clear-all-calendars.cjs
 * Limpia el arreglo de `blockedDates` de todas las propiedades (Listings) en Firestore.
 * 
 * Uso: npx --package firebase-admin node scripts/clear-all-calendars.cjs
 */

const admin = require('firebase-admin');

// Si deseas correrlo contra el emulador local, descomenta esta línea y asegúrate de que esté encendido:
// process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
try {
  admin.initializeApp({
    projectId: 'gen-lang-client-0727178605'
  });
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK.');
  console.error('Asegúrate de haber iniciado sesión con Firebase CLI o exportado la variable de entorno correspondientemente.');
  console.error('Error detallado:', error.message);
  process.exit(1);
}

const { getFirestore } = require('firebase-admin/firestore');

async function clearCalendars() {
  try {
    const db = getFirestore();
    const listingsRef = db.collection('listings');
    const snapshot = await listingsRef.get();

    if (snapshot.empty) {
      console.log('No se encontraron propiedades (listings).');
      return;
    }

    console.log(`Se encontraron ${snapshot.size} propiedades. Procediendo a limpiar los calendarios...`);

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      // Limpiamos el arreglo blockedDates
      batch.update(doc.ref, {
        blockedDates: []
      });
      count++;
    });

    await batch.commit();

    console.log(`✓ Se han limpiado las fechas bloqueadas de ${count} propiedades correctamente.`);
  } catch (error) {
    console.error('Error al limpiar calendarios:', error);
  }
}

clearCalendars();
