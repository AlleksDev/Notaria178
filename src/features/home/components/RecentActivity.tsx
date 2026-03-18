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
      return { text: 'creó', color: 'bg-emerald-500' };
    case 'DELETE':
      return { text: 'eliminó', color: 'bg-red-500' };
    case 'EDIT':
    case 'UPDATE':
      return { text: 'editó', color: 'bg-amber-500' };
    case 'STATUS_CHANGE':
      return { text: 'cambió el estado de', color: 'bg-blue-500' };
    case 'ASSIGN':
    case 'ASSIGNMENT':
      return { text: 'asignó', color: 'bg-violet-500' };
    case 'LOGIN':
      return { text: 'inició sesión', color: 'bg-indigo-500', noTarget: true };
    case 'LOGOUT':
      return { text: 'cerró sesión', color: 'bg-slate-400', noTarget: true };
    case 'ADD_REQUIREMENT':
      return { text: 'agregó requisito', color: 'bg-emerald-500' };
    case 'DELETE_REQUIREMENT':
      return { text: 'eliminó requisito', color: 'bg-red-500' };
    case 'UPLOAD_FILE':
      return { text: 'subió archivo', color: 'bg-blue-500' };
    case 'DELETE_FILE':
      return { text: 'eliminó archivo', color: 'bg-red-500' };
    default:
      return { text: key.toLowerCase().replace(/_/g, ' '), color: 'bg-gray-400' };
  }
};

const getEntityLabel = (entity: string) => {
  const key = (entity || '').toUpperCase();
  switch (key) {
    case 'WORK':
      return 'Escritura';
    case 'USER':
      return 'Usuario';
    case 'CLIENT':
      return 'Cliente';
    case 'ACT':
      return 'Acto';
    case 'BRANCH':
      return 'Sucursal';
    default:
      return entity;
  }
};

const getRelativeTime = (dateString: string) => {
  if (!dateString) return 'ahora';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'ahora';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  const days = Math.floor(diffInSeconds / 86400);
  if (days === 1) return 'ayer';
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
};

export const RecentActivity = ({ data, isLoading, error }: RecentActivityProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-800 mb-5">Actividad reciente</h2>

      {isLoading ? (
        <div className="space-y-4 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
                <div className="h-3.5 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-10 ml-auto" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-3/4 ml-5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          <p className="text-sm">Error: {error.message}</p>
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 flex-1 overflow-y-auto">
          {data.map((activity) => {
            const info = getActionInfo(activity.action);

            // Build description parts
            let description = info.text;
            let details = '';

            if (!info.noTarget) {
              const entityLabel = getEntityLabel(activity.entity);
              let identifier = '';
              let reqName = '';

              if (activity.json_details) {
                const det = typeof activity.json_details === 'string'
                  ? JSON.parse(activity.json_details)
                  : activity.json_details;
                if (det.folio) identifier = `#${det.folio}`;
                else if (det.document_name) identifier = det.document_name;
                else if (det.name) identifier = det.name;
                if (det.requirement_name) reqName = det.requirement_name;
              }

              // Build detail string
              if (reqName) {
                details = `"${reqName}" en ${entityLabel} ${identifier || ''}`.trim();
              } else if (identifier) {
                details = `${entityLabel} ${identifier}`;
              } else if (activity.entity_id) {
                details = `${entityLabel} #${activity.entity_id.substring(0, 6)}`;
              }
            }

            const fullText = details ? `${description} ${details}` : description;

            return (
              <div key={activity.id} className="group">
                {/* Header: User name + Time */}
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${info.color}`} />
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {activity.user_name}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto shrink-0">
                    {getRelativeTime(activity.created_at)}
                  </span>
                </div>

                {/* Description */}
                <p
                  className="text-sm text-gray-500 ml-4 truncate"
                  title={fullText}
                >
                  {description}
                  {details && (
                    <>
                      {' '}
                      <span className="text-gray-600">{details}</span>
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-sm">No hay actividad reciente.</p>
        </div>
      )}
    </div>
  );
};
