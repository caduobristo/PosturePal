import { useCallback, useEffect, useState } from 'react';
import { fetchSessionsForUser } from '../lib/api';

export const useUserSessions = (userId) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = useCallback(
    async (id) => {
      if (!id) {
        setSessions([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetchSessionsForUser(id);
        setSessions(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Failed to load sessions', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!userId) return;
    loadSessions(userId);
  }, [loadSessions, userId]);

  const refresh = useCallback(() => loadSessions(userId), [loadSessions, userId]);

  return {
    sessions,
    loading,
    error,
    refresh,
  };
};

export default useUserSessions;
