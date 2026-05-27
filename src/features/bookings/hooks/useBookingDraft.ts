/**
 * useBookingDraft
 *
 * Encapsula la persistencia del borrador de reserva en localStorage
 * con un TTL de 4 horas. Permite al usuario reanudar la reserva después
 * de completar el flujo de Auth o KYC sin perder el contexto.
 *
 * Reglas:
 * - Solo se persiste información no sensible (ids, fechas, huéspedes).
 * - El draft expira automáticamente tras 4 horas.
 * - Se limpia después de una reserva confirmada.
 */

const DRAFT_KEY = 'venestay_booking_draft';
const TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

export interface BookingDraftData {
  listingId: string;
  startDate: string;
  endDate: string;
  guests: number;
  /** URL completa de retorno (pathname + search) para reanudar el checkout */
  returnUrl: string;
}

interface StoredDraft {
  data: BookingDraftData;
  expiresAt: number;
}

const saveDraft = (data: BookingDraftData): void => {
  const stored: StoredDraft = {
    data,
    expiresAt: Date.now() + TTL_MS,
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
  } catch {
    // localStorage no disponible (modo privado muy restrictivo)
  }
};

const restoreDraft = (): BookingDraftData | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const stored: StoredDraft = JSON.parse(raw);
    if (Date.now() > stored.expiresAt) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return stored.data;
  } catch {
    return null;
  }
};

const clearDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // no-op
  }
};

const hasDraft = (): boolean => restoreDraft() !== null;

export const useBookingDraft = () => ({
  saveDraft,
  restoreDraft,
  clearDraft,
  hasDraft,
});
