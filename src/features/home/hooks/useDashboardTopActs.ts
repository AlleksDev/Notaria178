import { useState, useEffect } from 'react';
import { getTopActs } from '../api/dashboardApi';
import type { TopAct, DashboardFilters } from '../types';

export const useDashboardTopActs = (filters?: DashboardFilters) => {
  const [data, setData] = useState<TopAct[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const responseData = await getTopActs(filters);
        if (isMounted) {
          setData(responseData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error fetching top acts'));
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
