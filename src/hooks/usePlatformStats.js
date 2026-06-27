import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const usePlatformStats = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    successRate: 0,
    librarySize: 0,
    activePlans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch task executions stats
      const { data: taskExecutions, error: taskError } = await supabase
        .from('task_executions')
        .select('id, status', { count: 'exact' });

      if (taskError) throw taskError;

      const totalTasks = taskExecutions?.length || 0;
      const successfulTasks = taskExecutions?.filter(
        (task) => task.status === 'success' || task.status === 'completed'
      ).length || 0;
      const successRate = totalTasks > 0 
        ? Math.round((successfulTasks / totalTasks) * 100) 
        : 0;

      // Fetch knowledge library count
      const { count: libraryCount, error: libraryError } = await supabase
        .from('knowledge_library')
        .select('*', { count: 'exact', head: true });

      if (libraryError) throw libraryError;

      // Fetch active improvement plans count
      const { count: activePlansCount, error: plansError } = await supabase
        .from('improvement_plans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (plansError) throw plansError;

      setStats({
        totalTasks,
        successRate,
        librarySize: libraryCount || 0,
        activePlans: activePlansCount || 0,
      });
    } catch (err) {
      console.error('Error fetching platform stats:', err);
      setError(err.message || 'Failed to fetch platform statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    totalTasks: stats.totalTasks,
    successRate: stats.successRate,
    librarySize: stats.librarySize,
    activePlans: stats.activePlans,
    loading,
    error,
    refetch,
  };
};

export default usePlatformStats;