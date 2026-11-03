import { useEffect, useMemo, useState } from 'react';
import type { StockMapData } from '../types/inventory';
import { stockMapService } from '../services/stockMapService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';

type CabinetSide = 'gauche' | 'droite';
type MapStatus = 'ok' | 'low' | 'out';
type StatusFilter = MapStatus | 'free' | null;

interface CabinetItem {
  id: string;
  label: string;
  reference: string;
  bin?: 'red' | 'blue' | 'none';
}

interface CabinetLevel {
  level: number;
  items: CabinetItem[];
}

const CABINETS: Record<CabinetSide, CabinetLevel[]> = {
  gauche: [
    { level: 5, items: [{ id: '1000023', label: 'Sacoches', reference: '1000023' }] },
    { level: 4, items: [{ id: 'INCIDENT PC', label: 'Parc PCs', reference: 'INCIDENT PC' }] },
    { level: 3, items: [{ id: 'SCAN_CHEQUE', label: 'Scanners chèques', reference: 'SCAN_CHEQUE' }] },
    { level: 2, items: [
      { id: '1000004', label: 'Claviers F', reference: '1000004', bin: 'red' },
      { id: '1000003', label: 'Souris Cherry', reference: '1000003', bin: 'red' },
      { id: '1000031', label: 'Souris Filaire', reference: '1000031', bin: 'blue' },
    ] },
    { level: 1, items: [{ id: 'DIVERS_G', label: 'Divers', reference: 'DIVERS_G', bin: 'blue' }] },
  ],
  droite: [
    { level: 5, items: [
      { id: '1600001', label: 'Scanners doc', reference: '1600001' },
      { id: '1000010', label: 'Filtres 16"', reference: '1000010' },
    ] },
    { level: 4, items: [
      { id: 'INCIDENT PC_D', label: 'Parc PCs', reference: 'INCIDENT PC' },
      { id: 'MINI UC', label: 'MINI UC', reference: 'MINI UC' },
    ] },
    { level: 3, items: [
      { id: '1100001', label: 'Casque V1', reference: '1100001', bin: 'red' },
      { id: '1100002', label: 'Casque V2', reference: '1100002', bin: 'red' },
      { id: '1100006', label: 'Base Casque V2', reference: '1100006', bin: 'red' },
    ] },
    { level: 2, items: [
      { id: '1250006', label: 'Câble U-A', reference: '1250006', bin: 'blue' },
      { id: '1250007', label: 'Câble U-C', reference: '1250007', bin: 'blue' },
      { id: '1000007', label: 'Hub USB-C', reference: '1000007', bin: 'blue' },
    ] },
    { level: 1, items: [{ id: 'DIVERS_D', label: 'Cartons Divers', reference: 'DIVERS_D', bin: 'none' }] },
  ],
};

function mapStatus(quantity: number): MapStatus {
  if (quantity === 0) return 'out';
  if (quantity < 5) return 'low';
  return 'ok';
}

export function StockMapPage({ siteId }: { siteId?: string }) {
  const [data, setData] = useState<{ siteId: string; stock: StockMapData } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [activeCabinet, setActiveCabinet] = useState<CabinetSide>('gauche');
  const [filter, setFilter] = useState<StatusFilter>(null);
  const [search, setSearch] = useState('');
  const stock = data && data.siteId === siteId ? data.stock : null;
  const cabinet = CABINETS[activeCabinet];
  const cabinetItems = useMemo(() => cabinet.flatMap((level) => level.items), [cabinet]);
  const quantities = useMemo(() => new Map(stock?.items.map((item) => [item.reference, item.quantity]) ?? []), [stock]);
  const normalizedSearch = search.trim().toLocaleLowerCase('fr');
  const matchingItems = useMemo(
    () => cabinet.flatMap((level) => level.items.filter((item) => matchesCabinetItem(item, normalizedSearch, level.level))),
    [cabinet, normalizedSearch],
  );
  const summary = useMemo(() => {
    const counts = cabinetItems.reduce(
      (result, item) => {
        const status = mapStatus(quantities.get(item.reference) ?? 0);
        result[status] += 1;
        return result;
      },
      { ok: 0, low: 0, out: 0 },
    );
    return {
      ...counts,
      occupied: cabinetItems.length,
      free: cabinet.reduce((total, level) => total + Math.max(0, 3 - level.items.length), 0),
    };
  }, [cabinet, cabinetItems, quantities]);

  useEffect(() => {
    if (!siteId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    stockMapService.getStock(siteId, controller.signal)
      .then((result) => setData({ siteId, stock: result }))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, reload]);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Aucun site actif n’est associé à cette session. Les quantités de la cartographie sont consultées par site." />;
  }

  function toggleFilter(value: Exclude<StatusFilter, null>) {
    setFilter((current) => current === value ? null : value);
  }

  return (
    <section className="data-page" aria-labelledby="stock-map-heading">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLAN DE RANGEMENT</span>
          <h2 id="stock-map-heading">Cartographie</h2>
          <p>Consultez les armoires, leurs emplacements et les quantités du stock actif.</p>
        </div>
        <span className="data-source"><span /> Données du site actif</span>
      </div>

      {stock && (
        <section className="panel stock-map-summary" aria-label="Résumé de l’armoire sélectionnée" aria-busy={loading}>
          <div>
            <strong>{summary.occupied} emplacements occupés · {summary.free} libres</strong>
            <span>{summary.low} faibles · {summary.out} en rupture</span>
          </div>
          <button className="button button--subtle" type="button" onClick={() => setReload((value) => value + 1)} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
        </section>
      )}

      <section className="stock-map-tools">
        <div className="stock-map-tabs" role="tablist" aria-label="Sélection de l’armoire">
          {(['gauche', 'droite'] as const).map((side) => (
            <button
              className={`stock-map-tab${activeCabinet === side ? ' stock-map-tab--active' : ''}`}
              key={side}
              type="button"
              role="tab"
              aria-selected={activeCabinet === side}
              onClick={() => { setActiveCabinet(side); setFilter(null); }}
            >
              Armoire {side === 'gauche' ? 'gauche' : 'droite'}
            </button>
          ))}
        </div>
        <label className="stock-map-search">
          <span className="sr-only">Rechercher un article ou un niveau dans l’armoire</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Article, référence ou niveau…"
            aria-describedby="stock-map-search-result"
          />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Effacer la recherche">Effacer</button>}
        </label>
        {normalizedSearch && (
          <p className="stock-map-search-result" id="stock-map-search-result" role="status">
            {matchingItems.length
              ? `${matchingItems.length} emplacement${matchingItems.length === 1 ? '' : 's'} correspondant${matchingItems.length === 1 ? '' : 's'} dans cette armoire.`
              : 'Aucun article ou niveau ne correspond dans cette armoire.'}
          </p>
        )}
        <div className="stock-map-legend" aria-label="Filtrer par état du stock">
          <StatusButton status="ok" label="Correct" count={summary.ok} active={filter === 'ok'} onClick={() => toggleFilter('ok')} disabled={!stock} />
          <StatusButton status="low" label="Faible" count={summary.low} active={filter === 'low'} onClick={() => toggleFilter('low')} disabled={!stock} />
          <StatusButton status="out" label="Rupture" count={summary.out} active={filter === 'out'} onClick={() => toggleFilter('out')} disabled={!stock} />
          <StatusButton status="free" label="Libre" count={summary.free} active={filter === 'free'} onClick={() => toggleFilter('free')} disabled={!stock} />
        </div>
      </section>

      {error && <DataError message={error} onRetry={() => setReload((value) => value + 1)} />}
      {loading && !stock && <div className="loading-card loading-card--table" aria-live="polite"><span className="spinner spinner--green" aria-hidden="true" />Chargement des quantités réelles…</div>}
      {stock && (
        <section className="stock-map-cabinet" aria-label={`Armoire ${activeCabinet}`}>
          {cabinet.map((level) => (
            <section className="stock-map-shelf" key={level.level} aria-label={`Niveau ${level.level}`}>
              <div className="stock-map-shelf__label"><span>Niveau {level.level}</span><span>{level.items.length} / 3</span></div>
              <div className="stock-map-shelf__slots">
                {level.items.map((item) => {
                  const quantity = quantities.get(item.reference) ?? 0;
                  const status = mapStatus(quantity);
                  const matchesSearch = matchesCabinetItem(item, normalizedSearch, level.level);
                  const dimmed = !matchesSearch || (filter !== null && filter !== 'free' && filter !== status);
                  return (
                    <article className={`stock-map-slot stock-map-slot--${status}${dimmed ? ' stock-map-slot--dimmed' : ''}`} key={item.id}>
                      <span className={`stock-map-slot__icon${item.bin ? ` stock-map-slot__icon--${item.bin}` : ''}`} aria-hidden="true"><CabinetIcon label={item.label} /></span>
                      <strong>{item.label}</strong>
                      <span className="stock-map-slot__reference">Réf. {item.reference}</span>
                      <span className={`stock-map-slot__quantity stock-map-slot__quantity--${status}`}>
                        {quantity} {quantity === 1 ? 'unité' : 'unités'}
                      </span>
                      <span className={`stock-map-slot__status stock-map-slot__status--${status}`}>
                        {status === 'ok' ? 'Correct' : status === 'low' ? 'Faible' : 'Rupture'}
                      </span>
                    </article>
                  );
                })}
                {Array.from({ length: Math.max(0, 3 - level.items.length) }, (_, index) => (
                  <div
                    className={`stock-map-slot stock-map-slot--free${filter === 'free' ? ' stock-map-slot--free-active' : ''}${normalizedSearch && !matchesFreeSlot(normalizedSearch, level.level) ? ' stock-map-slot--dimmed' : ''}`}
                    key={`free-${index}`}
                    aria-label={`Emplacement libre, niveau ${level.level}`}
                  >
                    <span className="stock-map-slot__free-icon" aria-hidden="true">+</span>
                    <strong>Emplacement libre</strong>
                    <span className="stock-map-slot__reference">Niveau {level.level}</span>
                    <span className="stock-map-slot__status stock-map-slot__status--free">Libre</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </section>
      )}
      {stock && filter === 'free' && <p className="stock-map-note">Les emplacements libres sont représentés par des cases en pointillés sur chaque niveau.</p>}
      <p className="stock-map-note">États selon les seuils du plan mobile : rupture à 0, faible de 1 à 4, correct à partir de 5 unités.</p>
    </section>
  );
}

function matchesCabinetItem(item: CabinetItem, search: string, level?: number): boolean {
  if (!search) return true;
  return [item.label, item.reference, item.id, level === undefined ? '' : `niveau ${level}`]
    .some((value) => value.toLocaleLowerCase('fr').includes(search));
}

function matchesFreeSlot(search: string, level: number): boolean {
  return ['libre', 'emplacement', `niveau ${level}`].some((value) => value.includes(search));
}

function StatusButton({ status, label, count, active, disabled, onClick }: {
  status: MapStatus | 'free';
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`stock-map-filter${active ? ' stock-map-filter--active' : ''}`}
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={`stock-map-filter__dot stock-map-filter__dot--${status}`} />
      {label}<strong>{count}</strong>
    </button>
  );
}

function CabinetIcon({ label }: { label: string }) {
  const code = label.includes('PC') || label.includes('UC') ? 'computer'
    : label.includes('Souris') ? 'mouse'
      : label.includes('Clavier') ? 'keyboard'
        : label.includes('Casque') ? 'headphones'
          : label.includes('Sacoche') ? 'bag'
            : label.includes('Câble') || label.includes('Hub') ? 'cable'
              : label.includes('Scanner') ? 'scanner' : 'box';
  const shapes: Record<string, React.ReactNode> = {
    computer: <><rect x="4" y="4" width="16" height="12" rx="1.5" /><path d="M9 20h6m-3-4v4" /></>,
    mouse: <><rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 3v5" /></>,
    keyboard: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10" /></>,
    headphones: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="12" width="4" height="7" rx="2" /><rect x="17" y="12" width="4" height="7" rx="2" /></>,
    bag: <><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    cable: <><path d="M7 7V4m10 3V4M6 7h12v6a6 6 0 0 1-12 0V7Zm6 12v2" /></>,
    scanner: <><path d="m6 5 12 3-2 8-12-3 2-8Z" /><path d="m4 17 12 3m-8-7 2-6" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8m-9 5v9" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none">{shapes[code]}</svg>;
}
