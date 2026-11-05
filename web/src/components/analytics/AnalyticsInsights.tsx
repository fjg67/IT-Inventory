import type { CSSProperties } from 'react';
import { InvenBot } from '../InvenBot';
import type { AnalyticsSummary } from '../../types/inventory';
import type { AnalyticsInsights as AnalyticsInsightsData } from './insightCalculations';

export function AnalyticsAnalyst({
  result,
  insights,
}: {
  result: AnalyticsSummary;
  insights: AnalyticsInsightsData;
}) {
  return (
    <section
      className="analytics-analyst"
      aria-labelledby="analytics-analyst-heading"
      data-reveal
      style={{ '--reveal-index': 6 } as CSSProperties}
    >
      <div className="analytics-analyst__bot"><InvenBot size="small" state={insights.botState} /></div>
      <div className="analytics-analyst__content">
        <div className="analytics-analyst__eyebrow">
          <span className="eyebrow">INVENBOT · ANALYSTE</span>
          <span className="analytics-analyst__badge">Lecture automatique</span>
        </div>
        <h3 id="analytics-analyst-heading">Mon regard sur la période</h3>
        <p>{insights.analystMessage}</p>
        <small>
          Basé sur {insights.dayCount} jours de données{result.partial ? ' partielles' : ''}. Analyse locale des lignes de mouvement, sans appel à un service d’IA.
        </small>
      </div>
    </section>
  );
}

export function AnalyticsInsightsPanel({ insights }: { insights: AnalyticsInsightsData }) {
  return (
    <section
      className="panel analytics-insights"
      aria-labelledby="analytics-insights-heading"
      data-reveal
      style={{ '--reveal-index': 7 } as CSSProperties}
    >
      <div className="panel__heading">
        <div>
          <span className="eyebrow">LECTURE DES TENDANCES</span>
          <h3 id="analytics-insights-heading">À retenir sur la période</h3>
        </div>
        <span className="panel__meta">{insights.dayCount} jours analysés</span>
      </div>
      <div className="analytics-insight-grid">
        {insights.items.map((insight, index) => (
          <article
            className={`analytics-insight analytics-insight--${insight.tone}`}
            key={insight.id}
            data-reveal
            style={{ '--reveal-index': index + 8 } as CSSProperties}
          >
            <span className="analytics-insight__mark" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div className="analytics-insight__content">
              <span className="analytics-insight__title">{insight.title}</span>
              <strong>{insight.value}</strong>
              <p>{insight.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="analytics-insights__note">Les comparaisons portent sur le nombre de lignes quotidiennes, pas sur les quantités d’articles.</p>
    </section>
  );
}
