import { useState, useEffect } from 'react';
import { getTopDrafters } from '../api/dashboardApi';
import type { TopDrafter, DashboardFilters } from '../types';

export const useDashboardTopDrafters = (filters?: DashboardFilters) => {
  const [data, setData] = useState<TopDrafter[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const responseData = await getTopDrafters(filters);
        if (isMounted) {
          setData(responseData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error fetching top drafters'));
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
