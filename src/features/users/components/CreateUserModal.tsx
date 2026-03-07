import { useState, useEffect } from 'react';
import { X, Loader2, Clock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { isAxiosError } from 'axios';
import { createUser } from '../api/usersApi';
import type { CreateProyectistaRequest } from '../types';
import { getBranches } from '../../branches/api/branchesApi';
import type { Branch } from '../../branches/types';

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
    start_time: '',
    end_time: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const res = await getBranches();
        setBranches(res.data || []);
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

  const isFormValid =
    form.full_name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.password !== '' &&
    confirmPassword !== '' &&
    form.phone?.trim() !== '' &&
    form.branch_id?.trim() !== '' &&
    form.role !== '';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Este campo es obligatorio';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Este campo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Correo inválido';
    }

    if (!form.password) {
      newErrors.password = 'Este campo es obligatorio';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Este campo es obligatorio';
    } else if (form.password && form.password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!form.phone?.trim()) {
      newErrors.phone = 'Este campo es obligatorio';
    }

    if (!form.branch_id?.trim()) {
      newErrors.branch_id = 'Este campo es obligatorio';
    }

    if (!form.role) {
      newErrors.role = 'Este campo es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSubmitted(true);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: CreateProyectistaRequest = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone?.trim(),
        branch_id: form.branch_id?.trim(),
      };
      if (form.start_time) payload.start_time = form.start_time;
      if (form.end_time) payload.end_time = form.end_time;

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
      start_time: '',
      end_time: '',
    });
    setConfirmPassword('');
    setErrors({});
    setApiError('');
    setSubmitted(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
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

  const inputBase =
    'w-full border-b bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors';
  const inputOk = 'border-gray-300 focus:border-primary';
  const inputErr = 'border-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Agregar{' '}
              <span className="italic text-primary">Proyectista</span>
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="w-12 h-1 bg-primary mt-3" />
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5">
          {/* Divider */}
          <div className="h-px bg-gray-200 mb-5" />

          {/* Descriptive text */}
          <p className="text-sm text-gray-500 mb-1">
            Completa la información del nuevo proyectista para registrarlo en el
            sistema.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Los campos con asterisco <span className="text-red-500 font-bold">*</span>{' '}
            son obligatorios.
          </p>

          {apiError && (
            <div className="p-3 mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {apiError}
            </div>
          )}

          {/* NOMBRE COMPLETO - full width */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              className={`${inputBase} ${errors.full_name ? inputErr : inputOk}`}
              placeholder="Ej. Maria del Rosario Lopez Hernandez"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* CORREO + TELÉFONO - 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                placeholder="ejemplo@gmail.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
                placeholder="961 000 0000"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* ROL + SUCURSAL - 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Rol <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  className={`${inputBase} bg-transparent appearance-none cursor-pointer pr-8 ${
                    errors.role ? inputErr : inputOk
                  }`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">{errors.role}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Sucursal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.branch_id || ''}
                  onChange={(e) => updateField('branch_id', e.target.value)}
                  disabled={isLoadingBranches}
                  className={`${inputBase} bg-transparent appearance-none cursor-pointer pr-8 disabled:opacity-50 ${
                    errors.branch_id ? inputErr : inputOk
                  }`}
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {isLoadingBranches ? (
                  <div className="absolute right-0 top-2.5">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <ChevronDown className="absolute right-0 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                )}
              </div>
              {errors.branch_id && (
                <p className="mt-1 text-xs text-red-500">{errors.branch_id}</p>
              )}
            </div>
          </div>

          {/* HORA ENTRADA + HORA SALIDA - 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Hora de entrada
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={form.start_time || ''}
                  onChange={(e) => updateField('start_time', e.target.value)}
                  className={`${inputBase} ${inputOk} pr-8`}
                />
                <Clock className="absolute right-0 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Hora de salida
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={form.end_time || ''}
                  onChange={(e) => updateField('end_time', e.target.value)}
                  className={`${inputBase} ${inputOk} pr-8`}
                />
                <Clock className="absolute right-0 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Divider before passwords */}
          <div className="h-px bg-gray-200 my-5" />

          {/* CONTRASEÑA - full width */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={`${inputBase} pr-8 ${errors.password ? inputErr : inputOk}`}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-0 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* CONFIRMAR CONTRASEÑA - full width */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.confirmPassword;
                      return copy;
                    });
                  }
                }}
                className={`${inputBase} pr-8 ${errors.confirmPassword ? inputErr : inputOk}`}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-0 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || (!isFormValid && !submitted)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider text-white rounded-lg transition-colors ${
                isLoading
                  ? 'bg-primary/60 cursor-wait'
                  : !isFormValid && !submitted
                    ? 'bg-primary/40 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </span>
              ) : (
                'Crear proyectista'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
