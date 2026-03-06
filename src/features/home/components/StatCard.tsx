import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  theme?: 'primary' | 'process' | 'pending' | 'review' | 'approved' | 'rejected';
}

const themeStyles = {
  primary: {
    wrapper: 'bg-primary text-white',
    title: 'text-white/80',
    iconColor: 'text-white/20',
  },
  process: {
    wrapper: 'bg-badge-process-bg text-badge-process-text border border-gray-200',
    title: 'text-badge-process-text/70',
    iconColor: 'text-badge-process-icon',
  },
  pending: {
    wrapper: 'bg-badge-pending-bg text-badge-pending-text border border-yellow-200',
    title: 'text-badge-pending-text/70',
    iconColor: 'text-yellow-600/50',
  },
  review: {
    wrapper: 'bg-badge-review-bg text-badge-review-text border border-blue-200',
    title: 'text-badge-review-text/70',
    iconColor: 'text-blue-500/50',
  },
  approved: {
    wrapper: 'bg-badge-approved-bg text-badge-approved-text border border-green-200',
    title: 'text-badge-approved-text/70',
    iconColor: 'text-green-500/50',
  },
  rejected: {
    wrapper: 'bg-badge-rejected-bg text-badge-rejected-text border border-red-200',
    title: 'text-badge-rejected-text/70',
    iconColor: 'text-red-500/50',
  },
};

export const StatCard = ({ title, value, icon, theme = 'process' }: StatCardProps) => {
  const styles = themeStyles[theme];

  return (
    <div className={`relative overflow-hidden rounded-xl p-5 ${styles.wrapper} shadow-sm transition-transform hover:-translate-y-1 duration-200`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${styles.title}`}>
        {title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-4xl font-bold">{value}</span>
        <div className={styles.iconColor}>
          {icon}
        </div>
      </div>
    </div>
  );
};
