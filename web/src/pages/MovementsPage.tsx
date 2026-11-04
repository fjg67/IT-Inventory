import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { MovementListItem, MovementPage as MovementPageData } from '../types/inventory';
import { movementService } from '../services/movementService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';
import { MovementCreateDrawer } from '../components/movements/MovementCreateDrawer';
import { MovementInsightsPanel } from '../components/movements/MovementInsightsPanel';
import { classifyMovementType, type MovementFilterType } from '../components/movements/movementInsights';
import { DataPagination, usePaginationScroll } from '../components/data/DataPagination';
import { DataTableSkeleton } from '../components/data/DataTableSkeleton';
import { DataToast } from '../components/data/DataToast';
import { useStickyTable } from '../components/data/useStickyTable';
import { useInvenBotActions } from '../components/invenbot/useInvenBot';
import { isMotionReduced } from '../components/invenbot/motion';
import { useOnScreenAndVisible } from '../components/motion/useOnScreenAndVisible';
import { useMotionReduced } from '../components/invenbot/InvenBot';

const PAGE_SIZE = 25;
const movementTypes: { value: MovementFilterType; label: string }[] = [
  { value: 'all', label: 'Tous les types' },
  { value: 'ENTRY', label: 'Entrées' },
  { value: 'EXIT', label: 'Sorties' },
  { value: 'ADJUSTMENT', label: 'Ajustements' },
  { value: 'TRANSFER', label: 'Transferts' },
];

const periods = [
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: 'all', label: 'Toute la période' },
] as const;

export function MovementsPage({ siteId, currentUserName }: { siteId?: string; currentUserName?: string }) {
  const [period, setPeriod] = useState<(typeof periods)[number]['value']>('30days');
  const [type, setType] = useState<MovementFilterType>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<MovementPageData | null>(null);
  const [insightItems, setInsightItems] = useState<MovementListItem[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingMovement, setSavingMovement] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [animateRows, setAnimateRows] = useState(false);
  const exportController = useRef<AbortController | null>(null);
  const summaryCache = useRef(new Map<string, MovementListItem[]>());
  const panelRef = useStickyTable(Boolean(siteId));
  const pageRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const active = useOnScreenAndVisible(pageRef);
  const reduced = useMotionReduced();
  const botActions = useInvenBotActions();

  usePaginationScroll(tableRef, pageIndex);

  useEffect(() => () => exportController.current?.abort(), [siteId]);
  useEffect(() => {
    botActions.stop();
    botActions.setBase('idle');
    return () => {
      botActions.stop();
      botActions.setBase('idle');
      botActions.setLook(null);
    };
  }, [botActions]);

  useEffect(() => {
    if (!siteId) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (selectedDate) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    movementService.getPage(siteId, { period, type, page: pageIndex, pageSize: PAGE_SIZE }, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setResult(page);
        setAnimateRows(!document.hidden && !isMotionReduced());
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, period, type, pageIndex, reload, selectedDate]);

  useEffect(() => {
    if (!siteId) {
      setInsightItems(null);
      setInsightsError(null);
      setInsightsLoading(false);
      return;
    }
    const cacheKey = JSON.stringify([siteId, period, type]);
    const cached = summaryCache.current.get(cacheKey);
    if (cached) {
      setInsightItems(cached);
      setInsightsError(null);
      setInsightsLoading(false);
      return;
    }
    const controller = new AbortController();
    setInsightItems(null);
    setInsightsLoading(true);
    setInsightsError(null);
    movementService.getAll(siteId, { period, type }, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        summaryCache.current.set(cacheKey, items);
        if (summaryCache.current.size > 9) {
          const oldestKey = summaryCache.current.keys().next().value;
          if (oldestKey) summaryCache.current.delete(oldestKey);
        }
        setInsightItems(items);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setInsightsError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setInsightsLoading(false);
      });
    return () => controller.abort();
  }, [siteId, period, type, reload]);

  const dateItems = useMemo(() => {
    if (!selectedDate || !insightItems) return [];
    return insightItems.filter((movement) => dateForMovement(movement.occurredAt) === selectedDate);
  }, [insightItems, selectedDate]);
  const displayTotal = selectedDate ? dateItems.length : result?.total ?? 0;
  const displayItems = selectedDate
    ? dateItems.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)
    : result?.items ?? [];
  const displayPageCount = selectedDate
    ? Math.ceil(dateItems.length / PAGE_SIZE)
    : result ? Math.ceil(result.total / result.pageSize) : 0;

  const reloadData = useCallback(() => {
    summaryCache.current.clear();
    setReload((value) => value + 1);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const closeCreateForm = useCallback(() => {
    if (savingMovement) return;
    setShowCreateForm(false);
    botActions.setBase(baseForType(type));
  }, [savingMovement, botActions, type]);

  function updatePeriod(event: FormEvent<HTMLSelectElement>) {
    setPeriod(event.currentTarget.value as (typeof periods)[number]['value']);
    setPageIndex(0);
    setSelectedDate(null);
  }
  function updateType(event: FormEvent<HTMLSelectElement>) {
    const nextType = event.currentTarget.value as MovementFilterType;
    setType(nextType);
    setPageIndex(0);
    setSelectedDate(null);
    botActions.stop();
    botActions.setBase(baseForType(nextType));
  }

  async function exportMovements() {
    if (!siteId || !result || displayTotal === 0 || exporting) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setExportError(null);
    botActions.setBase('exporting');
    try {
      let movements = await movementService.getAll(siteId, { period, type }, controller.signal);
      if (selectedDate) movements = movements.filter((movement) => dateForMovement(movement.occurredAt) === selectedDate);
      if (controller.signal.aborted) return;
      const csv = createMovementsCsv(movements);
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mouvements_${period}_${type.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      botActions.play('success');
      botActions.say('Export CSV prêt.', { priority: 1 });
    } catch (reason) {
      if (!controller.signal.aborted) {
        setExportError(apiMessage(reason));
        botActions.play('confused');
        botActions.say('Je n’ai pas pu préparer ce CSV.', { priority: 1 });
      }
    } finally {
      if (exportController.current === controller) exportController.current = null;
      setExporting(false);
      botActions.setBase(baseForType(type));
    }
  }

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Aucun site actif n’est associé à cette session. Les mouvements sont consultés par site." />;
  }

  function openCreateForm() {
    setShowCreateForm(true);
    botActions.stop();
    botActions.setBase('checking');
    botActions.say('Choisissons un article et le mouvement à enregistrer.', { priority: 1 });
  }

  function handleMovementSaved() {
    summaryCache.current.clear();
    setShowCreateForm(false);
    setSavingMovement(false);
    setPageIndex(0);
    setSelectedDate(null);
    setToast('Mouvement enregistré.');
    setReload((value) => value + 1);
    botActions.stop();
    botActions.setBase('idle');
    botActions.play('stamping');
    botActions.say('Mouvement enregistré. Le stock est à jour.', { priority: 2 });
  }

  return (
    <section className="data-page" aria-labelledby="movements-heading" ref={pageRef}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">JOURNAL DU SITE</span>
          <h2 id="movements-heading">Mouvements</h2>
          <p>Consultez les entrées, sorties, ajustements et transferts de stock.</p>
        </div>
        <span className="data-source"><span /> Site actif</span>
      </div>

      {showCreateForm && (
        <MovementCreateDrawer
          siteId={siteId}
          saving={savingMovement}
          onCancel={closeCreateForm}
          onSaved={handleMovementSaved}
          onSavingChange={setSavingMovement}
        />
      )}

      <section className="panel articles-panel" ref={panelRef}>
        <div className="articles-toolbar movements-toolbar">
          <label className="movement-filter">
            <span>Période</span>
            <select value={period} onChange={updatePeriod} disabled={loading || exporting}>
              {periods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="movement-filter">
            <span>Type</span>
            <select value={type} onChange={updateType} disabled={loading || exporting}>
              {movementTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="articles-toolbar__actions movements-toolbar__actions">
            {loading ? (
              <span className="articles-count" role="status">Actualisation…</span>
            ) : result && (
              <span className="articles-count" aria-live="polite">
                {new Intl.NumberFormat('fr-FR').format(displayTotal)} mouvement{displayTotal > 1 ? 's' : ''}
              </span>
            )}
            <button className="button button--subtle" type="button" onClick={openCreateForm} disabled={exporting} aria-haspopup="dialog">
              Nouveau mouvement
            </button>
            <button className="button button--subtle" type="button" onClick={() => void exportMovements()} disabled={loading || exporting || !result || displayTotal === 0}>
              {exporting ? 'Export en cours…' : 'Exporter CSV'}
            </button>
          </div>
        </div>

        <MovementInsightsPanel
          items={insightItems ?? []}
          period={period}
          ready={insightItems !== null}
          loading={insightsLoading}
          error={insightsError}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setPageIndex(0);
          }}
          onRetry={reloadData}
        />
        {selectedDate && insightsLoading && <div className="scanner-message" role="status">Actualisation du filtre par date…</div>}
        {error && <DataError message={error} onRetry={reloadData} />}
        {exportError && <DataError message={exportError} onRetry={() => void exportMovements()} />}
        {exporting && <div className="scanner-message" role="status">Préparation du CSV pour les {new Intl.NumberFormat('fr-FR').format(displayTotal)} mouvements filtrés…</div>}
        {loading && !result && (
          <DataTableSkeleton
            label="Chargement des mouvements"
            headers={['Type', 'Article', 'Quantité', 'Site / destination', 'Utilisateur', 'Date', 'Motif']}
            numericColumns={[2]}
          />
        )}
        {result && displayTotal === 0 && !loading && !(selectedDate && insightsLoading) && (
          <div className="empty-state">
            <strong>{selectedDate ? 'Aucun mouvement à cette date' : 'Aucun mouvement sur cette période'}</strong>
            <span>{selectedDate ? 'Choisissez un autre jour sur le graphique ou effacez le filtre.' : 'Le service ne signale aucun mouvement correspondant aux filtres choisis.'}</span>
          </div>
        )}
        {result && displayItems.length > 0 && (
          <>
            <div className="table-scroll" ref={tableRef}>
              <table className="articles-table movements-table" aria-label="Chronologie des mouvements">
                <caption className="sr-only">Mouvements du plus récent au plus ancien.</caption>
                <thead><tr><th>Type</th><th>Article</th><th>Quantité</th><th>Site / destination</th><th>Utilisateur</th><th aria-sort="descending">Date</th><th>Motif</th></tr></thead>
                <tbody>
                  {displayItems.map((movement, index) => {
                    const typeLabel = labelForType(movement.type);
                    const typeClass = classifyMovementType(movement.type)?.toLocaleLowerCase('fr-FR') ?? 'other';
                    const sites = movement.toSiteName && movement.fromSiteName
                      ? `${movement.fromSiteName} → ${movement.toSiteName}`
                      : movement.fromSiteName ?? movement.toSiteName ?? '—';
                    const isMine = Boolean(currentUserName && movement.userName.trim().toLocaleLowerCase('fr-FR') === currentUserName.trim().toLocaleLowerCase('fr-FR'));
                    return (
                      <tr
                        key={movement.id}
                        className={[
                          active && animateRows && !reduced ? 'movement-row--entering' : '',
                          isMine ? 'movement-row--mine' : '',
                        ].filter(Boolean).join(' ')}
                        style={{ '--movement-row-index': index } as CSSProperties}
                      >
                        <td data-label="Type"><span className={`movement-status movement-status--${typeClass}`}>{typeLabel}</span></td>
                        <td data-label="Article" className="movement-article"><strong>{movement.articleName}</strong><small>{movement.articleReference}</small></td>
                        <td data-label="Quantité" className="numeric">{new Intl.NumberFormat('fr-FR').format(movement.quantity)}</td>
                        <td data-label="Site / destination" className="movement-site">{sites}</td>
                        <td data-label="Utilisateur" className={isMine ? 'movement-user movement-user--mine' : 'movement-user'}>
                          <strong>{movement.userName}</strong>{isMine && <small>Vous</small>}
                        </td>
                        <td data-label="Date"><time dateTime={movement.occurredAt}>{formatDate(movement.occurredAt)}</time></td>
                        <td data-label="Motif" className="movement-reason">{movement.reason ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <DataPagination
              pageIndex={pageIndex}
              pageSize={PAGE_SIZE}
              pageCount={displayPageCount}
              total={displayTotal}
              loading={loading}
              onPageChange={setPageIndex}
            />
          </>
        )}
      </section>
      <DataToast message={toast} onDismiss={dismissToast} />
    </section>
  );
}

function labelForType(type: string): string {
  switch (type.toUpperCase()) {
    case 'ENTRY':
    case 'ENTREE':
    case 'ENTRÉE':
      return 'Entrée';
    case 'EXIT':
    case 'SORTIE':
      return 'Sortie';
    case 'ADJUSTMENT':
    case 'AJUSTEMENT':
      return 'Ajustement';
    case 'TRANSFER':
    case 'TRANSFERT':
    case 'TRANSFERT_DEPART':
    case 'TRANSFERT_ARRIVEE':
      return 'Transfert';
    default:
      return type;
  }
}

function baseForType(type: MovementFilterType) {
  switch (type) {
    case 'ENTRY': return 'receiving' as const;
    case 'EXIT': return 'dispatching' as const;
    case 'ADJUSTMENT': return 'counting' as const;
    case 'TRANSFER': return 'transferring' as const;
    default: return 'idle' as const;
  }
}

function dateForMovement(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function createMovementsCsv(movements: MovementPageData['items']): string {
  const columns = ['Date', 'Type', 'Référence article', 'Article', 'Quantité', 'Site d’origine', 'Site de destination', 'Utilisateur', 'Motif'];
  const rows = movements.map((movement) => [
    movement.occurredAt,
    labelForType(movement.type),
    movement.articleReference,
    movement.articleName,
    movement.quantity,
    movement.fromSiteName ?? '',
    movement.toSiteName ?? '',
    movement.userName,
    movement.reason ?? '',
  ]);
  return [columns, ...rows]
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\r\n');
}

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  const safeValue = typeof value === 'string' && /^[\s]*[=+\-@]/.test(value) ? `'${text}` : text;
  return /[;"\r\n]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
}
