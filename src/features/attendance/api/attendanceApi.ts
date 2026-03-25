import { api } from '../../../config/axios';
import type {
  AttendanceHistoryResponse,
  CheckAttendanceResponse,
  AttendanceFilters,
} from '../types';

const cleanParams = (params: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
};

export const checkAttendance = async (): Promise<CheckAttendanceResponse> => {
  const { data } = await api.post<CheckAttendanceResponse>('/attendance/check');
  return data;
};

export const getMyAttendanceHistory = async (
  filters: AttendanceFilters = {}
): Promise<AttendanceHistoryResponse> => {
  const { data } = await api.get<AttendanceHistoryResponse>('/attendance/history', {
    params: cleanParams(filters as unknown as Record<string, unknown>),
  });
  return data;
};

export const getTodayAttendance = async (): Promise<AttendanceHistoryResponse> => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return getMyAttendanceHistory({
    start_date: today,
    end_date: today,
    limit: 1,
  });
};
