import { useMemo, useState } from 'react';
import { Mouvement } from '@/types';
import { MovementPeriod, MovementTypeKey, getMovementTypeKey } from '@/constants/movementTypes';

export interface MovementSection {
  title: string;
  isToday: boolean;
  data: Mouvement[];
}

export const useMovementFilters = (movements: Mouvement[]) => {
  const [activeType, setActiveType] = useState<MovementTypeKey>('tous');
  const [period, setPeriod] = useState<MovementPeriod>('7days');
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const filtered = useMemo(() => {
    let result = [...movements];
    const now = new Date();

    if (period === 'today') {
      result = result.filter((movement) => isSameDay(new Date(movement.dateMouvement), now));
    } else {
      const days = period === '7days' ? 7 : 30;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - (days - 1));
      cutoff.setHours(0, 0, 0, 0);
      result = result.filter((movement) => new Date(movement.dateMouvement) >= cutoff);
    }

    if (activeType !== 'tous') {
      result = result.filter((movement) => getMovementTypeKey(movement.type) === activeType || (activeType === 'transfert' && String(movement.type).startsWith('transfert')));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((movement) =>
        [movement.article?.nom, movement.article?.reference, movement.technicien?.prenom, movement.technicien?.nom]
          .filter((value): value is string => !!value)
          .some((value) => value.toLowerCase().includes(q)),
      );
    }

    return result.sort((a, b) => new Date(b.dateMouvement).getTime() - new Date(a.dateMouvement).getTime());
  }, [activeType, movements, period, query]);

  const sections = useMemo((): MovementSection[] => {
    const groups = new Map<string, Mouvement[]>();

    for (const movement of filtered) {
      const date = new Date(movement.dateMouvement);
      const title = isSameDay(date, new Date())
        ? 'AUJOURD\'HUI'
        : isSameDay(date, addDays(new Date(), -1))
          ? 'HIER'
          : formatSectionDate(date).toUpperCase();
      const bucket = groups.get(title) ?? [];
      bucket.push(movement);
      groups.set(title, bucket);
    }

    return [...groups.entries()].map(([title, data]) => ({
      title,
      isToday: title === 'AUJOURD\'HUI',
      data,
    }));
  }, [filtered]);

  const counts = useMemo(() => {
    const source = filtered;
    const countType = (type: MovementTypeKey) =>
      type === 'tous'
        ? source.length
        : source.filter((movement) => getMovementTypeKey(movement.type) === type || (type === 'transfert' && String(movement.type).startsWith('transfert'))).length;

    return {
      tous: source.length,
      entree: countType('entree'),
      sortie: countType('sortie'),
      ajustement: countType('ajustement'),
      transfert: countType('transfert'),
    };
  }, [filtered]);

  const totals = useMemo(() => ({
    entrees: filtered.filter((movement) => getMovementTypeKey(movement.type) === 'entree').reduce((acc, movement) => acc + Math.abs(movement.quantite), 0),
    sorties: filtered.filter((movement) => getMovementTypeKey(movement.type) === 'sortie').reduce((acc, movement) => acc + Math.abs(movement.quantite), 0),
    ajustements: filtered.filter((movement) => getMovementTypeKey(movement.type) === 'ajustement').reduce((acc, movement) => acc + Math.abs(movement.quantite), 0),
    transferts: filtered.filter((movement) => getMovementTypeKey(movement.type) === 'transfert').length,
  }), [filtered]);

  return {
    filtered,
    sections,
    counts,
    totals,
    activeType,
    setActiveType,
    period,
    setPeriod,
    query,
    setQuery,
    searchVisible,
    setSearchVisible,
  };
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatSectionDate = (date: Date): string =>
  date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
