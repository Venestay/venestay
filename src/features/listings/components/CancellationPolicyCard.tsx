import React from 'react';
import { CancellationPolicyType } from '../types';
import { CANCELLATION_POLICIES, POLICY_TIMELINE } from '../utils/cancellationPolicies';
import { Calendar, HelpCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancellationPolicyCardProps {
  policyType: CancellationPolicyType;
  className?: string;
}

export const CancellationPolicyCard: React.FC<CancellationPolicyCardProps> = ({
  policyType,
  className,
}) => {
  const policyInfo = CANCELLATION_POLICIES[policyType];
  const timelineInfo = POLICY_TIMELINE[policyType];

  if (!policyInfo) return null;

  const isNonRefundableReschedulable = policyType === 'non_refundable_reschedulable';

  return (
    <div
      role="region"
      aria-label={`Detalles de la política de cancelación: ${policyInfo.label}`}
      className={cn(
        "rounded-[24px] border p-5 md:p-6 transition-all duration-300",
        isNonRefundableReschedulable
          ? "bg-[#0B1120]/[0.02] border-[#C5A059]/20 hover:border-[#C5A059]/40 shadow-sm"
          : "bg-slate-50/50 border-slate-100 hover:border-slate-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className={cn(
            "h-2.5 w-2.5 rounded-full animate-pulse shrink-0",
            isNonRefundableReschedulable ? "bg-[#C5A059]" : policyInfo.dotColor
          )} />
          <h4 className={cn(
            "text-xs font-black uppercase tracking-wider",
            isNonRefundableReschedulable ? "text-[#0B1120]" : "text-[#0B1120]/80"
          )}>
            {policyInfo.label}
          </h4>
        </div>
        {isNonRefundableReschedulable && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-100">
            <AlertCircle className="h-3 w-3 shrink-0" />
            No Reembolsable
          </span>
        )}
      </div>

      {/* Main Description */}
      <p className="text-xs font-semibold leading-relaxed text-slate-600 mb-5">
        {policyInfo.detail}
      </p>

      {/* Timeline / Milestones */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0B1120]/40 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          Hitos del Viaje
        </h5>
        
        <div className="relative pl-4 space-y-4 border-l border-slate-200/80 ml-2">
          {timelineInfo?.milestones.map((milestone, idx) => (
            <div key={idx} className="relative">
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 bg-white transition-colors",
                milestone.refundPct > 0 
                  ? "border-emerald-500" 
                  : isNonRefundableReschedulable
                    ? "border-[#C5A059]"
                    : "border-slate-300"
              )} />
              
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-800">
                  {milestone.label}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {milestone.daysBeforeCheckin === Infinity
                    ? "Al momento de confirmar la reserva"
                    : milestone.daysBeforeCheckin === 0
                      ? "Día del check-in"
                      : `Hasta ${milestone.daysBeforeCheckin} días antes del check-in`}
                </span>
                <span className={cn(
                  "text-[10px] font-black mt-0.5",
                  milestone.refundPct === 100 
                    ? "text-emerald-600" 
                    : milestone.refundPct === 50 
                      ? "text-amber-600" 
                      : "text-red-500"
                )}>
                  Reembolso del Depósito: {milestone.refundPct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strict / Adjustment Notes */}
      {timelineInfo?.strictNote && (
        <div className="mt-5 flex gap-2.5 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100/50">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold leading-relaxed text-amber-800">
            {timelineInfo.strictNote}
          </p>
        </div>
      )}
    </div>
  );
};
