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
  description?: string;
  category?: string;
  status?: string;
}

export interface WorkCollaborator {
  user_id: string;
  full_name: string;
}

export interface ClientInfo {
  id: string;
  full_name: string;
  rfc?: string;
  phone?: string;
  email?: string;
}

export interface DeduplicatedRequirement {
  id: string;
  name: string;
  status: string;
  source_acts: string[];
  document_id?: string;
}

export interface WorkRequirement {
  id: string;
  work_id: string;
  name: string;
  document_id?: string;
  created_at: string;
}

export interface WorkDetail extends Work {
  acts: WorkActInfo[];
  collaborators: WorkCollaborator[];
  requirements: DeduplicatedRequirement[];
  work_requirements: WorkRequirement[];
  client_name?: string;
  client_info?: ClientInfo;
  branch_name?: string;
  main_drafter_name?: string;
}

export interface WorkDocument {
  id: string;
  client_id?: string;
  work_id?: string;
  user_id?: string;
  document_name: string;
  category: string;
  version: number;
  file_path: string;
  created_at: string;
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

export interface CreateWorkRequest {
  branch_id: string;
  client_id: string;
  act_ids: string[];
  main_drafter_id?: string;
  folio?: string;
  deadline?: string;
}

