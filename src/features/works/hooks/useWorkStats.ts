import { useState, useEffect, useCallback } from 'react';
import { getWorkKPIs } from '../api/worksApi';
import type { WorkKPIs } from '../types';

const DEFAULT_KPIS: WorkKPIs = {
  total: 0,
  pending: 0,
  in_progress: 0,
  ready_for_review: 0,
  approved: 0,
  rejected: 0,
};

export const useWorkStats = (branchId?: string) => {
  const [stats, setStats] = useState<WorkKPIs>(DEFAULT_KPIS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const kpis = await getWorkKPIs(branchId, 'all');
        if (isMounted) setStats(kpis);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Error al cargar estadísticas')
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [branchId, refetchKey]);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { stats, isLoading, error, refetch };
};
