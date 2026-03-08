import { BarChart3, CheckCircle2, XCircle } from 'lucide-react';

export interface KpiCardsProps {
  total: number | string;
  active: number | string;
  inactive: number | string;
  isLoading?: boolean;
  totalLabel?: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const KpiCards = ({
  total,
  active,
  inactive,
  isLoading = false,
  totalLabel = 'TOTAL',
  activeLabel = 'ACTIVOS',
  inactiveLabel = 'INACTIVOS',
}: KpiCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-white border border-gray-100 shadow-sm animate-pulse h-24"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="relative overflow-hidden rounded-xl p-5 bg-primary text-white shadow-sm transition-transform hover:-translate-y-1 duration-200 flex flex-col justify-center">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-white/80">
          {totalLabel}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold">{total}</span>
          <BarChart3 size={32} className="text-white/20" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl p-5 bg-badge-approved-bg text-badge-approved-text border border-green-200 shadow-sm transition-transform hover:-translate-y-1 duration-200 flex flex-col justify-center">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-badge-approved-text/70">
          {activeLabel}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold">{active}</span>
          <CheckCircle2 size={32} className="text-green-500/50" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl p-5 bg-badge-rejected-bg text-badge-rejected-text border border-red-200 shadow-sm transition-transform hover:-translate-y-1 duration-200 flex flex-col justify-center">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-badge-rejected-text/70">
          {inactiveLabel}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold">{inactive}</span>
          <XCircle size={32} className="text-red-500/50" />
        </div>
      </div>
    </div>
  );
};
