/**
 * @deprecated Usar `calculateTrustScore` de `@/services/user-service` directamente.
 * Este wrapper se mantiene por compatibilidad mientras se migran los consumidores
 * (CheckoutPage, ListingDetail, UserProfileSetup) en Fase B.
 *
 * skill: vercel-react-best-practices → client-swr-dedup
 * Ambas funciones evaluaban el mismo perfil con lógicas distintas.
 * Se unifica delegando a calculateTrustScore como fuente de verdad.
 */
import { UserProfile } from '@/types';
import { calculateTrustScore } from '@/services/user-service';

export const checkProfileCompletion = (profile: UserProfile | null): number => {
  if (!profile) return 0;
  return calculateTrustScore(profile);
};


