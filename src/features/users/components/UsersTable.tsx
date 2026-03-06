import { Pencil, UserX } from 'lucide-react';
import type { Proyectista } from '../types';

interface UsersTableProps {
  users: Proyectista[];
  isLoading: boolean;
  error: Error | null;
  currentUserEmail?: string;
  onEdit: (user: Proyectista) => void;
  onDeactivate: (user: Proyectista) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (raw: string): string => {
  if (raw.includes('T')) {
    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      const h = date.getUTCHours();
      const m = date.getUTCMinutes();
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
    }
  }
  return raw;
};

const formatSchedule = (start?: string, end?: string) => {
  if (!start || !end) return 'Sin horario';
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const ROLE_LABELS: Record<string, string> = {
  DRAFTER: 'Proyectista',
  DATA_ENTRY: 'Capturista',
  LOCAL_ADMIN: 'Admin Local',
  SUPER_ADMIN: 'Notario Titular',
};

export const UsersTable = ({
  users,
  isLoading,
  error,
  currentUserEmail,
  onEdit,
  onDeactivate,
}: UsersTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-gray-400">Cargando proyectistas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
        <div className="text-red-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-600 font-medium">
          Error al cargar los proyectistas
        </p>
        <p className="text-red-400 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-300 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-lg font-medium">
          No se encontraron proyectistas
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Intenta ajustar los filtros de búsqueda o agrega uno nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Foto
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Fecha de ingreso
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Horario
              </th>
              <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Trabajos asignados
              </th>
              <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                    {getInitials(user.full_name)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-800">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(user.hire_date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatSchedule(user.start_time, user.end_time)}
                </td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  —
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    {user.status === 'INACTIVE' || (currentUserEmail && user.email === currentUserEmail) ? (
                      <span
                        className="p-2 rounded-lg text-gray-300 cursor-not-allowed"
                        title={
                          currentUserEmail && user.email === currentUserEmail
                            ? 'No puedes desactivar tu propia cuenta'
                            : 'El usuario ya está inactivo'
                        }
                      >
                        <UserX size={16} />
                      </span>
                    ) : (
                      <button
                        onClick={() => onDeactivate(user)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Cambiar a inactivo"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
