// src/features/home/types/index.ts

export interface DashboardKPIs {
  total: number;
  pending: number;
  in_progress: number;
  ready_for_review: number;
  approved: number;
  rejected: number;
}

export interface TrendPoint {
  period: string;
  created: number;
  approved: number;
}

export interface DashboardTrend {
  group_by: string;
  series: TrendPoint[];
}

export interface DistributionStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface DashboardDistribution {
  total: number;
  statuses: DistributionStatus[];
}

export interface TopDrafter {
  user_id: string;
  full_name: string;
  role: string;
  work_count: number;
}

export interface TopAct {
  act_id: string;
  name: string;
  count: number;
}

export interface DashboardFilters {
  timeframe?: string;
  branch_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort?: string;
  limit?: number;
}

export interface DashboardActivity {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
  json_details?: any;
}