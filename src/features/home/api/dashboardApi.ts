// src/features/home/api/dashboardApi.ts
import { api } from '../../../config/axios';
import type { 
  DashboardKPIs, 
  DashboardTrend, 
  DashboardDistribution, 
  TopDrafter, 
  TopAct,
  DashboardFilters,
  DashboardActivity
} from '../types';

// Helper para limpiar parámetros indefinidos y no enviarlos en la URL
const cleanParams = (params?: DashboardFilters) => {
  if (!params) return {};
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
};

export const getKPIs = async (filters?: DashboardFilters) => {
  const { data } = await api.get<DashboardKPIs>('/dashboard/kpis', { params: cleanParams(filters) });
  return data;
};

export const getTrend = async (filters?: DashboardFilters & { group_by?: string }) => {
  const { data } = await api.get<DashboardTrend>('/dashboard/trend', { params: cleanParams(filters) });
  return data;
};

export const getDistribution = async (filters?: DashboardFilters) => {
  const { data } = await api.get<DashboardDistribution>('/dashboard/distribution', { params: cleanParams(filters) });
  return data;
};

export const getTopDrafters = async (filters?: DashboardFilters) => {
  const { data } = await api.get<{ data: TopDrafter[] }>('/dashboard/top-drafters', { params: cleanParams(filters) });
  return data.data; // Extraemos directamente el arreglo
};

export const getTopActs = async (filters?: DashboardFilters) => {
  const { data } = await api.get<{ data: TopAct[] }>('/dashboard/top-acts', { params: cleanParams(filters) });
  return data.data; // Extraemos directamente el arreglo
};

export const getRecentActivity = async (filters?: DashboardFilters) => {
  const { data } = await api.get<{ data: DashboardActivity[] }>('/dashboard/activity', { params: cleanParams(filters) });
  return data.data;
};