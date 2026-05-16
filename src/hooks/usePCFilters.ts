import { useMemo, useState } from 'react';
import { Article } from '@/types';
import { PCStateKey, getPCStateFromArticle, isPCArticle } from '@/constants/pcStates';

export type PCDisplayMode = 'comfort' | 'compact';
export type PCSortBy = 'hostname' | 'state' | 'date';

export const usePCFilters = (pcs: Article[]) => {
  const [query, setQuery] = useState('');
  const [activeStates, setActiveStates] = useState<PCStateKey[]>([]);
  const [sortBy, setSortBy] = useState<PCSortBy>('hostname');
  const [displayMode, setDisplayMode] = useState<PCDisplayMode>('comfort');

  const toggleState = (state: PCStateKey) => {
    setActiveStates((prev) => (prev.includes(state) ? prev.filter((item) => item !== state) : [...prev, state]));
  };

  const filtered = useMemo(() => {
    let result = pcs.filter(isPCArticle);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((pc) =>
        [pc.nom, pc.reference, pc.barcode, pc.modele, pc.marque, pc.sousType, pc.typeArticle, pc.famille]
          .filter((value): value is string => !!value)
          .some((value) => value.toLowerCase().includes(q)),
      );
    }

    if (activeStates.length > 0) {
      result = result.filter((pc) => activeStates.includes(getPCStateFromArticle(pc).key));
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime();
      }

      if (sortBy === 'state') {
        return getPCStateFromArticle(a).label.localeCompare(getPCStateFromArticle(b).label, 'fr');
      }

      return (a.nom || a.reference).localeCompare(b.nom || b.reference, 'fr');
    });

    return result;
  }, [activeStates, pcs, query, sortBy]);

  const countByState = useMemo(
    () =>
      Object.fromEntries(
        (['a_chaud', 'a_reusiner', 'en_usinage', 'disponible', 'envoye'] as PCStateKey[]).map((state) => [
          state,
          pcs.filter((pc) => isPCArticle(pc) && getPCStateFromArticle(pc).key === state).length,
        ]),
      ) as Record<PCStateKey, number>,
    [pcs],
  );

  return {
    filtered,
    query,
    setQuery,
    activeStates,
    toggleState,
    sortBy,
    setSortBy,
    displayMode,
    setDisplayMode,
    countByState,
  };
};
