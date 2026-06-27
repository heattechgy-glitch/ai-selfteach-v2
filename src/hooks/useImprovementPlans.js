import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useImprovementPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('improvement_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching improvement plans:', error);
        setPlans([]);
      } else {
        setPlans(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching improvement plans:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const markDone = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('improvement_plans')
        .update({ done: true, completed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error marking plan as done:', error);
        return false;
      }

      setPlans((prevPlans) =>
        prevPlans.map((plan) =>
          plan.id === id
            ? { ...plan, done: true, completed_at: new Date().toISOString() }
            : plan
        )
      );
      return true;
    } catch (err) {
      console.error('Unexpected error marking plan as done:', err);
      return false;
    }
  }, []);

  return { plans, loading, markDone };
}

export default useImprovementPlans;