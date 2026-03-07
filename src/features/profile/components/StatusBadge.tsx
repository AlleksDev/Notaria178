interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const isActive = status === 'ACTIVE';

  return (
    <span
      className={`text-sm font-medium px-3 py-1 rounded-full ${
        isActive
          ? 'text-green-700 bg-green-100'
          : 'text-red-700 bg-red-100'
      }`}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
};
