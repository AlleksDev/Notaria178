export interface Branch {
  id: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface BranchesResponse {
  total: number;
  data: Branch[];
}
