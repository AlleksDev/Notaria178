import { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../api/auditApi';
import type { PaginatedAuditLogs, AuditMetricsResponse } from '../types';

interface UseAuditHistoryReturn {
  timelineData: PaginatedAuditLogs | null;
  metricsData: AuditMetricsResponse | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  activeTab: 'usuarios' | 'trabajos';
  setActiveTab: (tab: 'usuarios' | 'trabajos') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchData: () => Promise<void>;
  totalPages: number;
}

export const useAuditHistory = (itemsPerPage: number = 20): UseAuditHistoryReturn => {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'trabajos'>('usuarios');
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [timelineData, setTimelineData] = useState<PaginatedAuditLogs | null>(null);
  const [metricsData, setMetricsData] = useState<AuditMetricsResponse | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reset page when tab changes
  const handleSetActiveTab = useCallback((tab: 'usuarios' | 'trabajos') => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const validPage = Math.max(1, page);
      const offset = (validPage - 1) * itemsPerPage;

      const entityFilter = activeTab === 'usuarios' ? 'USER' : 'WORK';
      
      const [timeline, metrics] = await Promise.all([
        auditApi.getTimelineActivity({ limit: itemsPerPage, offset, entity: entityFilter }),
        auditApi.getAuditMetrics()
      ]);

      setTimelineData(timeline);
      setMetricsData(metrics);
    } catch (err: any) {
      console.error('Error fetching audit history:', err);
      setError(err.message || 'Error al cargar el historial de auditoría');
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = timelineData ? Math.max(1, Math.ceil(timelineData.total / itemsPerPage)) : 1;

  return {
    timelineData,
    metricsData,
    isLoading,
    error,
    page,
    setPage,
    activeTab,
    setActiveTab: handleSetActiveTab,
    searchTerm,
    setSearchTerm,
    fetchData,
    totalPages
  };
};
