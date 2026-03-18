import { useState, useEffect } from 'react';
import { X, Loader2, Clock, LogIn, LogOut, CheckCircle2, Calendar } from 'lucide-react';
import { isAxiosError } from 'axios';
import { checkAttendance, getTodayAttendance, getMyAttendanceHistory } from '../api/attendanceApi';
import type { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal = ({ isOpen, onClose }: AttendanceModalProps) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);
  const [status, setStatus] = useState<AttendanceStatus>('not_started');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [todayRes, historyRes] = await Promise.all([
        getTodayAttendance(),
        getMyAttendanceHistory({ limit: 5 }),
      ]);

      const today = todayRes.data?.[0] || null;
      setTodayRecord(today);
      setRecentHistory(historyRes.data || []);

      if (!today) {
        setStatus('not_started');
      } else if (!today.check_out_time) {
        setStatus('checked_in');
      } else {
        setStatus('completed');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Error al cargar la información de asistencia');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceData();
      setMessage('');
    }
  }, [isOpen]);

  const handleCheckAttendance = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      const response = await checkAttendance();
      setMessage(response.message);
      setTodayRecord(response.data);

      if (!response.data.check_out_time) {
        setStatus('checked_in');
      } else {
        setStatus('completed');
      }

      const historyRes = await getMyAttendanceHistory({ limit: 5 });
      setRecentHistory(historyRes.data || []);
    } catch (err) {
      if (isAxiosError(err)) {
        const errorMsg = err.response?.data?.error || 'Error al registrar asistencia';
        setError(errorMsg);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (!isOpen) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return {
          icon: LogIn,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          title: 'Registrar Entrada',
          subtitle: 'Aún no has marcado tu entrada de hoy',
          buttonText: 'Marcar Entrada',
          buttonClass: 'bg-green-600 hover:bg-green-700',
          canSubmit: true,
        };
      case 'checked_in':
        return {
          icon: LogOut,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          title: 'Registrar Salida',
          subtitle: `Entrada registrada a las ${todayRecord ? formatTime(todayRecord.check_in_time) : '--:--'}`,
          buttonText: 'Marcar Salida',
          buttonClass: 'bg-amber-600 hover:bg-amber-700',
          canSubmit: true,
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: 'Turno Completado',
          subtitle: `${todayRecord?.total_hours || '0h 0m'} trabajadas hoy`,
          buttonText: 'Ya completaste tu turno',
          buttonClass: 'bg-gray-400 cursor-not-allowed',
          canSubmit: false,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Control de{' '}
              <span className="italic text-primary">Asistencia</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="w-12 h-1 bg-primary mt-3" />
        </div>

        <div className="px-8 pb-8 pt-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-sm text-gray-500">Cargando información...</p>
            </div>
          ) : (
            <>
              {/* Status Card */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${config.iconBg}`}>
                    <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{config.title}</h3>
                    <p className="text-sm text-gray-500">{config.subtitle}</p>
                  </div>
                </div>

                {/* Time details for checked_in or completed */}
                {todayRecord && status !== 'not_started' && (
                  <div className="flex gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Entrada: {formatTime(todayRecord.check_in_time)}</span>
                    </div>
                    {todayRecord.check_out_time && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Salida: {formatTime(todayRecord.check_out_time)}</span>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg">
                    {message}
                  </div>
                )}

                <button
                  onClick={handleCheckAttendance}
                  disabled={isSubmitting || !config.canSubmit}
                  className={`w-full py-3 text-sm font-bold uppercase tracking-wider text-white rounded-lg transition-colors ${config.buttonClass} ${
                    isSubmitting ? 'opacity-60 cursor-wait' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </span>
                  ) : (
                    config.buttonText
                  )}
                </button>
              </div>

              {/* Recent History */}
              {recentHistory.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Historial Reciente
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {recentHistory.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <span className="text-gray-700 font-medium">
                          {formatDate(record.date)}
                        </span>
                        <div className="flex items-center gap-3 text-gray-500">
                          <span>{formatTime(record.check_in_time)}</span>
                          <span>-</span>
                          <span>
                            {record.check_out_time
                              ? formatTime(record.check_out_time)
                              : '--:--'}
                          </span>
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {record.total_hours}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full mt-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
