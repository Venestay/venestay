import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '@/lib/firebase';

/**
 * Sube un documento de identidad a Firebase Storage bajo /kyc/{userId}/
 * y luego llama a la Cloud Function callable 'submitKYCDocument' para transicionar el estado.
 */
export async function uploadAndSubmitKYCDocument(
  userId: string,
  file: File,
  documentType: 'cedula' | 'pasaporte'
): Promise<void> {
  // 1. Subir el archivo a Storage
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${documentType}_${Date.now()}.${extension}`;
  const storageRef = ref(storage, `kyc/${userId}/${fileName}`);
  
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      userId,
      documentType,
    }
  });

  // 2. Llamar a la Cloud Function para registrar en Firestore
  // (el cliente NUNCA escribe kycStatus directamente)
  const submitFn = httpsCallable(functions, 'submitKYCDocument');
  await submitFn({ documentType, storageFileName: fileName });
}
