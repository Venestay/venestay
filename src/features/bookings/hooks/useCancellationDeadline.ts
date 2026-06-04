import { subDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CancellationPolicyType } from '@/features/listings/types';

const GRACE_DAYS: Record<CancellationPolicyType, number> = {
  flexible: 2,
  moderate: 7,
  strict: 30,
  non_refundable_reschedulable: 0,
};

export function calculateCancellationDeadline(
  startDate: string | undefined,
  policyType: CancellationPolicyType = 'moderate'
) {
  if (!startDate) return { deadlineDate: null, deadlineFormatted: null, isExpired: false };

  const checkinDate = parseISO(startDate);
  const graceDays = GRACE_DAYS[policyType];
  const deadlineDate = subDays(checkinDate, graceDays);
  const now = new Date();
  
  // Normalize dates to start of day for accurate comparison
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  
  const isExpired = nowStart > deadlineStart;

  return {
    deadlineDate,
    deadlineFormatted: format(deadlineDate, "d 'de' MMMM", { locale: es }),
    isExpired,
  };
}
