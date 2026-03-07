import type { TopDrafter } from '../types';

interface TopDraftersProps {
  data: TopDrafter[] | null;
  isLoading: boolean;
  error: Error | null;
}

export const TopDrafters = ({ data, isLoading, error }: TopDraftersProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col w-full h-full">
      <h2 className="text-sm font-bold text-gray-800 mb-6">Ranking de Proyectistas</h2>

      {isLoading ? (
        <div className="space-y-4 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          <p>Error: {error.message}</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 flex-1">
          {data.map((drafter, index) => (
            <div key={drafter.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 truncate max-w-[150px] sm:max-w-full" title={drafter.full_name}>
                    {drafter.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{drafter.role}</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 whitespace-nowrap">
                {drafter.work_count} trabajos
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No hay datos de proyectistas.
        </div>
      )}
    </div>
  );
};
