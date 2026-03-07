import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend } from 'recharts';
import type { DashboardDistribution } from '../types';

interface DistributionChartProps {
  data: DashboardDistribution | null;
  isLoading: boolean;
  error: Error | null;
}

const STATUS_MAP: Record<string, { label: string, color: string }> = {
  'PENDING': { label: 'Pendiente', color: '#f59e0b' },            // orange
  'IN_PROGRESS': { label: 'En proceso', color: '#eab308' },       // yellow
  'READY_FOR_REVIEW': { label: 'Listo para revisión', color: '#3b82f6' }, // blue
  'APPROVED': { label: 'Aprobado', color: '#10B981' },            // green
  'REJECTED': { label: 'Rechazado', color: '#dc2626' },           // red
};

export const DistributionChart = ({ data, isLoading, error }: DistributionChartProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[320px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#740A03]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center text-red-500 min-h-[320px]">
        <p>Error al cargar la distribución: {error?.message}</p>
      </div>
    );
  }

  const chartData = data.statuses.map(item => {
    const rawStatus = (item.status || '').toUpperCase();
    const mapped = STATUS_MAP[rawStatus] || { label: item.status, color: '#9ca3af' };
    
    return {
      name: mapped.label,
      value: item.count,
      percentage: item.percentage,
      color: mapped.color
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col min-h-[320px]">
      <h2 className="text-sm font-bold text-gray-800 mb-2">Distribución por estados</h2>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <PieTooltip 
              formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={70}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => <span className="text-gray-600 capitalize ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Total inside donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12 text-center">
          <span className="text-3xl font-bold text-gray-800">{data.total}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Total</span>
        </div>
      </div>
    </div>
  );
};
