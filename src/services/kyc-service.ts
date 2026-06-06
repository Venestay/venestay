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

/**
 * Obtiene la URL firmada temporal para visualizar el documento KYC de un usuario.
 * Solo ejecutable por administradores.
 */
export async function getKYCSignedUrl(targetUserId: string): Promise<string> {
  const getUrlFn = httpsCallable<{ targetUserId: string }, { signedUrl: string }>(functions, 'getKYCDocumentSignedURL');
  const result = await getUrlFn({ targetUserId });
  return result.data.signedUrl;
}

/**
 * Aprueba el documento KYC del usuario (cambia a VERIFIED, +40 trustScore).
 */
export async function approveKYC(targetUserId: string): Promise<void> {
  const approveFn = httpsCallable<{ targetUserId: string }, { success: boolean }>(functions, 'approveKYC');
  await approveFn({ targetUserId });
}

/**
 * Rechaza el documento KYC del usuario con un motivo (cambia a REJECTED, elimina archivo).
 */
export async function rejectKYC(targetUserId: string, note: string): Promise<void> {
  const rejectFn = httpsCallable<{ targetUserId: string; note: string }, { success: boolean }>(functions, 'rejectKYC');
  await rejectFn({ targetUserId, note });
}

