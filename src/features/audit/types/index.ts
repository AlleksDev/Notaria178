export interface AuditLogAction {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity: string;
  entity_id: string;
  json_details?: Record<string, any>;
  created_at: string;
}

export interface PaginatedAuditLogs {
  total: number;
  data: AuditLogAction[];
}

export interface ActionMetric {
  action: string;
  count: number;
}

export interface AuditMetricsResponse {
  user_actions: ActionMetric[];
  work_actions: ActionMetric[];
}

export interface DashboardActivityFilters {
  branch_id?: string;
  user_id?: string;
  entity_id?: string;
  entity?: string;
  timeframe?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
