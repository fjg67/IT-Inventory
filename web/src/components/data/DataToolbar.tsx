import { memo, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CountUp } from '../dashboard/CountUp';
import { spawnRipple } from '../dashboard/ripple';
import { InvenBot, nodInvenBot, useMotionReduced } from '../invenbot/InvenBot';

export interface SearchFeedback { id: number; found: boolean }

export interface DataToolbarProps {
  inputId: string;
  searchLabel: string;
  placeholder: string;
  appliedSearch: string;
  resetQuery: number;
  total: number | null;
  noun: string;
  loading: boolean;
  exporting: boolean;
  searchFeedback: SearchFeedback | null;
  onSearch: (value: string) => void;
  onExport: () => void;
  onTyping?: (value: string) => void;
  onTypingEnd?: () => void;
  easterEgg?: string;
  onEasterEgg?: () => void;
  workshop?: boolean;
  disableSearchDuringExport?: boolean;
  children?: ReactNode;
}

export const DataToolbar = memo(function DataToolbar({
  inputId, searchLabel, placeholder, appliedSearch, resetQuery, total, noun, loading, exporting,
  searchFeedback, onSearch, onExport, onTyping, onTypingEnd, easterEgg, onEasterEgg,
  workshop = false, disableSearchDuringExport = false, children,
}: DataToolbarProps) {
  const [query, setQuery] = useState(appliedSearch);
  const [botState, setBotState] = useState<'idle' | 'typing' | 'searching' | 'found' | 'confused'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const botRef = useRef<HTMLSpanElement>(null);
  const lastNod = useRef(0);
  const eggTriggered = useRef(false);
  const reduced = useMotionReduced();

  useEffect(() => setQuery(appliedSearch), [appliedSearch, resetQuery]);
  useEffect(() => {
    if (!searchFeedback) return;
    setBotState(searchFeedback.found ? 'found' : 'confused');
    const timer = window.setTimeout(() => setBotState('idle'), searchFeedback.found ? 1200 : 1700);
    return () => window.clearTimeout(timer);
  }, [searchFeedback]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  function updateQuery(value: string) {
    setQuery(value);
    setBotState(value ? 'typing' : 'idle');
    onTyping?.(value);
    const isEgg = !!easterEgg && value.trim().toLocaleLowerCase('fr-FR') === easterEgg;
    if (isEgg && !eggTriggered.current) onEasterEgg?.();
    eggTriggered.current = isEgg;
    const now = performance.now();
    if (value && now - lastNod.current >= 250) {
      lastNod.current = now;
      nodInvenBot(botRef.current);
    }
    const input = inputRef.current;
    if (input) {
      const length = Math.max(1, value.length);
      const x = Math.max(-1, Math.min(1, (input.selectionStart ?? length) / length * 2 - 1));
      botRef.current?.style.setProperty('--article-look-x', x.toFixed(2));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBotState('searching');
    onSearch(query.trim());
  }

  return (
    <div className="articles-toolbar">
      <form className="search-form articles-search-form" onSubmit={submit} role="search">
        <label className="sr-only" htmlFor={inputId}>{searchLabel}</label>
        <svg className="articles-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
        <input ref={inputRef} id={inputId} value={query} placeholder={placeholder} autoComplete="off"
          disabled={disableSearchDuringExport && exporting}
          onChange={(event) => updateQuery(event.currentTarget.value)}
          onFocus={() => { setBotState('typing'); onTyping?.(query); }}
          onBlur={() => { setBotState((current) => current === 'typing' ? 'idle' : current); onTypingEnd?.(); }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) { event.preventDefault(); updateQuery(''); }
          }} />
        {!query && <kbd className="articles-search-shortcut" aria-hidden="true">/</kbd>}
        {query && <button className="articles-search-clear" type="button" aria-label="Effacer la recherche"
          disabled={disableSearchDuringExport && exporting}
          onClick={() => { updateQuery(''); inputRef.current?.focus(); setBotState('searching'); onSearch(''); }}>×</button>}
        <button className="button button--subtle articles-search-submit" type="submit"
          disabled={loading || (disableSearchDuringExport && exporting)}>Rechercher</button>
        <span className="articles-search-bot" ref={botRef}>
          <InvenBot size="mini" workshop={workshop} state={botState} eventId={searchFeedback?.id ?? 0} />
        </span>
      </form>
      {children}
      <div className="articles-toolbar__actions">
        {total !== null && <span className="articles-count" aria-live="polite"><CountUp value={total} duration={reduced ? 0 : 1100} /> {noun}{total > 1 ? 's' : ''}</span>}
        <button className="button button--subtle articles-export-button" type="button" onClick={onExport} onPointerDown={spawnRipple}
          disabled={loading || exporting || !total}>{exporting ? 'Export en cours…' : 'Exporter CSV'}</button>
      </div>
    </div>
  );
});
