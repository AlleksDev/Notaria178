import { useState } from 'react';
import type { UserProfile, UpdateProfilePayload } from '../types';
import { Pencil, Mail, Phone, Lock, Calendar, Clock, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { ContactInfoItem } from './ContactInfoItem';
import { updateProfile } from '../api/profileApi';

interface ProfileUserCardProps {
  profile: UserProfile;
  onSaveSuccess?: () => void;
  showEditButton?: boolean;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

const formatHireDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

const formatScheduleTime = (time?: string) => {
  if (!time) return '--:--';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${String(displayHour).padStart(2, '0')}:${m} ${ampm}`;
};

export const ProfileUserCard = ({
  profile,
  onSaveSuccess,
  showEditButton = true,
}: ProfileUserCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateProfilePayload>({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPrivileged = profile.role === 'SUPER_ADMIN' || profile.role === 'LOCAL_ADMIN';

  const schedule =
    profile.start_time || profile.end_time
      ? `${formatScheduleTime(profile.start_time)} - ${formatScheduleTime(profile.end_time)}`
      : 'Sin horario asignado';

  const handleEditClick = () => {
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      start_time: profile.start_time || '',
      end_time: profile.end_time || '',
      password: '',
    });
    setConfirmPassword('');
    setPasswordError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    setPasswordError('');

    try {
      setIsSaving(true);
      const payload: UpdateProfilePayload = {
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isPrivileged) {
        payload.full_name = formData.full_name;
        payload.start_time = formData.start_time;
        payload.end_time = formData.end_time;
      }

      await updateProfile(payload);
      setIsEditing(false);
      setConfirmPassword('');
      setPasswordError('');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const editInputClass =
    'bg-gray-50 border-b border-gray-300 focus:border-primary outline-none px-2 py-1 rounded-t-sm transition-colors w-full text-sm font-medium text-gray-700';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Top section: Avatar + Name + Badges + Edit */}
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="h-24 w-24 rounded-full border-4 border-primary overflow-hidden bg-gray-200 shrink-0">
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
            {getInitials(profile.full_name)}
          </div>
        </div>

        {/* Name + Badges */}
        <div className="flex-1 min-w-0">
          {isEditing && isPrivileged ? (
            <input
              type="text"
              className="text-2xl font-bold text-gray-800 bg-gray-50 border-b border-gray-300 focus:border-primary outline-none px-2 py-1 rounded-t-sm transition-colors w-full max-w-md mb-2"
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-800 truncate">
              {profile.full_name}
            </h1>
          )}
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={profile.status} />
            <RoleBadge role={profile.role} />
          </div>
        </div>

        {/* Edit button */}
        {showEditButton && (
          <div className="shrink-0 flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar
                </button>
              </>
            ) : (
              <button
                onClick={handleEditClick}
                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                title="Editar perfil"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-5" />

      {/* Contact info grid - always 3 columns, 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Row 1, Col 1 - Email */}
        <ContactInfoItem
          icon={<Mail className="w-4 h-4" />}
          label="Correo electrónico"
          value={
            isEditing ? (
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                className={editInputClass}
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              profile.email
            )
          }
        />
        {/* Row 1, Col 2 - Phone */}
        <ContactInfoItem
          icon={<Phone className="w-4 h-4" />}
          label="Teléfono"
          value={
            isEditing ? (
              <input
                type="tel"
                placeholder="Ej. 961 000 0000"
                className={editInputClass}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            ) : (
              profile.phone || 'Sin teléfono'
            )
          }
        />
        {/* Row 1, Col 3 - Password */}
        <ContactInfoItem
          icon={<Lock className="w-4 h-4" />}
          label="Contraseña"
          value={
            isEditing ? (
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nueva (opcional)"
                  autoComplete="new-password"
                  className={`${editInputClass} pr-7`}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-0 top-1 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              '••••••••'
            )
          }
        />
      </div>

      {/* Row 2: Date + Schedule + Confirm Password (when editing) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-5">
        {/* Row 2, Col 1 - Hire Date */}
        <ContactInfoItem
          icon={<Calendar className="w-4 h-4" />}
          label="Fecha de ingreso"
          value={formatHireDate(profile.hire_date)}
        />
        {/* Row 2, Col 2 - Schedule */}
        <ContactInfoItem
          icon={<Clock className="w-4 h-4" />}
          label="Horario"
          value={
            isEditing && isPrivileged ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className={`${editInputClass} px-1`}
                  value={formData.start_time || ''}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="time"
                  className={`${editInputClass} px-1`}
                  value={formData.end_time || ''}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            ) : (
              schedule
            )
          }
        />
        {/* Row 2, Col 3 - Confirm Password (only visible when editing + password has content) */}
        {isEditing && formData.password && formData.password.length > 0 ? (
          <ContactInfoItem
            icon={<Lock className="w-4 h-4" />}
            label="Confirmar nueva contraseña"
            value={
              <div className="relative w-full">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  className={`${editInputClass} pr-7 ${
                    passwordError ? 'border-red-400 focus:border-red-500 bg-red-50' : ''
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-0 top-1 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                )}
              </div>
            }
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
