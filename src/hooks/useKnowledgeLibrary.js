import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useKnowledgeLibrary() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchKnowledgeLibrary() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('knowledge_library')
          .select('*')
          .order('occurrence_count', { ascending: false })
          .limit(20);

        if (fetchError) {
          throw fetchError;
        }

        setEntries(data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch knowledge library entries');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchKnowledgeLibrary();
  }, []);

  return { entries, loading, error };
}

export default useKnowledgeLibrary;