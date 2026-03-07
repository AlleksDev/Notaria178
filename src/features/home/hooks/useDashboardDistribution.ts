import { useState, useEffect } from 'react';
import { getDistribution } from '../api/dashboardApi';
import type { DashboardDistribution, DashboardFilters } from '../types';

export const useDashboardDistribution = (filters?: DashboardFilters) => {
  const [data, setData] = useState<DashboardDistribution | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const responseData = await getDistribution(filters);
        if (isMounted) {
          setData(responseData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error fetching distribution'));
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
