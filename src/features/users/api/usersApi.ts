import { api } from '../../../config/axios';
import type {
  ProyectistaFilters,
  ProyectistasResponse,
  CreateProyectistaRequest,
  UpdateProyectistaRequest,
} from '../types';

const cleanParams = (params: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
};

export const searchUsers = async (
  filters: ProyectistaFilters
): Promise<ProyectistasResponse> => {
  const { data } = await api.get<ProyectistasResponse>('/users/search', {
    params: cleanParams(filters as unknown as Record<string, unknown>),
  });
  return data;
};

export const createUser = async (request: CreateProyectistaRequest) => {
  const { data } = await api.post<{ message: string; data: unknown }>(
    '/users/create',
    request
  );
  return data;
};

export const updateUser = async (
  id: string,
  request: UpdateProyectistaRequest
) => {
  const { data } = await api.patch<{ message: string }>(
    `/users/update/${encodeURIComponent(id)}`,
    request
  );
  return data;
};
