import { api } from '../../../config/axios';
import type { ProfileResponse, AttendanceResponse, UpdateProfilePayload } from '../types';

export const getProfile = async (): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>('/users/profile');
  return data;
};

export const getMyAttendance = async (): Promise<AttendanceResponse> => {
  const { data } = await api.get<AttendanceResponse>('/attendance/history');
  return data;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<void> => {
  await api.patch('/users/profile', payload);
};
