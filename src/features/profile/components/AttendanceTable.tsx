import type { AttendanceRecord } from '../types';
import { Calendar } from 'lucide-react';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onViewAll?: () => void;
  maxRecords?: number;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${WEEKDAYS[d.getDay()]}, ${day} ${MONTHS[d.getMonth()]}, ${year}`;
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '--:--';
  const d = new Date(timeStr);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${ampm}`;
};

export const AttendanceTable = ({
  records,
  onViewAll,
  maxRecords = 5,
}: AttendanceTableProps) => {
  const displayRecords = records.slice(0, maxRecords);

  return (
    <div className="flex flex-col gap-4">
      {displayRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-gray-600 font-medium">
            No hay registros de asistencia
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Tus &quot;check-in&quot; y &quot;check-out&quot; aparecerán aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Hora entrada</th>
                  <th className="py-3 px-4">Hora salida</th>
                  <th className="py-3 px-4 text-right">Total horas</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {displayRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-gray-600">
                      {formatDate(record.date)}
                    </td>
                    <td className="py-4 px-4">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="py-4 px-4">
                      {formatTime(record.check_out_time)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          record.total_hours === 'En curso'
                            ? 'border border-amber-400 text-amber-600 bg-amber-50'
                            : 'border border-green-400 text-green-600 bg-green-50'
                        }`}
                      >
                        {record.total_hours}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ver todo button */}
          <button
            onClick={onViewAll}
            className="w-full border border-blue-400 text-blue-500 rounded-lg py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Ver todo
          </button>
        </>
      )}
    </div>
  );
};
