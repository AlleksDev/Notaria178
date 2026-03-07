export const getDisplayRole = (role: string): string => {
  const normalized = role.toUpperCase().replace(/[\s-]+/g, '_');
  switch (normalized) {
    case 'SUPER_ADMIN':
      return 'Notario Titular';
    case 'LOCAL_ADMIN':
    case 'ADMIN_LOCAL':
      return 'Proyectista A+';
    case 'DRAFTER':
      return 'Proyectista';
    case 'DATA_ENTRY':
      return 'Capturista';
    default:
      return role
        .split(/[_\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
  }
};
