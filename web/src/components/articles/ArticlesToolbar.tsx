import { memo } from 'react';
import { DataToolbar, type SearchFeedback } from '../data/DataToolbar';
import { useInvenBotActions } from '../invenbot/useInvenBot';

export type StockFilter = 'all' | 'low';

interface ArticlesToolbarProps {
  appliedSearch: string;
  resetQuery: number;
  stockFilter: StockFilter;
  total: number | null;
  lowStockTotal: number | null;
  loading: boolean;
  exporting: boolean;
  searchFeedback: SearchFeedback | null;
  onSearch: (value: string) => void;
  onStockFilter: (value: StockFilter) => void;
  onExport: () => void;
}

export const ArticlesToolbar = memo(function ArticlesToolbar({
  stockFilter, lowStockTotal, onStockFilter, ...props
}: ArticlesToolbarProps) {
  const actions = useInvenBotActions();
  return (
    <DataToolbar {...props} inputId="article-search" searchLabel="Rechercher un article" placeholder="Nom ou référence…"
      noun="référence" easterEgg="invenbot" onEasterEgg={() => {
        actions.play('celebrate');
        actions.say('Tu m’as trouvé ! 🎉', { priority: 2 });
      }}>
      <fieldset className="articles-stock-filter">
        <legend>État du stock</legend>
        <div className="articles-segmented" role="radiogroup" aria-label="État du stock">
          <span className={`articles-segmented__indicator${stockFilter === 'low' ? ' is-low' : ''}`} aria-hidden="true" />
          {(['all', 'low'] as const).map((value) => (
            <button type="button" role="radio" key={value} id={`articles-stock-${value}`} aria-checked={stockFilter === value}
              tabIndex={stockFilter === value ? 0 : -1} onClick={() => onStockFilter(value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  const next = value === 'all' ? 'low' : 'all';
                  onStockFilter(next);
                  document.getElementById(`articles-stock-${next}`)?.focus();
                }
              }}>{value === 'all' ? 'Tous' : 'Stock faible'}</button>
          ))}
        </div>
      </fieldset>
      <span className="sr-only" aria-live="polite">{stockFilter === 'low' && lowStockTotal !== null ? `${lowStockTotal} articles sous le seuil` : ''}</span>
    </DataToolbar>
  );
});
