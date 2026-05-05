import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';

/**
 * Proactive Image Compression Options
 * Targeted for <500KB and maximum 1920px width for Premium quality on high-density screens.
 */
const compressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8,
};

/**
 * Compresses an image file before upload.
 * @param file The original File object from the input.
 * @returns A compressed Blob/File.
 */
export const compressImage = async (file: File): Promise<File> => {
  try {
    console.log(`[Storage] Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log(`[Storage] Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error('[Storage] Compression failed, falling back to original.', error);
    return file;
  }
};

/**
 * Uploads a listing image to Firebase Storage.
 * Path: listings/{listingId}/{timestamp}_{filename}
 * @param listingId The ID of the property listing.
 * @param file The image file to upload.
 * @returns The download URL of the uploaded image.
 */
export const uploadListingImage = async (listingId: string, file: File): Promise<string> => {
  // 1. Proactive Compression
  const compressedFile = await compressImage(file);
  
  // 2. Create Reference
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `listings/${listingId}/${fileName}`);
  
  // 3. Upload
  const snapshot = await uploadBytes(storageRef, compressedFile, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      listingId: listingId,
      agenticVerified: 'true'
    }
  });
  
  // 4. Get URL
  return getDownloadURL(snapshot.ref);
};

/**
 * Deletes an image from Firebase Storage using its download URL.
 * @param url The full download URL of the image.
 */
export const deleteImageByUrl = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('[Storage] Error deleting image:', error);
    throw error;
  }
};
