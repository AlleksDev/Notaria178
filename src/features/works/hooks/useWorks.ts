import { useState, useEffect, useCallback } from 'react';
import { searchWorks } from '../api/worksApi';
import type { Work, WorkFilters } from '../types';

export const useWorks = (filters: WorkFilters) => {
  const [data, setData] = useState<Work[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await searchWorks(filters);
        if (isMounted) {
          setData(response.data ?? []);
          setTotal(response.total);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error('Error al cargar trabajos')
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { data, total, isLoading, error, refetch };
};
