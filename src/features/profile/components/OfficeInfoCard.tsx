import type { BranchInfo } from '../types';
import { MapPin } from 'lucide-react';

interface OfficeInfoCardProps {
  branch: BranchInfo | null;
}

export const OfficeInfoCard = ({ branch }: OfficeInfoCardProps) => {
  const hasBranch = branch && branch.name !== 'Sucursal no asignada';

  return (
    <div className="flex flex-col gap-4">
      {/* Branch Image */}
      <div
        className={`rounded-xl overflow-hidden border-4 ${
          hasBranch ? 'border-primary' : 'border-gray-200'
        }`}
      >
        <img
          src={
            branch?.image_url ||
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069'
          }
          alt="Oficina"
          className={`w-full h-52 object-cover ${!hasBranch ? 'sepia opacity-50' : ''}`}
        />
      </div>

      {/* Address Card or Empty State */}
      {hasBranch ? (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-700 text-sm">
                Dirección de la oficina
              </h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Dirección: {branch.address || 'Sin dirección registrada'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <MapPin className="w-8 h-8 text-gray-400 mb-2" />
          <h3 className="font-medium text-gray-600">Sin sucursal asignada</h3>
          <p className="text-sm text-gray-400 mt-1">
            Contacta a un administrador para que te asigne a una sucursal y
            horario de trabajo.
          </p>
        </div>
      )}
    </div>
  );
};
