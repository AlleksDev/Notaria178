import { useState, useEffect } from 'react';
import { getRecentActivity } from '../api/dashboardApi';
import type { DashboardActivity, DashboardFilters } from '../types';

export const useDashboardActivity = (filters?: DashboardFilters) => {
  const [data, setData] = useState<DashboardActivity[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const responseData = await getRecentActivity(filters);
        if (isMounted) {
          setData(responseData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error fetching recent activity'));
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
