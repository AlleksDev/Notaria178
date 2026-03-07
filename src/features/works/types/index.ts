export type WorkStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface Work {
  id: string;
  branch_id: string;
  client_id: string;
  main_drafter_id?: string;
  folio?: string;
  status: WorkStatus;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkActInfo {
  act_id: string;
  name: string;
}

export interface WorkCollaborator {
  user_id: string;
  full_name: string;
}

export interface WorkDetail extends Work {
  acts: WorkActInfo[];
  collaborators: WorkCollaborator[];
}

export interface WorkFilters {
  search?: string;
  status?: string;
  branch_id?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
  limit: number;
  offset: number;
}

export interface WorksResponse {
  total: number;
  data: Work[];
}

export interface WorkKPIs {
  total: number;
  pending: number;
  in_progress: number;
  ready_for_review: number;
  approved: number;
  rejected: number;
}
