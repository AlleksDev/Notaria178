import type { TopAct } from '../types';

interface TopActsProps {
  data: TopAct[] | null;
  isLoading: boolean;
  error: Error | null;
}

const COLORS = [
  'bg-[#740A03]',
  'bg-[#f59e0b]',
  'bg-[#10B981]',
  'bg-[#3b82f6]',
  'bg-slate-700',
  'bg-teal-600',
  'bg-indigo-600'
];

export const TopActs = ({ data, isLoading, error }: TopActsProps) => {
  const maxCount = data && data.length > 0 ? Math.max(...data.map(d => d.count), 1) : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col w-full h-full min-h-[200px]">
      <h2 className="text-sm font-bold text-gray-800 mb-6">Ranking de Actos</h2>

      {isLoading ? (
        <div className="space-y-4 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full"></div>
              <div className="w-6 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
         <div className="flex-1 flex items-center justify-center text-red-500">
          <p>Error: {error.message}</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 flex-1">
          {data.map((act, idx) => {
            const percentage = (act.count / maxCount) * 100;
            const colorClass = COLORS[idx % COLORS.length];
            return (
              <div key={act.act_id} className="flex items-center gap-3 w-full">
                <div className="w-24 text-xs font-semibold text-gray-700 text-left shrink-0 truncate" title={act.name}>
                  {act.name}
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full relative overflow-hidden">
                  <div 
                    className={`absolute top-0 bottom-0 left-0 ${colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 font-bold w-6 text-right shrink-0">
                  {act.count}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No hay datos de actos.
        </div>
      )}
    </div>
  );
};
