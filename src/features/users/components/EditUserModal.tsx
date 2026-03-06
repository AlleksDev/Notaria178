import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { updateUser } from '../api/usersApi';
import type { Proyectista, UpdateProyectistaRequest } from '../types';

interface EditUserModalProps {
  isOpen: boolean;
  user: Proyectista | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: 'DRAFTER', label: 'Proyectista' },
  { value: 'DATA_ENTRY', label: 'Capturista' },
  { value: 'LOCAL_ADMIN', label: 'Administrador Local' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

const parseISOToTimeInput = (raw?: string): string => {
  if (!raw) return '';
  if (raw.includes('T')) {
    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      const h = String(date.getUTCHours()).padStart(2, '0');
      const m = String(date.getUTCMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }
  return raw;
};

export const EditUserModal = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) => {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
    status: '',
    phone: '',
    start_time: '',
    end_time: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name,
        email: user.email,
        password: '',
        role: user.role,
        status: user.status,
        phone: '',
        start_time: parseISOToTimeInput(user.start_time),
        end_time: parseISOToTimeInput(user.end_time),
      });
      setErrors({});
      setApiError('');
    }
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es obligatorio';
    }

    if (!form.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'El formato del correo no es válido';
    }

    if (form.password && form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: UpdateProyectistaRequest = {};

      if (form.full_name.trim() !== user.full_name) {
        payload.full_name = form.full_name.trim();
      }
      if (form.email.trim() !== user.email) {
        payload.email = form.email.trim();
      }
      if (form.password) {
        payload.password = form.password;
      }
      if (form.role !== user.role) {
        payload.role = form.role;
      }
      if (form.status !== user.status) {
        payload.status = form.status;
      }
      const origStart = parseISOToTimeInput(user.start_time);
      const origEnd = parseISOToTimeInput(user.end_time);
      if (form.start_time !== origStart) {
        payload.start_time = form.start_time;
      }
      if (form.end_time !== origEnd) {
        payload.end_time = form.end_time;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await updateUser(user.id, payload);
      onSuccess();
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(
          err.response?.data?.error || 'Error al actualizar el proyectista'
        );
      } else {
        setApiError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Editar proyectista
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña{' '}
              <span className="text-gray-400 font-normal">
                (dejar vacío para no cambiar)
              </span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de entrada
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de salida
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                isLoading
                  ? 'bg-[#C07D30]/70 cursor-wait'
                  : 'bg-[#C07D30] hover:bg-[#A86925]'
              }`}
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
