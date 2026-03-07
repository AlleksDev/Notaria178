export interface BranchInfo {
  name: string;
  address?: string;
  image_url: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  hire_date: string;
  start_time?: string;
  end_time?: string;
  branch: BranchInfo | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  start_time?: string;
  end_time?: string;
}

export interface ProfileResponse {
  data: UserProfile;
}

export interface AttendanceResponse {
  data: AttendanceRecord[];
}
