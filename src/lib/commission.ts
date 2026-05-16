/**
 * VeneStay Commission Engine (v2.2)
 * Handles the calculation of platform fees based on host performance and status.
 */

export type CommissionTier = 12 | 10 | 8;

export interface CommissionBreakdown {
  totalAmount: number;
  platformFee: number; // What VeneStay keeps
  hostNetProfit: number; // What the Host actually earns
  ucpDeposit: number; // 20% paid to platform
  ucpBalance: number; // 80% paid to host at check-in
  settlementAmount: number; // ucpDeposit - platformFee (What VeneStay owes the host)
  commissionTier: CommissionTier; // Persistent record of the rate applied
}

/**
 * Calculates the financial breakdown of a booking based on the host's commission tier.
 */
export const calculateCommission = (
  totalAmount: number,
  tier: CommissionTier = 12
): CommissionBreakdown => {
  const platformFee = totalAmount * (tier / 100);
  const hostNetProfit = totalAmount - platformFee;
  const ucpDeposit = totalAmount * 0.20;
  const ucpBalance = totalAmount * 0.80;
  
  // The settlement is what's left of the 20% deposit after VeneStay takes its cut.
  const settlementAmount = ucpDeposit - platformFee;

  return {
    totalAmount,
    platformFee,
    hostNetProfit,
    ucpDeposit,
    ucpBalance,
    settlementAmount,
    commissionTier: tier,
  };
};

/**
 * Determines the commission tier based on host metrics.
 * Rule: New = 12%, Verified = 10%, Superhost (>10 bookings) = 8%
 */
export const getCommissionTier = (
  isIdentityVerified: boolean,
  completedBookings: number
): CommissionTier => {
  if (completedBookings >= 10) return 8;
  if (isIdentityVerified) return 10;
  return 12;
};
