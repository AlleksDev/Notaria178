import { useState, useEffect } from 'react';
import { getTrend } from '../api/dashboardApi';
import type { DashboardTrend, DashboardFilters } from '../types';

export const useDashboardTrend = (filters?: DashboardFilters & { group_by?: string }) => {
  const [data, setData] = useState<DashboardTrend | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Consider stringifying filters to avoid deep object reference issues in dependency array
  // or use an external library like ahooks' useDeepCompareEffect if filters gets complex.
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const responseData = await getTrend(filters);
        if (isMounted) {
          setData(responseData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error fetching trend'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-react-hooks/exhaustive-deps
  }, [filtersKey]); 

  return { data, isLoading, error };
};
