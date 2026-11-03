import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { MovementPage as MovementPageData } from '../types/inventory';
import { movementService } from '../services/movementService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';
import { MovementCreateForm } from './MovementCreateForm';

const PAGE_SIZE = 25;
const movementTypes = [
  { value: 'all', label: 'Tous les types' },
  { value: 'ENTRY', label: 'Entrées' },
  { value: 'EXIT', label: 'Sorties' },
  { value: 'ADJUSTMENT', label: 'Ajustements' },
  { value: 'TRANSFER', label: 'Transferts' },
] as const;

const periods = [
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: 'all', label: 'Toute la période' },
] as const;

export function MovementsPage({ siteId }: { siteId?: string }) {
  const [period, setPeriod] = useState<(typeof periods)[number]['value']>('30days');
  const [type, setType] = useState<(typeof movementTypes)[number]['value']>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<MovementPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reload, setReload] = useState(0);
  const exportController = useRef<AbortController | null>(null);

  useEffect(() => () => exportController.current?.abort(), [siteId]);

  useEffect(() => {
    if (!siteId) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    movementService.getPage(siteId, { period, type, page: pageIndex, pageSize: PAGE_SIZE }, controller.signal)
      .then(setResult)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, period, type, pageIndex, reload]);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Aucun site actif n’est associé à cette session. Les mouvements sont consultés par site." />;
  }

  const pageCount = result ? Math.ceil(result.total / result.pageSize) : 0;
  function updatePeriod(event: FormEvent<HTMLSelectElement>) {
    setPeriod(event.currentTarget.value as (typeof periods)[number]['value']);
    setPageIndex(0);
  }
  function updateType(event: FormEvent<HTMLSelectElement>) {
    setType(event.currentTarget.value as (typeof movementTypes)[number]['value']);
    setPageIndex(0);
  }

  async function exportMovements() {
    if (!siteId || !result || result.total === 0 || exporting) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setExportError(null);
    try {
      const movements = await movementService.getAll(siteId, { period, type }, controller.signal);
      if (controller.signal.aborted) return;
      const csv = createMovementsCsv(movements);
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mouvements_${period}_${type.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      if (!controller.signal.aborted) setExportError(apiMessage(reason));
    } finally {
      if (exportController.current === controller) exportController.current = null;
      setExporting(false);
    }
  }

  return (
    <section className="data-page" aria-labelledby="movements-heading">
      <div className="page-heading">
        <div>
          <span className="eyebrow">JOURNAL DU SITE</span>
          <h2 id="movements-heading">Mouvements</h2>
          <p>Consultez les entrées, sorties, ajustements et transferts de stock.</p>
        </div>
        <span className="data-source"><span /> Site actif</span>
      </div>

      {showCreateForm && (
        <MovementCreateForm
          siteId={siteId}
          onCancel={() => setShowCreateForm(false)}
          onSaved={() => {
            setShowCreateForm(false);
            setPageIndex(0);
            setReload((value) => value + 1);
          }}
        />
      )}

      <section className="panel articles-panel">
        <div className="movements-toolbar">
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
          {result && (
            <div className="movements-toolbar__actions">
              <span className="articles-count">{new Intl.NumberFormat('fr-FR').format(result.total)} mouvement{result.total > 1 ? 's' : ''}</span>
              <button className="button button--subtle" type="button" onClick={() => setShowCreateForm((value) => !value)} disabled={loading || exporting}>
                {showCreateForm ? 'Fermer le formulaire' : 'Nouveau mouvement'}
              </button>
              <button className="button button--subtle" type="button" onClick={() => void exportMovements()} disabled={loading || exporting || result.total === 0}>
                {exporting ? 'Export en cours…' : 'Exporter CSV'}
              </button>
            </div>
          )}
          {!result && !loading && (
            <button className="button button--subtle" type="button" onClick={() => setShowCreateForm((value) => !value)} disabled={exporting}>
              {showCreateForm ? 'Fermer le formulaire' : 'Nouveau mouvement'}
            </button>
          )}
        </div>

        {error && <DataError message={error} onRetry={() => setReload((value) => value + 1)} />}
        {exportError && <DataError message={exportError} onRetry={() => void exportMovements()} />}
        {exporting && <div className="scanner-message" role="status">Préparation du CSV pour les {new Intl.NumberFormat('fr-FR').format(result?.total ?? 0)} mouvements filtrés…</div>}
        {loading && !result && <div className="loading-card loading-card--table"><span className="spinner spinner--green" aria-hidden="true" />Chargement des mouvements…</div>}
        {result && result.items.length === 0 && !loading && (
          <div className="empty-state"><strong>Aucun mouvement sur cette période</strong><span>Le service ne signale aucun mouvement correspondant aux filtres choisis.</span></div>
        )}
        {result && result.items.length > 0 && (
          <>
            <div className="table-scroll">
              <table className="articles-table movements-table">
                <thead><tr><th>Type</th><th>Article</th><th>Quantité</th><th>Site / destination</th><th>Utilisateur</th><th>Date</th><th>Motif</th></tr></thead>
                <tbody>
                  {result.items.map((movement) => {
                    const typeLabel = labelForType(movement.type);
                    const sites = movement.toSiteName && movement.fromSiteName
                      ? `${movement.fromSiteName} → ${movement.toSiteName}`
                      : movement.fromSiteName ?? movement.toSiteName ?? '—';
                    return (
                      <tr key={movement.id}>
                        <td data-label="Type"><span className={`movement-status movement-status--${movement.type.toLowerCase()}`}>{typeLabel}</span></td>
                        <td data-label="Article" className="movement-article"><strong>{movement.articleName}</strong><small>{movement.articleReference}</small></td>
                        <td data-label="Quantité" className="numeric">{new Intl.NumberFormat('fr-FR').format(movement.quantity)}</td>
                        <td data-label="Site / destination" className="movement-site">{sites}</td>
                        <td data-label="Utilisateur">{movement.userName}</td>
                        <td data-label="Date"><time dateTime={movement.occurredAt}>{formatDate(movement.occurredAt)}</time></td>
                        <td data-label="Motif" className="movement-reason">{movement.reason ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>{`${pageIndex * PAGE_SIZE + 1}–${Math.min((pageIndex + 1) * PAGE_SIZE, result.total)} sur ${result.total}`}</span>
              <div>
                <button className="button button--subtle" type="button" disabled={pageIndex === 0 || loading} onClick={() => setPageIndex((value) => value - 1)}>Précédent</button>
                <span className="pagination__page">{pageCount > 0 ? `${pageIndex + 1} / ${pageCount}` : '0 / 0'}</span>
                <button className="button button--subtle" type="button" disabled={!result || pageIndex + 1 >= pageCount || loading} onClick={() => setPageIndex((value) => value + 1)}>Suivant</button>
              </div>
            </div>
          </>
        )}
      </section>
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function createMovementsCsv(movements: MovementPageData['items']): string {
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
