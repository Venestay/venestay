import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormat(
  dateStr: string | number | Date | unknown,
  formatStr: string,
  options?: unknown
) {
  try {
    if (!dateStr) return '';
    const date = new Date(dateStr as string | number | Date);
    if (isNaN(date.getTime())) return '';
    return format(date, formatStr, options);
  } catch (e) {
    return '';
  }
}

import { calculateCommission, CommissionTier } from './commission';

export interface PaymentBreakdown {
  total: number;
  depositAmount: number;
  platformFee: number;
  hostPayout: number;
  remainingBalance: number;
}

export function calculatePaymentBreakdown(total: number, tier: CommissionTier = 12, cleaningFee: number = 0): PaymentBreakdown {
  const breakdown = calculateCommission(total, tier);
  return {
    total: total + cleaningFee,
    depositAmount: breakdown.ucpDeposit,
    platformFee: breakdown.platformFee,
    hostPayout: breakdown.settlementAmount,
    remainingBalance: breakdown.ucpBalance + cleaningFee,
  };
}

export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // If it's already a full ISO string with time, just parse it
  if (dateStr.includes('T')) return new Date(dateStr);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
}


