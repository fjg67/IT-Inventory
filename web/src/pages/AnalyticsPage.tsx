import { useEffect, useState } from 'react';
import type { AnalyticsPeriod, AnalyticsSummary } from '../types/inventory';
import { analyticsService } from '../services/analyticsService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: '90days', label: '90 derniers jours' },
];

const series = [
  { key: 'entries', label: 'Entrées', color: 'green' },
  { key: 'exits', label: 'Sorties', color: 'rose' },
  { key: 'adjustments', label: 'Ajustements', color: 'amber' },
  { key: 'transfers', label: 'Transferts', color: 'blue' },
] as const;

export function AnalyticsPage({ siteId }: { siteId?: string }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30days');
  const [result, setResult] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);

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
    analyticsService.getSummary(siteId, period, controller.signal)
      .then(setResult)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, period, reload]);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Les indicateurs et tendances sont calculés à partir des mouvements du site actif et de ses sous-sites." />;
  }

  const maxDay = Math.max(1, ...(result?.trend.map((day) => day.entries + day.exits + day.adjustments + day.transfers) ?? []));
  const maxArticleMovements = Math.max(1, ...(result?.topArticles.map((article) => article.movements) ?? []));

  return (
    <section className="data-page" aria-labelledby="analytics-heading">
      <div className="page-heading">
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
      {loading && !result && <div className="loading-card loading-card--table" aria-live="polite"><span className="spinner spinner--green" aria-hidden="true" />Calcul des indicateurs réels…</div>}

      {result && (
        <>
          {result.partial && (
            <div className="notice notice--warning analytics-warning" role="status">
              Les mouvements les plus anciens de cette période sont omis car le volume dépasse la limite de calcul. Les indicateurs affichent les {new Intl.NumberFormat('fr-FR').format(result.totalMovements)} mouvements les plus récents.
            </div>
          )}
          <div className="analytics-kpis" aria-busy={loading}>
            <Metric label="Mouvements" value={result.totalMovements} tone="green" />
            <Metric label="Unités entrées" value={result.inboundQuantity} tone="blue" />
            <Metric label="Unités sorties" value={result.outboundQuantity} tone="rose" />
            <Metric label="Ajustements" value={result.adjustments} tone="amber" />
          </div>

          <section className="panel analytics-panel" aria-labelledby="activity-chart-heading">
            <div className="panel__heading">
              <div><span className="eyebrow">ACTIVITÉ QUOTIDIENNE</span><h3 id="activity-chart-heading">Mouvements par jour</h3></div>
              <span className="panel__meta">{result.transfers} transfert{result.transfers === 1 ? '' : 's'}</span>
            </div>
            {result.totalMovements === 0 ? (
              <div className="empty-state"><strong>Aucun mouvement sur cette période</strong><span>Les tendances apparaîtront ici lorsque le site aura des mouvements enregistrés.</span></div>
            ) : (
              <>
                <div className="analytics-legend" aria-label="Légende du graphique">
                  {series.map((item) => <span key={item.key}><i className={`analytics-legend__dot analytics-legend__dot--${item.color}`} />{item.label}</span>)}
                </div>
                <div className="analytics-chart-scroll" role="img" aria-label={`Graphique des mouvements par jour pour les ${period === '7days' ? '7' : period === '30days' ? '30' : '90'} derniers jours. La hauteur totale indique le nombre de mouvements. Chaque barre est détaillée dans son infobulle.`}>
                  <div className="analytics-chart" style={{ minWidth: `${Math.max(640, result.trend.length * 22)}px` }}>
                    {result.trend.map((day) => {
                      const total = day.entries + day.exits + day.adjustments + day.transfers;
                      return (
                        <div className="analytics-chart__day" key={day.date} title={`${formatDay(day.date)} : ${day.entries} entrées, ${day.exits} sorties, ${day.adjustments} ajustements, ${day.transfers} transferts`}>
                          <div className="analytics-chart__bar" aria-hidden="true">
                            {series.map((item) => {
                              const count = day[item.key];
                              return count > 0 ? (
                                <span
                                  className={`analytics-chart__segment analytics-chart__segment--${item.color}`}
                                  key={item.key}
                                  style={{ height: `${(count / maxDay) * 120}px` }}
                                />
                              ) : null;
                            })}
                          </div>
                          <span className="analytics-chart__date">{formatChartDay(day.date, period)}</span>
                          <span className="sr-only">{formatDay(day.date)} : {total} mouvements</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="panel analytics-panel" aria-labelledby="top-articles-heading">
            <div className="panel__heading">
              <div><span className="eyebrow">ARTICLES LES PLUS ACTIFS</span><h3 id="top-articles-heading">Top des mouvements</h3></div>
              <span className="panel__meta">{result.topArticles.length} référence{result.topArticles.length === 1 ? '' : 's'}</span>
            </div>
            {result.topArticles.length === 0 ? (
              <div className="empty-state"><strong>Aucun article mouvementé</strong><span>Aucun mouvement rattaché à un article n’a été trouvé sur la période.</span></div>
            ) : (
              <div className="analytics-top-list">
                {result.topArticles.map((article, index) => (
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

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article className="analytics-metric">
      <span className={`analytics-metric__dot analytics-metric__dot--${tone}`} />
      <span className="analytics-metric__label">{label}</span>
      <strong>{new Intl.NumberFormat('fr-FR').format(value)}</strong>
    </article>
  );
}

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' }).format(date);
}

function formatChartDay(value: string, period: AnalyticsPeriod): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  if (period === '7days') return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' }).format(date);
  if (period === '90days' && date.getUTCDay() !== 1) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}
