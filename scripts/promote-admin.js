/**
 * VENE STAY - Admin Promotion Script
 * Uso: node scripts/promote-admin.js <email>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, '../serviceAccountKey.json');
const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';

async function promoteUser() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Por favor proporciona un email. Ejemplo: node scripts/promote-admin.js user@example.com');
    process.exit(1);
  }

  try {
    // 1. Inicializar Admin SDK
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
    
    const app = initializeApp({
      credential: cert(serviceAccount)
    });

    // 2. Obtener servicios usando el databaseId correcto
    const db = getFirestore(app, databaseId);
    const auth = getAuth(app);

    console.log(`🔍 Buscando usuario: ${email} en la base de datos: ${databaseId}...`);

    // 3. Buscar usuario por Email en Auth
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`✅ Usuario encontrado en Auth (UID: ${uid})`);

    // 4. Actualizar documento en Firestore
    const userRef = db.collection('users').doc(uid);
    
    await userRef.set({
      role: 'admin',
      isIdentityVerified: true,
      kycStatus: 'VERIFIED',
      isVerified: true,
      trustScore: 100,
      updatedAt: FieldValue.serverTimestamp(),
      permissions: [
        'manage_listings',
        'manage_bookings',
        'manage_users',
        'audit_kyc',
        'view_financials'
      ]
    }, { merge: true });

    console.log(`🚀 ¡ÉXITO! El usuario ${email} ahora es Administrador Global.`);
    console.log('---');
    console.log('Recuerda que el usuario debe cerrar y volver a iniciar sesión para que los cambios se reflejen en la UI.');
    
    process.exit(0);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: No se encontró el archivo serviceAccountKey.json en la raíz del proyecto.');
    } else if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: El usuario ${email} no existe en Firebase Authentication.`);
    } else {
      console.error('❌ Error inesperado:', error.message);
      if (error.stack) console.debug(error.stack);
    }
    process.exit(1);
  }
}

promoteUser();
