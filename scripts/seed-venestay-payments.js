/**
 * SEED SCRIPT — config/venestay_payments
 * SPEC-CHECKOUT-PAY-001 v2.0
 *
 * Crea el documento de métodos de pago corporativos de VeneStay en Firestore.
 * Usar con datos de PRUEBA en desarrollo. Reemplazar con datos reales antes del deploy a producción.
 *
 * Uso: node scripts/seed-venestay-payments.js
 *
 * Requiere: GOOGLE_APPLICATION_CREDENTIALS apuntando al service account del proyecto,
 * o ejecutarse en un entorno con Firebase Admin SDK ya autenticado (CI/CD, Cloud Shell).
 */

const admin = require('firebase-admin');

// Inicializar con el proyecto correcto
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gen-lang-client-0727178605', // Proyecto VeneStay en Firebase
  });
}

const db = admin.firestore();

const VENESTAY_PAYMENT_METHODS_TEST = {
  methods: [
    {
      id: 'vs_pagomovil',
      type: 'PagoMovil',
      label: 'Pago Móvil VeneStay C.A. [PRUEBA]',
      isVerified: true,
      data: {
        phoneNumber: '04140000000',     // ← Reemplazar con número real en producción
        idNumber: 'J-00000000-0',       // ← Reemplazar con RIF real en producción
        bankName: 'Banco de Pruebas',   // ← Reemplazar con banco real en producción
        accountHolder: 'VeneStay C.A.',
      },
    },
    {
      id: 'vs_zelle',
      type: 'Zelle',
      label: 'Zelle VeneStay [PRUEBA]',
      isVerified: true,
      data: {
        email: 'pagos-test@venestay.com', // ← Reemplazar con email real en producción
        accountHolder: 'VeneStay C.A.',
      },
    },
  ],
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedBy: 'seed-script-dev',
  environment: 'development', // Eliminar este campo en producción
};

async function seedVenestayPayments() {
  try {
    const docRef = db.collection('config').doc('venestay_payments');
    await docRef.set(VENESTAY_PAYMENT_METHODS_TEST, { merge: true });
    console.log('✅ config/venestay_payments creado correctamente con datos de PRUEBA.');
    console.log('   Recuerda reemplazar los datos con los reales antes del deploy a producción.');
  } catch (error) {
    console.error('❌ Error al crear config/venestay_payments:', error);
    process.exit(1);
  }
}

seedVenestayPayments();
