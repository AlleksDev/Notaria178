export interface Proyectista {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  hire_date: string;
  start_time?: string;
  end_time?: string;
}

export interface ProyectistaFilters {
  search?: string;
  status?: string;
  role?: string;
  branch_id?: string;
  limit: number;
  offset: number;
}

export interface ProyectistasResponse {
  total: number;
  data: Proyectista[];
}

export interface CreateProyectistaRequest {
  full_name: string;
  email: string;
  password: string;
  role: string;
  branch_id?: string;
  phone?: string;
}

export interface UpdateProyectistaRequest {
  full_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: string;
  status?: string;
  branch_id?: string;
  start_time?: string;
  end_time?: string;
}
