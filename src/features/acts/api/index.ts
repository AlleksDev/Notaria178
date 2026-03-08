import { api } from '../../../config/axios';
import type { ActsResponse, ActRequirement, ActRequirementsResponse, CreateActRequest, Act } from '../types';

export const searchActs = async (
  search?: string,
  limit = 50
): Promise<ActsResponse> => {
  const params: Record<string, string | number> = { limit, status: 'ACTIVE' };
  if (search) params.search = search;
  const { data } = await api.get<ActsResponse>('/acts/search', { params });
  return { ...data, data: data.data || [] };
};

export const getActsCatalog = async (): Promise<ActsResponse> => {
  // We request a large limit to get all the acts for the catalog grouping
  const { data } = await api.get<ActsResponse>('/acts/search', { params: { limit: 1000 } });
  return { ...data, data: data.data || [] };
};

export const getActRequirements = async (actId: string): Promise<ActRequirement[]> => {
  const { data } = await api.get<ActRequirementsResponse>(`/acts/${actId}/requirements`);
  return data.data;
};

export const addActRequirement = async (actId: string, name: string): Promise<ActRequirement> => {
  const { data } = await api.post<{ message: string; data: ActRequirement }>(`/acts/${actId}/requirements`, { name });
  return data.data;
};

export const deleteActRequirement = async (actId: string, reqId: string): Promise<{ soft_deleted: boolean }> => {
  const { data } = await api.delete<{ message: string; soft_deleted: boolean }>(`/acts/${actId}/requirements/${reqId}`);
  return { soft_deleted: data.soft_deleted };
};

export const createAct = async (req: CreateActRequest): Promise<Act> => {
  const { data } = await api.post<{ message: string; data: Act }>('/acts/create', req);
  return data.data;
};

export const updateAct = async (
  actId: string,
  req: { name?: string; category?: string; description?: string }
): Promise<Act> => {
  const { data } = await api.patch<{ message: string; data: Act }>(`/acts/update/${actId}`, req);
  return data.data;
};

export const deleteAct = async (actId: string): Promise<void> => {
  await api.delete(`/acts/${actId}`);
};

export const toggleActStatus = async (actId: string): Promise<Act> => {
  const { data } = await api.patch<{ message: string; data: Act }>(`/acts/status/${actId}`);
  return data.data;
};
