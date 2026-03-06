import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardTrend } from '../types';

interface TrendChartProps {
  data: DashboardTrend | null;
  isLoading: boolean;
  error: Error | null;
}

export const TrendChart = ({ data, isLoading, error }: TrendChartProps) => {
  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center h-full min-h-[320px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#740A03]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center text-red-500 min-h-[320px]">
        <p>Error al cargar la tendencia: {error?.message}</p>
      </div>
    );
  }
  
  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
      <h2 className="text-sm font-bold text-gray-800 mb-6">Trabajos ingresados vs aprobados</h2>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.series}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="period" 
              tick={{fontSize: 12, fill: '#9CA3AF'}} 
              axisLine={false} 
              tickLine={false} 
              tickMargin={10}
            />
            <YAxis 
              tick={{fontSize: 12, fill: '#9CA3AF'}} 
              axisLine={false} 
              tickLine={false} 
              tickMargin={10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', fontSize: '13px' }}
              cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '13px', paddingBottom: '10px' }} 
            />
            <Line 
              name="Ingresados"
              type="monotone" 
              dataKey="created" 
              stroke="#740A03" 
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              name="Aprobados"
              type="monotone" 
              dataKey="approved" 
              stroke="#10B981" 
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
