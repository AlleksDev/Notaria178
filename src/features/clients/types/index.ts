export interface Client {
  id: string;
  full_name: string;
  rfc?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface ClientsResponse {
  total: number;
  data: Client[];
}

export interface CreateClientRequest {
  full_name: string;
  rfc?: string;
  phone?: string;
  email?: string;
}

export interface UpdateClientRequest {
  full_name?: string;
  rfc?: string;
  phone?: string;
  email?: string;
}