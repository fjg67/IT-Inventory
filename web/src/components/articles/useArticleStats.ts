import { useEffect, useState } from 'react';
import { apiMessage } from '../../services/apiClient';
import { articleService } from '../../services/articleService';

export interface ArticleStats {
  total: number;
  low: number;
}

export function useArticleStats(siteId: string | undefined, reload: number) {
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) {
      setStats(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const options = { search: '', page: 0, pageSize: 1 } as const;
    setError(null);
    Promise.all([
      articleService.getPage(siteId, { ...options, stock: 'all' }, controller.signal),
      articleService.getPage(siteId, { ...options, stock: 'low' }, controller.signal),
    ])
      .then(([all, low]) => setStats({ total: all.total, low: low.total }))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setStats(null);
          setError(apiMessage(reason));
        }
      });

    return () => controller.abort();
  }, [siteId, reload]);

  return { stats, error };
}
