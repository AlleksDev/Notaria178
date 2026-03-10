import { api } from '../../../config/axios';
import type { PaginatedAuditLogs, AuditMetricsResponse, DashboardActivityFilters } from '../types';

export const auditApi = {
  getTimelineActivity: async (filters: DashboardActivityFilters): Promise<PaginatedAuditLogs> => {
    const params = new URLSearchParams();
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.entity_id) params.append('entity_id', filters.entity_id);
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.timeframe) params.append('timeframe', filters.timeframe);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    // Default pagination if not provided
    params.append('limit', (filters.limit || 10).toString());
    params.append('offset', (filters.offset || 0).toString());

    const response = await api.get<PaginatedAuditLogs>(`/audit/search?${params.toString()}`);
    return response.data;
  },

  getAuditMetrics: async (startDate?: string, endDate?: string): Promise<AuditMetricsResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const qs = params.toString();
    const url = qs ? `/audit/metrics?${qs}` : `/audit/metrics`;
    
    const response = await api.get<AuditMetricsResponse>(url);
    return response.data;
  }
};
