import { useMemo, useState } from 'react';
import { Article } from '@/types';
import { PCStateKey, getPCStateFromArticle } from '@/constants/pcStates';

const SEARCH_FIELDS: Array<keyof Article> = [
  'reference',
  'nom',
  'displayName',
  'display_name',
  'description',
  'barcode',
  'modele',
  'marque',
  'famille',
  'sousType',
  'emplacement',
];

export const usePCFilters = (pcs: Article[]) => {
  const [query, setQuery] = useState('');
  const [activeStates, setActiveStates] = useState<PCStateKey[]>([]);

  const toggleState = (state: PCStateKey) => {
    setActiveStates((prev) => (prev.includes(state) ? prev.filter((item) => item !== state) : [...prev, state]));
  };

  const setOnlyState = (state: PCStateKey) => {
    setActiveStates((prev) => (prev.length === 1 && prev[0] === state ? [] : [state]));
  };

  const clearStates = () => setActiveStates([]);

  const clearAll = () => {
    setQuery('');
    setActiveStates([]);
  };

  const filtered = useMemo(() => {
    let result = [...pcs];

    if (query.trim().length > 0) {
      const normalized = query.trim().toLowerCase();
      result = result.filter((pc) =>
        SEARCH_FIELDS.some((field) => {
          const value = pc[field];
          return typeof value === 'string' && value.toLowerCase().includes(normalized);
        }),
      );
    }

    if (activeStates.length > 0) {
      result = result.filter((pc) => activeStates.includes(getPCStateFromArticle(pc).key));
    }

    return result.sort((a, b) => new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime());
  }, [activeStates, pcs, query]);

  const countByState = useMemo<Record<PCStateKey, number>>(
    () => ({
      a_chaud: pcs.filter((pc) => getPCStateFromArticle(pc).key === 'a_chaud').length,
      a_reusiner: pcs.filter((pc) => getPCStateFromArticle(pc).key === 'a_reusiner').length,
      en_usinage: pcs.filter((pc) => getPCStateFromArticle(pc).key === 'en_usinage').length,
      disponible: pcs.filter((pc) => getPCStateFromArticle(pc).key === 'disponible').length,
      en_panne: pcs.filter((pc) => getPCStateFromArticle(pc).key === 'en_panne').length,
      envoye: pcs.filter((pc) => getPCStateFromArticle(pc).key === 'envoye').length,
    }),
    [pcs],
  );

  return {
    filtered,
    query,
    setQuery,
    activeStates,
    toggleState,
    setOnlyState,
    clearStates,
    clearAll,
    countByState,
  };
};
