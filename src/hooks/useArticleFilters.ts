import { useMemo, useState } from 'react';

export interface FilterItem {
  type: 'low_stock' | 'out_of_stock' | 'category' | 'in_stock';
  value?: string;
}

export interface BaseArticleFilterItem {
  name: string;
  reference: string;
  quantity: number;
  minStock: number;
  category?: string;
  updatedAt?: string | Date;
}

export const useArticleFilters = <T extends BaseArticleFilterItem>(articles: T[]) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

  const filtered = useMemo(() => {
    let result = [...articles];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((article) => {
        return (
          article.name.toLowerCase().includes(q) ||
          article.reference.toLowerCase().includes(q)
        );
      });
    }

    activeFilters.forEach((filter) => {
      if (filter.type === 'low_stock') {
        result = result.filter((article) => article.quantity <= article.minStock && article.quantity > 0);
      }
      if (filter.type === 'out_of_stock') {
        result = result.filter((article) => article.quantity === 0);
      }
      if (filter.type === 'in_stock') {
        result = result.filter((article) => article.quantity > article.minStock);
      }
      if (filter.type === 'category' && filter.value) {
        result = result.filter((article) => article.category === filter.value);
      }
    });

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name, 'fr')
          : b.name.localeCompare(a.name, 'fr');
      }

      if (sortBy === 'stock') {
        return sortOrder === 'asc'
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      }

      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    return result;
  }, [activeFilters, articles, query, sortBy, sortOrder]);

  return {
    filtered,
    query,
    setQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    activeFilters,
    setActiveFilters,
  };
};
