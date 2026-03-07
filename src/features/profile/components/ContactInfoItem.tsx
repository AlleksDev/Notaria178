import type { ReactNode } from 'react';

interface ContactInfoItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export const ContactInfoItem = ({ icon, label, value }: ContactInfoItemProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2 text-gray-400">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-sm text-gray-700 font-medium">{value}</p>
  </div>
);
