import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ArticlePage as ArticlePageData } from '../types/inventory';
import { articleService } from '../services/articleService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';
import { ArticleRow } from '../components/articles/ArticleRow';
import { ArticlesSkeleton } from '../components/articles/ArticlesSkeleton';
import { ArticlesToolbar, type StockFilter } from '../components/articles/ArticlesToolbar';
import { DataToast } from '../components/data/DataToast';
import { PhotoPreview, type PhotoPreviewItem } from '../components/articles/PhotoPreview';
import { useArticleStats } from '../components/articles/useArticleStats';
import { useStickyTable } from '../components/data/useStickyTable';
import { DataPagination, usePaginationScroll } from '../components/data/DataPagination';
import { CountUp } from '../components/dashboard/CountUp';
import { SplitWords } from '../components/dashboard/SplitWords';
import { InvenBot } from '../components/invenbot/InvenBot';
import { InvenBotStage } from '../components/invenbot/InvenBotStage';
import { useInvenBotActions } from '../components/invenbot/useInvenBot';
import '../components/articles/articles.css';

const PAGE_SIZE = 25;

export function ArticlesPage({ siteId }: { siteId?: string }) {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<ArticlePageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [searchFeedback, setSearchFeedback] = useState<{ id: number; found: boolean } | null>(null);
  const [queryReset, setQueryReset] = useState(0);
  const [resultVersion, setResultVersion] = useState(0);
  const [pageDirection, setPageDirection] = useState<'next' | 'previous'>('next');
  const [previewPhoto, setPreviewPhoto] = useState<PhotoPreviewItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const statsResult = useArticleStats(siteId, reload);
  const stats = statsResult.stats;
  const botActions = useInvenBotActions();
  const headerBotRef = useRef<HTMLDivElement>(null);
  const lastLookUpdate = useRef(0);
  const feedbackId = useRef(0);
  const greeted = useRef(false);
  const pendingSearch = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const panelRef = useStickyTable(Boolean(siteId));
  usePaginationScroll(tableRef, pageIndex);
  const handleLowStockPointer = useCallback((event: ReactPointerEvent<HTMLTableRowElement>) => {
    const now = performance.now();
    if (now - lastLookUpdate.current < 80) return;
    lastLookUpdate.current = now;
    const botRect = headerBotRef.current?.getBoundingClientRect();
    const rowRect = event.currentTarget.getBoundingClientRect();
    if (!botRect) return;
    const dx = rowRect.left + rowRect.width / 2 - (botRect.left + botRect.width / 2);
    const dy = rowRect.top + rowRect.height / 2 - (botRect.top + botRect.height / 2);
    botActions.setLook({
      x: Math.max(-1, Math.min(1, dx / (window.innerWidth * 0.4))),
      y: Math.max(-1, Math.min(1, dy / (window.innerHeight * 0.4))),
    });
  }, [botActions]);

  useEffect(() => {
    botActions.setBase('idle');
    return () => {
      botActions.setBase('idle');
      botActions.setLook(null);
    };
  }, [botActions]);

  useEffect(() => {
    if (!result || greeted.current) return;
    let alreadyGreeted = false;
    try {
      alreadyGreeted = window.sessionStorage.getItem('it-inventory-articles-greeting') === '1';
      if (!alreadyGreeted) window.sessionStorage.setItem('it-inventory-articles-greeting', '1');
    } catch {
      // Session storage is optional; the greeting can still be shown once per mount.
    }
    if (alreadyGreeted) {
      greeted.current = true;
      return;
    }
    greeted.current = true;
    const count = stats?.total ?? result.total;
    botActions.say(`${new Intl.NumberFormat('fr-FR').format(count)} références au catalogue. Je t'aide à chercher ?`, {
      priority: 1,
      duration: 4000,
    });
  }, [result, stats, botActions]);

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
    articleService.getPage(siteId, { search, stock: stockFilter, page: pageIndex, pageSize: PAGE_SIZE }, controller.signal)
      .then((page) => {
        setResult(page);
        setResultVersion((version) => version + 1);
        if (pendingSearch.current) {
          pendingSearch.current = false;
          feedbackId.current += 1;
          setSearchFeedback({ id: feedbackId.current, found: page.total > 0 });
          botActions.setBase('idle');
          if (search.toLocaleLowerCase('fr-FR') !== 'invenbot') {
            botActions.play(page.total > 0 ? 'found' : 'confused');
            botActions.say(
              page.total > 0
                ? `${new Intl.NumberFormat('fr-FR').format(page.total)} résultat${page.total > 1 ? 's' : ''} trouvé${page.total > 1 ? 's' : ''} ✓`
                : 'Je n’ai rien trouvé. Essaie une autre recherche ?',
              { priority: 2 },
            );
          }
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(apiMessage(reason));
          botActions.setBase('idle');
          if (pendingSearch.current) {
            pendingSearch.current = false;
            feedbackId.current += 1;
            setSearchFeedback({ id: feedbackId.current, found: false });
            botActions.play('confused');
            botActions.say('La recherche a rencontré un problème. Réessaie dans un instant.', { priority: 2 });
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, search, stockFilter, pageIndex, reload, botActions]);

  const submitSearch = useCallback((value: string) => {
    pendingSearch.current = true;
    setPageIndex(0);
    if (search === value && pageIndex === 0) setReload((current) => current + 1);
    setSearch(value);
    botActions.setBase('searching');
  }, [search, pageIndex, botActions]);

  const updateStockFilter = useCallback((value: StockFilter) => {
    setPageIndex(0);
    setStockFilter(value);
    if (value === 'low') {
      botActions.setBase('warning');
      botActions.play('warning');
      const count = stats?.low;
      botActions.say(
        count === undefined
          ? 'Je filtre les articles sous le seuil, voilà la liste.'
          : `${new Intl.NumberFormat('fr-FR').format(count)} articles sous le seuil, voilà la liste.`,
        { priority: 2 },
      );
    } else {
      botActions.setBase('idle');
      botActions.setLook(null);
    }
  }, [botActions, stats]);

  const dismissToast = useCallback(() => setToast(null), []);
  const clearLook = useCallback(() => botActions.setLook(null), [botActions]);
  const showPhotoPreview = useCallback((name: string, url: string) => {
    setPreviewPhoto({ name, url });
  }, []);

  const copyReference = useCallback(async (reference: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(reference);
      setToast('Référence copiée');
      botActions.play('found');
    } catch {
      setToast('Impossible de copier la référence depuis ce navigateur.');
    }
  }, [botActions]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setQueryReset((value) => value + 1);
    setPageIndex(0);
    setStockFilter('all');
    botActions.setBase('idle');
    botActions.setLook(null);
  }, [botActions]);

  async function exportArticles() {
    if (!siteId || !result || result.total === 0 || exporting) return;
    const controller = new AbortController();
    setExporting(true);
    setExportError(null);
    botActions.setBase('exporting');
    try {
      const articles = await articleService.getAll(siteId, { search, stock: stockFilter }, controller.signal);
      const csv = createArticlesCsv(articles);
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `articles_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      botActions.setBase('idle');
      botActions.play('success');
      botActions.say(`CSV prêt : ${new Intl.NumberFormat('fr-FR').format(articles.length)} articles exportés ✓`, { priority: 2 });
    } catch (reason) {
      setExportError(apiMessage(reason));
      botActions.setBase('idle');
      botActions.play('confused');
      botActions.say('Je n’ai pas pu préparer le CSV. Réessaie dans un instant.', { priority: 2 });
    } finally {
      setExporting(false);
    }
  }

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Aucun site actif n’est associé à cette session. Les articles sont affichés par site." />;
  }

  const pageCount = result ? Math.ceil(result.total / result.pageSize) : 0;
  return (
    <section className="data-page" aria-labelledby="articles-heading">
      <div className="page-heading articles-heading">
        <div>
          <span className="eyebrow">CATALOGUE DU SITE</span>
          <h2 id="articles-heading"><SplitWords lines={['Articles']} /></h2>
          <p>Recherchez et consultez les références du stock actif.</p>
          {stats && (
            <div className="articles-mini-stats" aria-label="Statistiques du catalogue">
              <span><CountUp value={stats.total} /> références</span>
              <i aria-hidden="true">·</i>
              <span><CountUp value={stats.low} /> en stock faible</span>
            </div>
          )}
        </div>
        <div className="articles-heading__bot" ref={headerBotRef}>
          <span className="data-source"><span /> Site actif</span>
          <span className="articles-header-bot"><InvenBotStage size="small" /></span>
        </div>
      </div>

      <section ref={panelRef} className="panel articles-panel data-table-panel">
        <ArticlesToolbar
          appliedSearch={search}
          resetQuery={queryReset}
          stockFilter={stockFilter}
          total={result?.total ?? null}
          lowStockTotal={stats?.low ?? null}
          loading={loading}
          exporting={exporting}
          searchFeedback={searchFeedback}
          onSearch={submitSearch}
          onStockFilter={updateStockFilter}
          onExport={() => void exportArticles()}
        />
        {statsResult.error && <div className="notice notice--warning articles-stats-warning" role="status">Les statistiques du catalogue sont indisponibles : {statsResult.error}</div>}

        {error && <DataError message={error} onRetry={() => setReload((value) => value + 1)} />}
        {exportError && <DataError message={exportError} onRetry={() => void exportArticles()} />}
        {exporting && <div className="scanner-message" role="status">Préparation du CSV pour les {new Intl.NumberFormat('fr-FR').format(result?.total ?? 0)} articles filtrés…</div>}
        {result?.items.some((article) => article.imageUrl === undefined) && (
          <div className="notice notice--warning articles-photo-warning" role="status">
            Les photos ne sont pas encore disponibles : le service des articles doit être mis à jour.
          </div>
        )}
        {loading && (!result || result.items.length === 0) && <ArticlesSkeleton />}
        {result && result.items.length === 0 && !loading && (
          <div className="empty-state articles-empty">
            <InvenBot size="small" state="confused" eventId={1} />
            <strong>{search || stockFilter === 'low' ? 'Pas de piste pour le moment' : 'Aucun article sur ce site'}</strong>
            <span>{search || stockFilter === 'low'
              ? 'Je n’ai rien trouvé avec ces critères. Essaie une autre recherche ou repars de tout le catalogue.'
              : 'Le service ne renvoie aucune référence visible dans ce stock.'}</span>
            {(search || stockFilter === 'low') && (
              <button className="button button--primary articles-empty__clear" type="button" onClick={clearFilters}>
                Effacer la recherche
              </button>
            )}
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <div
              className={`table-scroll articles-table-wrap${loading ? ' is-refreshing' : ''}`}
              ref={tableRef}
              aria-busy={loading}
            >
              <table className="articles-table">
                <caption className="sr-only">Articles du site actif</caption>
                <thead>
                  <tr>
                    <th scope="col">Article</th>
                    <th scope="col">Référence</th>
                    <th scope="col">Famille</th>
                    <th scope="col" className="numeric">Quantité</th>
                    <th scope="col" className="numeric">Seuil</th>
                    <th scope="col">Emplacement</th>
                    <th scope="col">Statut</th>
                  </tr>
                </thead>
                <tbody key={resultVersion}>
                  {result.items.map((article, index) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      index={index}
                      direction={pageDirection}
                      entering
                      onLowStockPointer={handleLowStockPointer}
                      onLowStockLeave={clearLook}
                      onPreview={showPhotoPreview}
                      onCopyReference={copyReference}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <DataPagination pageIndex={pageIndex} pageSize={result.pageSize} pageCount={pageCount} total={result.total} loading={loading}
              onPageChange={(index) => { setPageDirection(index > pageIndex ? 'next' : 'previous'); setPageIndex(index); }} />
          </>
        )}
      </section>
      <DataToast message={toast} onDismiss={dismissToast} />
      <PhotoPreview photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </section>
  );
}

function createArticlesCsv(articles: ArticlePageData['items']): string {
  const columns = ['Référence', 'Nom', 'Code-barres', 'Catégorie', 'Stock actuel', 'Stock minimum', 'Unité', 'Emplacement', 'Statut'];
  const rows = articles.map((article) => [
    article.reference,
    article.name,
    article.barcode ?? '',
    article.family ?? '',
    article.quantity,
    article.minimumStock,
    article.unit,
    article.location ?? '',
    article.quantity < article.minimumStock ? 'Stock faible' : 'Disponible',
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
