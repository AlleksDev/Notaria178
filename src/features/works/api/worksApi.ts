import { api } from '../../../config/axios';
import type {
  WorkFilters,
  WorksResponse,
  WorkDetail,
  WorkKPIs,
  CreateWorkRequest,
} from '../types';

const cleanParams = (params: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
};

export const searchWorks = async (
  filters: WorkFilters
): Promise<WorksResponse> => {
  const { data } = await api.get<WorksResponse>('/works/search', {
    params: cleanParams(filters as unknown as Record<string, unknown>),
  });
  return data;
};

export const getWorkDetail = async (id: string): Promise<WorkDetail> => {
  const { data } = await api.get<{ data: WorkDetail }>(
    `/works/${encodeURIComponent(id)}`
  );
  return data.data;
};

export const getWorkKPIs = async (
  branchId?: string,
  timeframe: string = 'all'
): Promise<WorkKPIs> => {
  const params: Record<string, string> = { timeframe };
  if (branchId) params.branch_id = branchId;
  const { data } = await api.get<WorkKPIs>('/dashboard/kpis', { params });
  return data;
};

export const createWork = async (
  request: CreateWorkRequest
): Promise<WorkDetail> => {
  const { data } = await api.post<{ message: string; data: WorkDetail }>(
    '/works/create',
    request
  );
  return data.data;
};
