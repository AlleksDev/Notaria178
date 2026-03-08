export interface Act {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  requirements_count: number;
  works_count: number;
}

export interface ActRequirement {
  id: string;
  act_id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface CreateActRequest {
  name: string;
  category: string;
  description?: string;
}

export interface ActsResponse {
  total: number;
  data: Act[];
}

export interface ActRequirementsResponse {
  data: ActRequirement[];
}
