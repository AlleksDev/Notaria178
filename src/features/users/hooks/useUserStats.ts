import { useState, useEffect, useCallback } from 'react';
import { searchUsers } from '../api/usersApi';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

export const useUserStats = (branchId?: string) => {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [allRes, activeRes, inactiveRes] = await Promise.all([
          searchUsers({ limit: 1, offset: 0, branch_id: branchId }),
          searchUsers({ limit: 1, offset: 0, branch_id: branchId, status: 'ACTIVE' }),
          searchUsers({ limit: 1, offset: 0, branch_id: branchId, status: 'INACTIVE' }),
        ]);

        if (isMounted) {
          setStats({
            total: allRes.total,
            active: activeRes.total,
            inactive: inactiveRes.total,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Error al cargar estadísticas')
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
