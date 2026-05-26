import { CancellationPolicyType } from '../types';

export const CANCELLATION_POLICIES: Record<CancellationPolicyType, {
  label: string;
  badgeColor: string;
  dotColor: string;
  detail: string;
}> = {
  flexible: {
    label: 'Cancelación Flexible',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    dotColor: 'bg-emerald-400',
    detail: 'Reembolso completo del depósito del 20% si cancelas hasta 48 horas antes del check-in.',
  },
  moderate: {
    label: 'Cancelación Moderada',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-100',
    dotColor: 'bg-amber-400',
    detail: 'Reembolso completo del depósito del 20% si cancelas hasta 7 días antes de la fecha de llegada.',
  },
  strict: {
    label: 'Cancelación Estricta',
    badgeColor: 'text-red-700 bg-red-50 border-red-100',
    dotColor: 'bg-red-400',
    detail: 'Reembolso completo del depósito del 20% hasta 30 días antes. Reembolso del 50% entre 30 y 14 días. Sin reembolso en los últimos 14 días.',
  },
};

export interface TimelineMilestone {
  label: string;
  daysBeforeCheckin: number;
  refundPct: number;
}

export const POLICY_TIMELINE: Record<CancellationPolicyType, {
  milestones: TimelineMilestone[];
  strictNote?: string;
}> = {
  flexible: {
    milestones: [
      { label: 'Reserva', daysBeforeCheckin: Infinity, refundPct: 100 },
      { label: 'Hasta 48h antes', daysBeforeCheckin: 2, refundPct: 100 },
      { label: 'Menos de 48h', daysBeforeCheckin: 0, refundPct: 0 },
    ],
  },
  moderate: {
    milestones: [
      { label: 'Reserva', daysBeforeCheckin: Infinity, refundPct: 100 },
      { label: 'Hasta 7 días antes', daysBeforeCheckin: 7, refundPct: 100 },
      { label: 'Menos de 7 días', daysBeforeCheckin: 0, refundPct: 0 },
    ],
  },
  strict: {
    milestones: [
      { label: 'Hasta 30 días antes', daysBeforeCheckin: 30, refundPct: 100 },
      { label: 'Entre 30 y 14 días', daysBeforeCheckin: 14, refundPct: 50 },
      { label: 'Últimos 14 días', daysBeforeCheckin: 0, refundPct: 0 },
    ],
    strictNote: 'Sin reembolso del depósito en los 14 días anteriores al check-in.',
  },
};
