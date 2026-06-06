/**
 * Script de Utilidad: set-qa-claim.cjs
 * Asigna el custom claim { qa: true } a las cuentas de prueba especificadas.
 * 
 * Uso: npx --package firebase-admin node scripts/set-qa-claim.cjs <email> [true|false]
 */

const admin = require('firebase-admin');

// Inicializa Firebase Admin usando credenciales locales (por ejemplo, mediante GOOGLE_APPLICATION_CREDENTIALS
// o el flujo de autenticación local de Firebase CLI).
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK.');
  console.error('Asegúrate de haber iniciado sesión con Firebase CLI o exportado la variable de entorno correspondientemente.');
  console.error('Error detallado:', error.message);
  process.exit(1);
}

const email = process.argv[2];
const active = process.argv[3] !== 'false'; // por defecto es true

if (!email) {
  console.log('\nUso: npx --package firebase-admin node scripts/set-qa-claim.cjs <email> [true|false]\n');
  console.log('Ejemplo: npx --package firebase-admin node scripts/set-qa-claim.cjs huespedvenestay@gmail.com true\n');
  process.exit(1);
}

async function setQAClaim() {
  try {
    console.log(`Buscando usuario con email: ${email}...`);
    const user = await admin.auth().getUserByEmail(email);
    
    console.log(`Usuario encontrado: ${user.displayName || 'Sin nombre'} (uid: ${user.uid})`);
    
    // Obtener los claims actuales para no pisar otros claims que puedan tener
    const currentClaims = user.customClaims || {};
    const updatedClaims = { ...currentClaims, qa: active };
    
    if (!active) {
      delete updatedClaims.qa;
    }
    
    await admin.auth().setCustomUserClaims(user.uid, updatedClaims);
    console.log(`✓ Custom claims actualizados para ${email}:`, updatedClaims);
    console.log('El usuario debe cerrar sesión y volver a iniciarla o forzar la actualización de su token en el cliente para aplicar los cambios.');
  } catch (error) {
    console.error('Error al establecer custom claim:', error.message);
  }
}

setQAClaim();
