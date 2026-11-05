import { useId, type CSSProperties } from 'react';
import type { AnalyticsSummary } from '../../types/inventory';
import { MOVEMENT_COLORS } from '../../constants/movementColors';
import { CountUp } from '../dashboard/CountUp';

const numberFormat = new Intl.NumberFormat('fr-FR');
const averageFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const sparkWidth = 92;
const sparkHeight = 30;

export function AnalyticsKpis({ result, loading }: { result: AnalyticsSummary; loading: boolean }) {
  const days = result.trend;
  const averageFor = (value: number) => days.length > 0 ? value / days.length : null;
  const totalDailyMovements = days.map((day) => day.entries + day.exits + day.adjustments + day.transfers);
  const metrics = [
    {
      label: 'Mouvements',
      value: result.totalMovements,
      dailyAverage: averageFor(result.totalMovements),
      color: MOVEMENT_COLORS.ENTRY,
      trend: totalDailyMovements,
      detail: 'tous types',
    },
    {
      label: 'Unités entrées',
      value: result.inboundQuantity,
      dailyAverage: averageFor(result.inboundQuantity),
      color: MOVEMENT_COLORS.ENTRY,
      trend: days.map((day) => day.entries),
      detail: 'opérations d’entrée / jour',
    },
    {
      label: 'Unités sorties',
      value: result.outboundQuantity,
      dailyAverage: averageFor(result.outboundQuantity),
      color: MOVEMENT_COLORS.EXIT,
      trend: days.map((day) => day.exits),
      detail: 'opérations de sortie / jour',
    },
    {
      label: 'Solde net',
      value: result.inboundQuantity - result.outboundQuantity,
      dailyAverage: averageFor(result.inboundQuantity - result.outboundQuantity),
      color: 'var(--color-green)',
      trend: days.map((day) => day.entries - day.exits),
      detail: 'solde en unités · courbe en opérations',
    },
    {
      label: 'Ajustements + transferts',
      value: result.adjustments + result.transfers,
      dailyAverage: averageFor(result.adjustments + result.transfers),
      color: MOVEMENT_COLORS.ADJUSTMENT,
      trend: days.map((day) => day.adjustments + day.transfers),
      detail: `${numberFormat.format(result.adjustments)} ajustement${result.adjustments === 1 ? '' : 's'} · ${numberFormat.format(result.transfers)} transfert${result.transfers === 1 ? '' : 's'}`,
    },
  ];

  return (
    <div className="analytics-kpis" aria-busy={loading}>
      {metrics.map((metric, index) => (
        <article
          className="analytics-metric"
          key={metric.label}
          data-reveal
          style={{ '--reveal-index': index, '--metric-color': metric.color } as CSSProperties}
        >
          <div className="analytics-metric__top">
            <span className="analytics-metric__heading">
              <i className="analytics-metric__dot" aria-hidden="true" />
              <span className="analytics-metric__label">{metric.label}</span>
            </span>
            <KpiSparkline values={metric.trend} />
          </div>
          <strong className="analytics-metric__value">
            <CountUp value={metric.value} duration={850} />
            {(metric.label.startsWith('Unités') || metric.label === 'Solde net') && <span className="analytics-metric__unit">unités</span>}
          </strong>
          <div className="analytics-metric__footer">
            <span className="analytics-metric__detail">{metric.detail}</span>
            <span className="analytics-metric__average">{metric.dailyAverage === null ? '— / jour' : `${averageFormat.format(metric.dailyAverage)} / jour`}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function KpiSparkline({ values }: { values: number[] }) {
  const id = useId().replace(/:/g, '');
  const samples = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const points = samples.map((value, index) => ({
    x: (index / (samples.length - 1)) * sparkWidth,
    y: 3 + (1 - (value - min) / range) * (sparkHeight - 6),
  }));
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const area = `${line} L${sparkWidth},${sparkHeight} L0,${sparkHeight} Z`;

  return (
    <svg className="analytics-metric__sparkline" viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`analytics-spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#analytics-spark-${id})`} />
      <path d={line} className="analytics-metric__sparkline-line" />
    </svg>
  );
}
