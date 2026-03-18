export interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string | null;
  total_hours: string;
}

export interface AttendanceHistoryResponse {
  data: AttendanceRecord[];
  total: number;
}

export interface CheckAttendanceResponse {
  message: string;
  data: AttendanceRecord;
}

export interface AttendanceFilters {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

export type AttendanceStatus = 'not_started' | 'checked_in' | 'completed';
