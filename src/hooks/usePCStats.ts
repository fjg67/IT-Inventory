import { useMemo } from 'react';
import { Article } from '@/types';
import { PC_STATE_COLORS, PC_STATE_ORDER, PCStateKey, getPCStateFromArticle, isPCArticle } from '@/constants/pcStates';

const isSentDescription = (article: Article) => (article.description ?? '').toLowerCase().includes('envoy');

const isAgence = (article: Article) => {
  const values = [article.sousType, article.typeArticle, article.famille]
    .filter((value): value is string => !!value)
    .map((value) => value.toLowerCase());
  return values.some((value) => value.includes('agence'));
};

const isSiege = (article: Article) => {
  const values = [article.sousType, article.typeArticle, article.famille]
    .filter((value): value is string => !!value)
    .map((value) => value.toLowerCase());
  return values.some((value) => value.includes('siège') || value.includes('siege'));
};

export interface PCStateSegment {
  key: PCStateKey;
  label: string;
  value: number;
  color: string;
}

export const usePCStats = (liveArticles: Article[], sentArticles: Article[], weeklyTrendDelta: number = 0) => {
  const livePCs = useMemo(
    () => liveArticles.filter((article) => isPCArticle(article) && !isSentDescription(article)),
    [liveArticles],
  );

  const allPCs = useMemo(() => [...livePCs, ...sentArticles], [livePCs, sentArticles]);

  const counts = useMemo<Record<PCStateKey, number>>(() => {
    const base: Record<PCStateKey, number> = {
      a_chaud: 0,
      a_reusiner: 0,
      en_usinage: 0,
      disponible: 0,
      en_panne: 0,
      envoye: sentArticles.length,
    };

    for (const article of livePCs) {
      const state = getPCStateFromArticle(article).key;
      if (state === 'envoye') continue;
      base[state] += 1;
    }

    return base;
  }, [livePCs, sentArticles.length]);

  const total = allPCs.length;
  const activeCount = livePCs.length;

  const totalSegments = useMemo<PCStateSegment[]>(() => PC_STATE_ORDER.map((key) => ({
    key,
    label: PC_STATE_COLORS[key].label,
    value: counts[key],
    color: PC_STATE_COLORS[key].color,
  })), [counts]);

  const stateCards = useMemo(() => PC_STATE_ORDER.map((key) => ({ ...PC_STATE_COLORS[key], count: counts[key] })), [counts]);

  const modelStats = useMemo(() => {
    const modelCounts = new Map<string, number>();
    for (const article of livePCs) {
      const model = (article.modele ?? '').trim() || 'Sans modèle';
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
    }

    return [...modelCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
      .map(([label, count]) => ({ label, count }));
  }, [livePCs]);

  const repartition = useMemo(() => {
    let agence = 0;
    let siege = 0;
    let other = 0;

    for (const article of allPCs) {
      if (isAgence(article)) {
        agence += 1;
      } else if (isSiege(article)) {
        siege += 1;
      } else {
        other += 1;
      }
    }

    const safeTotal = Math.max(total, 1);
    return {
      agence,
      siege,
      other,
      agencePct: Math.round((agence / safeTotal) * 100),
      siegePct: Math.round((siege / safeTotal) * 100),
      otherPct: Math.round((other / safeTotal) * 100),
    };
  }, [allPCs, total]);

  const trendLabel = useMemo(() => {
    const prefix = weeklyTrendDelta > 0 ? '+' : '';
    return `${prefix}${weeklyTrendDelta} vs sem.`;
  }, [weeklyTrendDelta]);

  return {
    livePCs,
    allPCs,
    total,
    activeCount,
    counts,
    totalSegments,
    stateCards,
    modelStats,
    repartition,
    trendLabel,
  };
};
