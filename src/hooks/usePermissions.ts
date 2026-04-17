// src/hooks/usePermissions.ts
import { useAuthStore } from '../store/authStore';

const ADMIN_ROLES = ['SUPER_ADMIN', 'LOCAL_ADMIN'];

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? '';

  return {
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: ADMIN_ROLES.includes(role),
    canManageUsers: ADMIN_ROLES.includes(role),
    canViewGlobalDashboard: ADMIN_ROLES.includes(role),
  };
};
