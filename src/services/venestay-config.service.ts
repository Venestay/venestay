/**
 * venestay-config.service.ts
 * SPEC-CHECKOUT-PAY-001 v2.0
 *
 * Servicio de configuración corporativa de VeneStay.
 * Encapsula la lectura del documento `config/venestay_payments` de Firestore.
 *
 * REGLA ARQUITECTÓNICA: El Checkout (y cualquier otro componente) NO llama a
 * Firestore directamente para obtener esta config. Toda integración pasa por este service.
 */

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { PaymentMethod } from '@/types';

/**
 * Obtiene los métodos de pago corporativos de VeneStay desde Firestore.
 * Retorna un array vacío si el documento no existe (fallback silencioso).
 */
export async function getVenestayPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const snap = await getDoc(doc(db, 'config', 'venestay_payments'));
    if (!snap.exists()) {
      console.warn('[venestay-config.service] config/venestay_payments no existe en Firestore.');
      return [];
    }
    const data = snap.data();
    return (data?.methods ?? []) as PaymentMethod[];
  } catch (error) {
    console.error('[venestay-config.service] Error al cargar métodos de pago de VeneStay:', error);
    return [];
  }
}
