import { getDisplayRole } from '../utils/roleMapping';

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => (
  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
    {getDisplayRole(role)}
  </span>
);
