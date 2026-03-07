import { useProfile } from '../hooks/useProfile';
import { ProfileUserCard } from '../components/ProfileUserCard';
import { OfficeInfoCard } from '../components/OfficeInfoCard';
import { AttendanceTable } from '../components/AttendanceTable';
import { getDisplayRole } from '../utils/roleMapping';

export const ProfilePage = () => {
  const { profile, attendance, isLoading, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex flex-col items-center">
        <p>No se pudo cargar la información del perfil.</p>
        <p className="text-sm opacity-80 mt-1">{error?.message}</p>
      </div>
    );
  }

  const displayRole = getDisplayRole(profile.role);

  return (
    <div className="h-full flex flex-col gap-6 max-w-[1400px] w-full mx-auto pb-8">
      {/* Page Title with decorative line */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-700 whitespace-nowrap">
          {displayRole}
        </h2>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* User Info Card */}
      <ProfileUserCard profile={profile} onSaveSuccess={refetch} />

      {/* Bottom Grid: Office Data + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Office Data */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-700 whitespace-nowrap">
              Datos de oficina
            </h2>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <OfficeInfoCard branch={profile.branch} />
        </div>

        {/* Right: Attendance */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-700 whitespace-nowrap">
              Asistencia
            </h2>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <AttendanceTable records={attendance} />
        </div>
      </div>
    </div>
  );
};
