import type { DashboardActivity } from '../types';

interface RecentActivityProps {
  data: DashboardActivity[] | null;
  isLoading: boolean;
  error: Error | null;
}

const getActionInfo = (action: string) => {
  const key = (action || '').toUpperCase();
  switch (key) {
    case 'CREATE':
      return { text: 'creó el registro', color: 'bg-[#10B981]' }; // Green
    case 'DELETE':
      return { text: 'eliminó el registro', color: 'bg-[#dc2626]' }; // Red
    case 'EDIT':
    case 'UPDATE':
      return { text: 'editó la información de', color: 'bg-[#f59e0b]' }; // Yellow
    case 'STATUS_CHANGE':
      return { text: 'cambió el estado de', color: 'bg-[#3b82f6]' }; // Blue
    case 'ASSIGN':
    case 'ASSIGNMENT':
      return { text: 'asignó un trabajo a', color: 'bg-[#8b5cf6]' }; // Purple
    default:
      return { text: key.toLowerCase().replace(/_/g, ' '), color: 'bg-gray-400' };
  }
};

const getRelativeTime = (dateString: string) => {
  if (!dateString) return 'momento';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seg`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
  return `${Math.floor(diffInSeconds / 86400)} d`;
};

export const RecentActivity = ({ data, isLoading, error }: RecentActivityProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-800 mb-6">Actividad reciente</h2>
      
      {isLoading ? (
        <div className="space-y-6 flex-1 relative pl-4">
          <div className="absolute top-2 bottom-2 left-[5px] w-px bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative flex items-center gap-4 animate-pulse">
              <div className="absolute -left-4 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-white"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          <p>Error: {error.message}</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-6 relative pl-4 flex-1">
          {/* Timeline separator line */}
          <div className="absolute top-2 bottom-2 left-[5px] w-px bg-gray-100"></div>
          
          {data.map((activity) => {
            const info = getActionInfo(activity.action);
            
            // Try to extract a useful name from json_details if available
            let targetText = activity.entity || '';
            if (activity.json_details) {
              const details = typeof activity.json_details === 'string' ? JSON.parse(activity.json_details) : activity.json_details;
              if (details.folio) targetText += ` #${details.folio}`;
              else if (details.document_name) targetText += ` ${details.document_name}`;
              else if (details.name) targetText += ` ${details.name}`;
            }
            
            // Fallback to displaying the entity ID if no specific name is found
            if (!targetText || targetText === activity.entity) {
                targetText = `${activity.entity} ${activity.entity_id ? `(${activity.entity_id.substring(0,8)}...)` : ''}`;
            }

            return (
              <div key={activity.id} className="relative flex items-start sm:items-center justify-between gap-4 group">
                <div className="flex items-start sm:items-center gap-4">
                  {/* Timeline dot */}
                  <div className={`absolute -left-4 mt-[5px] sm:mt-0 w-3 h-3 rounded-full ring-4 ring-white ${info.color}`}></div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <p className="text-sm font-bold text-gray-800">{activity.user_name}</p>
                    <p className="text-sm text-gray-500">
                      {info.text} {targetText && <span className="font-semibold text-gray-700">{targetText}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-medium whitespace-nowrap mt-1 sm:mt-0">
                  Hace {getRelativeTime(activity.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No hay actividad reciente.
        </div>
      )}
    </div>
  );
};
