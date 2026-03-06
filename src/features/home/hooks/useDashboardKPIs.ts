import { useState, useEffect } from 'react';
import { getKPIs } from '../api/dashboardApi';
import type { DashboardKPIs, DashboardFilters } from '../types';

export const useDashboardKPIs = (filters?: DashboardFilters) => {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchKPIs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const kpis = await getKPIs(filters);
        if (isMounted) {
          setData(kpis);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('An error occurred fetching KPIs'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchKPIs();

    return () => {
      isMounted = false;
    };
  }, [filters]); 

  return { data, isLoading, error };
};
