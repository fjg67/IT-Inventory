import { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import { articleRepository } from '@/database';
import { Article } from '@/types';

export const useArticleSearch = (siteId?: string | number | null, debounceMs: number = 200) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);

  const runSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!siteId || q.trim().length < 2) {
          setResults([]);
          setSearching(false);
          return;
        }

        setSearching(true);
        try {
          const response = await articleRepository.search(siteId, { searchQuery: q.trim(), stockFaible: false }, 0, 10);
          setResults(response.data);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, debounceMs),
    [debounceMs, siteId],
  );

  useEffect(() => {
    return () => {
      runSearch.cancel();
    };
  }, [runSearch]);

  const onChangeQuery = useCallback((next: string) => {
    setQuery(next);
    runSearch(next);
  }, [runSearch]);

  const reset = useCallback(() => {
    runSearch.cancel();
    setQuery('');
    setResults([]);
    setSearching(false);
  }, [runSearch]);

  return {
    query,
    setQuery,
    onChangeQuery,
    results,
    setResults,
    searching,
    reset,
  };
};
