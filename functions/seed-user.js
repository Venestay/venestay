const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'gen-lang-client-0727178605'
});

async function seed() {
  try {
    const db = admin.firestore();

    console.log('Creando usuario en Auth Emulator...');
    const userRecord = await admin.auth().createUser({
      email: 'rodriguezzcarlose@gmail.com',
      emailVerified: true,
      password: 'Cerz1015.',
      displayName: 'Carlos E',
    });
    
    const uid = userRecord.uid;
    console.log('Usuario creado exitosamente con UID:', uid);

    console.log('Asignando Custom Claims (Rol de Anfitrión)...');
    await admin.auth().setCustomUserClaims(uid, { host: true, admin: true, role: 'admin' });

    console.log('Creando perfil verificado en Firestore...');
    await db.collection('users').doc(uid).set({
      email: 'rodriguezzcarlose@gmail.com',
      displayName: 'Carlos E',
      role: 'admin',
      kycStatus: 'VERIFIED',
      trustScore: 100, // Score máximo para que pueda hacer todo
      createdAt: new Date().toISOString()
    });

    console.log('✅ ¡Usuario creado y configurado con éxito en el emulador!');
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('El usuario ya existe en Auth. Actualizando permisos...');
      const user = await admin.auth().getUserByEmail('rodriguezzarlose@gmail.com');
      const uid = user.uid;
      
      const db = admin.firestore();
      await admin.auth().setCustomUserClaims(uid, { host: true, admin: true, role: 'admin' });
      await db.collection('users').doc(uid).set({
        email: 'rodriguezzcarlose@gmail.com',
        displayName: 'Carlos E',
        role: 'admin',
        kycStatus: 'VERIFIED',
        trustScore: 100,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ ¡Usuario actualizado y configurado con éxito!');
    } else {
      console.error('❌ Error al crear el usuario:', error);
    }
  }
}

seed();
