import { api } from '../../../config/axios';
import type { ActsResponse } from '../types';

export const searchActs = async (
  search?: string,
  limit = 50
): Promise<ActsResponse> => {
  const params: Record<string, string | number> = { limit, status: 'ACTIVE' };
  if (search) params.search = search;
  const { data } = await api.get<ActsResponse>('/acts/search', { params });
  return data;
};
