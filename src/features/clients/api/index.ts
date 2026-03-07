import { api } from '../../../config/axios';
import type { ClientsResponse, CreateClientRequest, Client } from '../types';

export const searchClients = async (
  search?: string,
  limit = 50
): Promise<ClientsResponse> => {
  const params: Record<string, string | number> = { limit };
  if (search) params.search = search;
  const { data } = await api.get<ClientsResponse>('/clients/search', {
    params,
  });
  return data;
};

export const createClient = async (
  request: CreateClientRequest
): Promise<Client> => {
  const { data } = await api.post<{ message: string; data: Client }>(
    '/clients/create',
    request
  );
  return data.data;
};