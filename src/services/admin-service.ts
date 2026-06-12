import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface TestBookingPreview {
  bookingId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface PurgePreviewResult {
  testBookings: TestBookingPreview[];
  count: number;
}

export interface PurgeResult {
  cancelledCount: number;
  releasedDates: number;
}

// Paso 1: obtener preview ANTES de ejecutar nada
export async function previewTestBookings(
  listingId: string
): Promise<PurgePreviewResult> {
  const fn = httpsCallable(functions, 'previewTestBookings');
  const result = await fn({ listingId });
  return result.data as PurgePreviewResult;
}

// Paso 2: ejecutar la purga solo de los IDs confirmados
export async function purgeTestBookings(
  listingId: string,
  bookingIds: string[]
): Promise<PurgeResult> {
  const fn = httpsCallable(functions, 'purgeTestBookings');
  const result = await fn({ listingId, bookingIds });
  return result.data as PurgeResult;
}
