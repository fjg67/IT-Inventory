import type { AnalyticsDay } from '../../types/inventory';
import { createSmoothLinePath, FLOW_CHART_PLOT, getCumulativeDomain, getCumulativeMovementSeries } from './chartScales';

const numberFormat = new Intl.NumberFormat('fr-FR');

export function CumulativeLine({
  days,
  width,
  xPositions,
}: {
  days: AnalyticsDay[];
  width: number;
  xPositions: number[];
}) {
  const values = getCumulativeMovementSeries(days);
  if (values.length === 0) return null;

  const domain = getCumulativeDomain(values);
  const points = values.map((value, index) => ({
    x: xPositions[index],
    y: FLOW_CHART_PLOT.bottom - ((value - domain.min) / (domain.max - domain.min)) * (FLOW_CHART_PLOT.bottom - FLOW_CHART_PLOT.top),
  }));
  const path = createSmoothLinePath(points);
  const rightAxisX = width - FLOW_CHART_PLOT.right;

  return (
    <g className="analytics-cumulative-line" aria-hidden="true" pointerEvents="none">
      <line
        x1={rightAxisX}
        x2={rightAxisX}
        y1={FLOW_CHART_PLOT.top}
        y2={FLOW_CHART_PLOT.bottom}
        className="analytics-cumulative-line__axis"
      />
      <text x={rightAxisX + 5} y={FLOW_CHART_PLOT.top + 4} className="analytics-cumulative-line__tick">
        {numberFormat.format(domain.max)}
      </text>
      <text x={rightAxisX + 5} y={FLOW_CHART_PLOT.bottom} className="analytics-cumulative-line__tick">
        {numberFormat.format(domain.min)}
      </text>
      <path d={path} pathLength="1" className="analytics-cumulative-line__path" />
      {points.length > 1 && (
        <>
          <circle cx={points[0].x} cy={points[0].y} r="3" className="analytics-cumulative-line__point" />
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" className="analytics-cumulative-line__point" />
        </>
      )}
    </g>
  );
}
