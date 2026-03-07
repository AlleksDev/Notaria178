import { useState, useEffect, useCallback } from 'react';
import { getProfile, getMyAttendance } from '../api/profileApi';
import type { UserProfile, AttendanceRecord } from '../types';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch both concurrently
        const [profileRes, attendanceRes] = await Promise.all([
          getProfile(),
          getMyAttendance()
        ]);
        
        if (isMounted) {
          setProfile(profileRes.data);
          setAttendance(attendanceRes.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Error al cargar la información del perfil')
          );
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
  }, [refetchKey]);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return { profile, attendance, isLoading, error, refetch };
};
