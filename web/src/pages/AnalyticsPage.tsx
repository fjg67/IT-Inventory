import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { AnalyticsPeriod, AnalyticsSummary } from '../types/inventory';
import { analyticsService } from '../services/analyticsService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';
import { useRevealGroup } from '../components/dashboard/useInView';
import { AnalyticsKpis } from '../components/analytics/AnalyticsKpis';
import { FlowTimelineChart } from '../components/analytics/FlowTimelineChart';
import { AnalyticsAnalyst, AnalyticsInsightsPanel } from '../components/analytics/AnalyticsInsights';
import { buildAnalyticsInsights } from '../components/analytics/insightCalculations';

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: '90days', label: '90 derniers jours' },
];

export function AnalyticsPage({ siteId }: { siteId?: string }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30days');
  const [result, setResult] = useState<AnalyticsSummary | null>(null);
  const [resultFor, setResultFor] = useState<{ siteId: string; period: AnalyticsPeriod } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const revealRef = useRevealGroup<HTMLElement>([period, resultFor]);

  useEffect(() => {
    if (!siteId) {
      setResult(null);
      setResultFor(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    analyticsService.getSummary(siteId, period, controller.signal)
      .then((summary) => {
        setResult(summary);
        setResultFor({ siteId, period });
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, period, reload]);
  const displayedResult = resultFor && resultFor.siteId === siteId && resultFor.period === period ? result : null;
  const insights = useMemo(() => displayedResult ? buildAnalyticsInsights(displayedResult) : null, [displayedResult]);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Les indicateurs et tendances sont calculés à partir des mouvements du site actif et de ses sous-sites." />;
  }

  const maxArticleMovements = Math.max(1, ...(displayedResult?.topArticles.map((article) => article.movements) ?? []));

  return (
    <section ref={revealRef} className="data-page analytics-page" aria-labelledby="analytics-heading">
      <div className="page-heading analytics-heading">
        <div>
          <span className="eyebrow">TENDANCES DU STOCK</span>
          <h2 id="analytics-heading">Analyse avancée</h2>
          <p>Volume d’activité et articles les plus mouvementés du site actif.</p>
        </div>
        <label className="movement-filter analytics-period">
          <span>Période d’analyse</span>
          <select value={period} onChange={(event) => setPeriod(event.currentTarget.value as AnalyticsPeriod)} disabled={loading}>
            {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {error && <DataError message={error} onRetry={() => setReload((value) => value + 1)} />}
      {loading && !displayedResult && <div className="loading-card loading-card--table" aria-live="polite"><span className="spinner spinner--green" aria-hidden="true" />Calcul des indicateurs réels…</div>}

      {displayedResult && (
        <>
          {displayedResult.partial && (
            <div className="notice notice--warning analytics-warning" role="status">
              Les mouvements les plus anciens de cette période sont omis car le volume dépasse la limite de calcul. Les indicateurs affichent les {new Intl.NumberFormat('fr-FR').format(displayedResult.totalMovements)} mouvements les plus récents.
            </div>
          )}
          <AnalyticsKpis result={displayedResult} loading={loading} />

          <section className="panel analytics-panel" aria-labelledby="activity-chart-heading" data-reveal style={{ '--reveal-index': 5 } as CSSProperties}>
            <div className="panel__heading">
              <div>
                <span className="eyebrow">FLUX QUOTIDIENS</span>
                <h3 id="activity-chart-heading">Entrées et sorties</h3>
                <p>Les entrées montent au-dessus de zéro; les sorties descendent en dessous.</p>
              </div>
            </div>
            {displayedResult.totalMovements === 0
              ? <div className="empty-state"><strong>Aucun mouvement sur cette période</strong><span>Les tendances apparaîtront ici lorsque le site aura des mouvements enregistrés.</span></div>
              : <FlowTimelineChart days={displayedResult.trend} period={period} />}
          </section>

          {insights && (
            <>
              <AnalyticsAnalyst result={displayedResult} insights={insights} />
              <AnalyticsInsightsPanel insights={insights} />
            </>
          )}

          <section className="panel analytics-panel" aria-labelledby="top-articles-heading" data-reveal style={{ '--reveal-index': 8 } as CSSProperties}>
            <div className="panel__heading">
              <div><span className="eyebrow">ARTICLES LES PLUS ACTIFS</span><h3 id="top-articles-heading">Top des mouvements</h3></div>
              <span className="panel__meta">{displayedResult.topArticles.length} référence{displayedResult.topArticles.length === 1 ? '' : 's'}</span>
            </div>
            {displayedResult.topArticles.length === 0 ? (
              <div className="empty-state"><strong>Aucun article mouvementé</strong><span>Aucun mouvement rattaché à un article n’a été trouvé sur la période.</span></div>
            ) : (
              <div className="analytics-top-list">
                {displayedResult.topArticles.map((article, index) => (
                  <article className="analytics-top-row" key={article.id}>
                    <span className="analytics-top-row__rank">{String(index + 1).padStart(2, '0')}</span>
                    <div className="analytics-top-row__details">
                      <div><strong>{article.name}</strong><span>{article.reference || 'Sans référence'} · {new Intl.NumberFormat('fr-FR').format(article.quantity)} unités cumulées</span></div>
                      <div className="analytics-top-row__track" aria-label={`${article.movements} mouvements`}>
                        <span style={{ width: `${(article.movements / maxArticleMovements) * 100}%` }} />
                      </div>
                    </div>
                    <div className="analytics-top-row__value"><strong>{article.movements}</strong><span>mouvements</span></div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
