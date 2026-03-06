import { 
  BarChart3, 
  Settings, 
  PauseCircle, 
  Eye, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { StatCard } from './StatCard';
import type { DashboardKPIs } from '../types';

interface KPICardsProps {
  data: DashboardKPIs | null;
  isLoading: boolean;
  error: Error | null;
}

const KPISkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="rounded-xl p-5 bg-white border border-gray-100 shadow-sm animate-pulse h-28 flex flex-col justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
         <div className="flex justify-between items-end">
            <div className="h-8 bg-gray-200 rounded w-12"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
         </div>
      </div>
    ))}
  </div>
);

export const KPICards = ({ data, isLoading, error }: KPICardsProps) => {
  if (isLoading) return <KPISkeleton />;
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Error al cargar los indicadores: {error.message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title="TOTAL" value={data.total} icon={<BarChart3 size={32} />} theme="primary" />
      <StatCard title="EN PROCESO" value={data.in_progress} icon={<Settings size={32} />} theme="process" />
      <StatCard title="PENDIENTES" value={data.pending} icon={<PauseCircle size={32} />} theme="pending" />
      <StatCard title="PARA REVISIÓN" value={data.ready_for_review} icon={<Eye size={32} />} theme="review" />
      <StatCard title="APROBADOS" value={data.approved} icon={<CheckCircle2 size={32} />} theme="approved" />
      <StatCard title="RECHAZADOS" value={data.rejected} icon={<XCircle size={32} />} theme="rejected" />
    </div>
  );
};
