import { useState, useEffect } from 'react';
import { getWorkDetail } from '../api/worksApi';
import type { WorkDetail } from '../types';

export const useWorkDetail = (workId: string | null) => {
  const [detail, setDetail] = useState<WorkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!workId) {
      setDetail(null);
      return;
    }

    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getWorkDetail(workId);
        if (isMounted) setDetail(data);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error('Error al cargar detalle')
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [workId]);

  return { detail, isLoading, error };
};
