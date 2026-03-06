import { useState } from 'react';
import { X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { createUser } from '../api/usersApi';
import type { CreateProyectistaRequest } from '../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: 'DRAFTER', label: 'Proyectista' },
  { value: 'DATA_ENTRY', label: 'Capturista' },
  { value: 'LOCAL_ADMIN', label: 'Administrador Local' },
];

export const CreateUserModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) => {
  const [form, setForm] = useState<CreateProyectistaRequest>({
    full_name: '',
    email: '',
    password: '',
    role: 'DRAFTER',
    phone: '',
    branch_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    if (!form.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!form.role) {
      newErrors.role = 'El rol es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: CreateProyectistaRequest = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      if (form.phone?.trim()) payload.phone = form.phone.trim();
      if (form.branch_id?.trim()) payload.branch_id = form.branch_id.trim();

      await createUser(payload);
      resetForm();
      onSuccess();
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(
          err.response?.data?.error || 'Error al crear el proyectista'
        );
      } else {
        setApiError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      full_name: '',
      email: '',
      password: '',
      role: 'DRAFTER',
      phone: '',
      branch_id: '',
    });
    setErrors({});
    setApiError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateField = (field: keyof CreateProyectistaRequest, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Agregar proyectista
          </h2>
          <button
            onClick={handleClose}
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
              placeholder="Ej: Juan Pérez López"
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
              placeholder="ejemplo@correo.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white ${
                errors.role ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-500">{errors.role}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={form.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Ej: 961 123 4567"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
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
              {isLoading ? 'Creando...' : 'Crear proyectista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
