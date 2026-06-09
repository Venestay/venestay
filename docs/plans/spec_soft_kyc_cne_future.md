# Especificación Técnica: KYC Suave (Soft KYC) para Implementación Futura

Este documento almacena los diseños de contratos, la lógica de backend en Cloud Functions y la regulación de seguridad en Firestore Rules para el módulo de KYC Suave, listo para ser implementado cuando el negocio lo requiera.

---

## 1. Esquema de Datos y Contratos (Types)

### Modificación en `src/features/auth/types/index.ts`
Se define la interfaz `UserPassport` y se actualiza `UserProfile` para incluirla, removiendo referencias a imágenes de documentos para eliminar la persistencia de archivos físicos:

```typescript
export interface UserPassport {
  uid: string;
  kycType: 'light';
  cneMatchStatus: 'MATCHED' | 'NOT_MATCHED' | 'PENDING' | 'FAILED';
  phoneVerified: boolean;
  emailVerified: boolean;
  verifiedAt?: string | null;
  trustScore: number;
  idNumber: string;
  fullName: string;
}

export interface UserKYCFields {
  kycStatus: KYCStatus;
  isIdentityVerified: boolean;
  kycStatusHistory: KYCStatusHistoryEntry[];
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  kycRejectionNote?: string;
  kycType?: 'light';
  cneMatchStatus?: 'MATCHED' | 'NOT_MATCHED' | 'PENDING' | 'FAILED';
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

// Dentro de UserProfile:
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  createdAt: string | number | Date | { seconds: number; nanoseconds: number } | FieldValue;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isIdentityVerified?: boolean;
  kycStatus?: KYCStatus;
  isVerified?: boolean;
  kycStatusHistory?: KYCStatusHistoryEntry[];
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  kycRejectionNote?: string;
  kycType?: 'light';
  cneMatchStatus?: 'MATCHED' | 'NOT_MATCHED' | 'PENDING' | 'FAILED';
  phoneVerified?: boolean;
  emailVerified?: boolean;
  passport?: UserPassport;
  // ... resto de campos del perfil
}
```

---

## 2. Lógica de Backend (Cloud Functions)

### Cloud Function `verifyCivilIdentity` en `functions/src/kyc.functions.ts`
Implementación de la simulación de cruce de datos con el registro del CNE y actualización atómica del Trust Score al 45%:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function: verifyCivilIdentity
 * Realiza el KYC suave cruzando la cédula y nombre del usuario con la base del CNE.
 * Actualiza atómicamente el perfil del usuario a verificado con un Trust Score del 45%.
 */
export const verifyCivilIdentity = functions.https.onCall(
  async (data: { idNumber: string; fullName: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida.');
    }

    const { idNumber, fullName } = data;
    if (!idNumber || !fullName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'El número de cédula y el nombre completo son campos obligatorios.'
      );
    }

    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);

    // Normalización de nombres
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim();

    // Simulación del Registro del CNE (Pilar 1)
    const CNE_MOCK_REGISTRY: Record<string, string> = {
      '12345678': 'Carlos Alberto Zabala',
      '87654321': 'Maria Alejandra Rodriguez',
      '99999999': 'Test Guest User',
    };

    let matchStatus: 'MATCHED' | 'NOT_MATCHED' = 'NOT_MATCHED';
    const cleanInputName = normalize(fullName);

    if (CNE_MOCK_REGISTRY[idNumber]) {
      const cleanRegistryName = normalize(CNE_MOCK_REGISTRY[idNumber]);
      if (cleanInputName === cleanRegistryName || cleanRegistryName.includes(cleanInputName) || cleanInputName.includes(cleanRegistryName)) {
        matchStatus = 'MATCHED';
      }
    } else if (/^\d{7,9}$/.test(idNumber)) {
      matchStatus = 'MATCHED';
    }

    if (matchStatus === 'NOT_MATCHED') {
      throw new functions.https.HttpsError(
        'already-exists',
        'No se pudo verificar la identidad: Los datos provistos no coinciden con el registro electoral público.'
      );
    }

    // Transacción Firestore
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();

      // Pilares 2 y 3: email y teléfono verificados
      const emailVerified = user?.isEmailVerified || false;
      const phoneVerified = user?.isPhoneVerified || !!user?.phoneNumber;

      const historyEntry = {
        status: 'VERIFIED',
        timestamp: new Date().toISOString(),
        actorId: 'system-cne',
        actorRole: 'admin',
        note: `KYC Suave verificado vía CNE. Coincidencia CNE: ${matchStatus}.`,
      };

      const passportData = {
        uid,
        kycType: 'light',
        cneMatchStatus: matchStatus,
        phoneVerified,
        emailVerified,
        verifiedAt: new Date().toISOString(),
        trustScore: 45, // Establece el Trust Score al 45% (supera el Trust Gate de 40%)
        idNumber,
        fullName,
      };

      tx.update(userRef, {
        kycStatus: 'VERIFIED',
        isIdentityVerified: true,
        trustScore: 45,
        kycType: 'light',
        cneMatchStatus: matchStatus,
        phoneVerified,
        emailVerified,
        passport: passportData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        kycStatusHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
      });
    });

    return { success: true, trustScore: 45 };
  }
);
```

---

## 3. Reglas de Seguridad de Firestore (`firestore.rules`)

Protección en la actualización de perfiles de usuario (`/users/{userId}`) para bloquear cambios client-side sobre campos de KYC:

```firestore
      allow update: if isSignedIn() && (
                    (request.auth.uid == userId && !incoming().diff(existing()).affectedKeys().hasAny([
                      'loyaltyStats', 'currentCommissionRate', 'role', 'kycStatus', 
                      'isIdentityVerified', 'trustScore', 'kycDocumentUrl', 'kycStatusHistory', 
                      'kycType', 'cneMatchStatus', 'phoneVerified', 'emailVerified', 'passport'
                    ])) ||
                    isAdmin()
                  );
```
