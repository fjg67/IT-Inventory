import { useEffect, useId, useRef, useState, type PointerEvent, type KeyboardEvent, type FocusEvent } from 'react';
import type { AnalyticsDay, AnalyticsPeriod } from '../../types/inventory';
import { MOVEMENT_COLORS } from '../../constants/movementColors';
import { CumulativeLine } from './CumulativeLine';
import { ChartTooltip } from './ChartTooltip';
import {
  FLOW_CHART_HEIGHT,
  FLOW_CHART_PLOT,
  FLOW_CHART_VIEW_WIDTH,
  getCumulativeMovementSeries,
  getFlowChartGeometry,
  shouldShowDateLabel,
} from './chartScales';

const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' });
const axisDayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekDayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
const numberFormat = new Intl.NumberFormat('fr-FR');

export function FlowTimelineChart({ days, period }: { days: AnalyticsDay[]; period: AnalyticsPeriod }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const activeIndex = useRef(0);
  const [containerWidth, setContainerWidth] = useState(FLOW_CHART_VIEW_WIDTH);
  const titleId = useId().replace(/:/g, '');
  const tooltipId = `${titleId}-tooltip`;
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;
    const updateWidth = () => setContainerWidth(Math.max(300, container.clientWidth - 32));
    updateWidth();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    activeIndex.current = 0;
    if (tooltipRef.current) tooltipRef.current.hidden = true;
    svgRef.current?.querySelector('[data-active="true"]')?.removeAttribute('data-active');
  }, [days, period]);
  const width = period === '90days'
    ? Math.max(containerWidth, days.length * 18)
    : containerWidth;
  const geometry = getFlowChartGeometry(days, width);
  const cumulative = getCumulativeMovementSeries(days);

  const hideTooltip = () => {
    if (tooltipRef.current) tooltipRef.current.hidden = true;
  };

  const showTooltip = (index: number, clientX?: number, clientY?: number, announce = false) => {
    const day = days[index];
    const tooltip = tooltipRef.current;
    const container = chartRef.current;
    if (!day || !tooltip || !container) return;

    const needsContentUpdate = tooltip.hidden || activeIndex.current !== index;
    activeIndex.current = index;
    if (needsContentUpdate) {
      tooltip.textContent = [
        formatFullDay(day.date),
        `${numberFormat.format(day.entries)} entrée${day.entries === 1 ? '' : 's'} · ${numberFormat.format(day.exits)} sortie${day.exits === 1 ? '' : 's'}`,
        `${numberFormat.format(day.adjustments)} ajustement${day.adjustments === 1 ? '' : 's'} · ${numberFormat.format(day.transfers)} transfert${day.transfers === 1 ? '' : 's'}`,
        `Solde journalier des opérations : ${formatSigned(day.entries - day.exits)}`,
        `Cumul des opérations entrées − sorties : ${numberFormat.format(cumulative[index])}`,
      ].join('\n');
    }
    tooltip.setAttribute('aria-live', announce ? 'polite' : 'off');
    tooltip.hidden = false;
    svgRef.current?.querySelector('[data-active="true"]')?.removeAttribute('data-active');
    svgRef.current?.querySelector(`[data-day-index="${index}"]`)?.setAttribute('data-active', 'true');

    const containerRect = container.getBoundingClientRect();
    const anchorX = clientX === undefined
      ? 16 + (containerRect.width - 32) * ((geometry.points[index]?.x ?? FLOW_CHART_PLOT.left) / geometry.width)
      : clientX - containerRect.left;
    const anchorY = clientY === undefined ? 54 : clientY - containerRect.top;
    const left = Math.max(8, Math.min(anchorX + 12, containerRect.width - tooltip.offsetWidth - 8));
    const top = Math.max(8, anchorY - tooltip.offsetHeight - 10);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const dayGroup = event.target.closest<SVGGElement>('[data-day-index]');
    if (!dayGroup) return;
    const index = Number(dayGroup.dataset.dayIndex);
    if (!Number.isInteger(index)) return;
    showTooltip(index, event.clientX, event.clientY);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (days.length === 0 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (activeIndex.current + direction + days.length) % days.length;
    showTooltip(nextIndex, undefined, undefined, true);
  };

  const handleFocus = (_event: FocusEvent<SVGSVGElement>) => {
    if (days.length > 0) showTooltip(activeIndex.current, undefined, undefined, true);
  };

  const clearActiveDay = () => {
    hideTooltip();
    svgRef.current?.querySelector('[data-active="true"]')?.removeAttribute('data-active');
  };

  const handleBlur = () => clearActiveDay();

  if (days.length === 0) {
    return <div className="empty-state" role="status"><strong>Aucune série journalière disponible</strong><span>Les indicateurs existent, mais aucun détail par jour n’a été fourni pour cette période.</span></div>;
  }

  return (
    <>
      <div className="analytics-legend" aria-label="Légende du graphique">
        <span><i className="analytics-legend__swatch analytics-legend__swatch--entry" />Entrées</span>
        <span><i className="analytics-legend__swatch analytics-legend__swatch--exit" />Sorties</span>
        <span><i className="analytics-legend__swatch analytics-legend__swatch--adjustment" />Ajustements</span>
        <span><i className="analytics-legend__swatch analytics-legend__swatch--transfer" />Transferts</span>
        <span><i className="analytics-legend__line" />Cumul des opérations entrées − sorties</span>
      </div>
      <div
        ref={chartRef}
        className="analytics-chart-scroll"
        data-long-period={period === '90days' || undefined}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          if (document.activeElement !== svgRef.current) clearActiveDay();
        }}
      >
        <svg
          ref={svgRef}
          className="analytics-flow-chart"
          viewBox={`0 0 ${width} ${FLOW_CHART_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ minWidth: period === '90days' ? `${width}px` : undefined }}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={tooltipId}
          aria-keyshortcuts="ArrowLeft ArrowRight"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <title id={titleId}>Flux quotidiens : entrées au-dessus de zéro, sorties en dessous; utilisez les flèches pour parcourir les jours.</title>
          <g className="analytics-flow-chart__grid" aria-hidden="true">
            {[FLOW_CHART_PLOT.top, geometry.baseline, FLOW_CHART_PLOT.bottom].map((y, index) => (
              <g key={y}>
                <line x1={FLOW_CHART_PLOT.left} x2={width - FLOW_CHART_PLOT.right} y1={y} y2={y} className={index === 1 ? 'analytics-flow-chart__zero' : undefined} />
                <text x={FLOW_CHART_PLOT.left - 8} y={y + 3} textAnchor="end">
                  {index === 0 ? numberFormat.format(geometry.maxDailyCount) : index === 1 ? '0' : `−${numberFormat.format(geometry.maxDailyCount)}`}
                </text>
              </g>
            ))}
          </g>
          {geometry.points.map((point, index) => {
            const date = new Date(`${point.day.date}T00:00:00Z`);
            const weekend = !Number.isNaN(date.getTime()) && (date.getUTCDay() === 0 || date.getUTCDay() === 6);
            const showLabel = shouldShowDateLabel(point.day.date, index, days.length, period, today);
            const cellWidth = geometry.plotWidth / days.length;
            const barWidth = Math.min(14, cellWidth * 0.44);
            const tickLabel = Number.isNaN(date.getTime())
              ? ''
              : period === '7days' ? weekDayFormat.format(date) : axisDayFormat.format(date);
            const markerOffset = Math.min(5, cellWidth * 0.16);

            return (
              <g key={point.day.date} data-day-index={index} aria-hidden="true">
                {(weekend || point.day.date === today) && (
                  <rect
                    x={point.x - cellWidth / 2}
                    y={FLOW_CHART_PLOT.top}
                    width={cellWidth}
                    height={geometry.plotHeight}
                    className={point.day.date === today ? 'analytics-flow-chart__today' : 'analytics-flow-chart__weekend'}
                  />
                )}
                <rect
                  x={point.x - cellWidth / 2}
                  y={FLOW_CHART_PLOT.top}
                  width={cellWidth}
                  height={geometry.plotHeight}
                  className="analytics-flow-chart__selection"
                />
                {point.day.entries > 0 && (
                  <rect
                    x={point.x - barWidth / 2}
                    y={geometry.baseline - point.entryHeight}
                    width={barWidth}
                    height={point.entryHeight}
                    rx="3"
                    fill={MOVEMENT_COLORS.ENTRY}
                    className="analytics-flow-chart__bar analytics-flow-chart__bar--entry"
                  />
                )}
                {point.day.exits > 0 && (
                  <rect
                    x={point.x - barWidth / 2}
                    y={geometry.baseline}
                    width={barWidth}
                    height={point.exitHeight}
                    rx="3"
                    fill={MOVEMENT_COLORS.EXIT}
                    className="analytics-flow-chart__bar analytics-flow-chart__bar--exit"
                  />
                )}
                {point.adjustmentRadius > 0 && (
                  <circle
                    cx={point.x - markerOffset}
                    cy={geometry.baseline}
                    r={point.adjustmentRadius}
                    fill={MOVEMENT_COLORS.ADJUSTMENT}
                    className="analytics-flow-chart__marker"
                  />
                )}
                {point.transferRadius > 0 && (
                  <rect
                    x={point.x + markerOffset - point.transferRadius / 1.4}
                    y={geometry.baseline - point.transferRadius / 1.4}
                    width={point.transferRadius * 1.4}
                    height={point.transferRadius * 1.4}
                    fill={MOVEMENT_COLORS.TRANSFER}
                    className="analytics-flow-chart__marker"
                    transform={`rotate(45 ${point.x + markerOffset} ${geometry.baseline})`}
                  />
                )}
                {showLabel && (
                  <text
                    x={point.x}
                    y={FLOW_CHART_HEIGHT - 14}
                    textAnchor="middle"
                    className={`analytics-flow-chart__date${point.day.date === today ? ' analytics-flow-chart__date--today' : ''}`}
                  >
                    {Number.isNaN(date.getTime()) ? '' : tickLabel}
                  </text>
                )}
              </g>
            );
          })}
          <CumulativeLine
            days={days}
            width={width}
            xPositions={geometry.points.map((point) => point.x)}
          />
        </svg>
        <ChartTooltip id={tooltipId} tooltipRef={tooltipRef} />
      </div>
      <table className="sr-only analytics-chart-table">
        <caption>Tendance quotidienne; le cumul représente le nombre d’opérations d’entrée moins les opérations de sortie, pas un stock physique.</caption>
        <thead><tr><th>Date</th><th>Entrées</th><th>Sorties</th><th>Ajustements</th><th>Transferts</th><th>Cumul entrées-sorties</th></tr></thead>
        <tbody>
          {days.map((day, index) => (
            <tr key={day.date}>
              <th scope="row">{formatFullDay(day.date)}</th>
              <td>{day.entries}</td>
              <td>{day.exits}</td>
              <td>{day.adjustments}</td>
              <td>{day.transfers}</td>
              <td>{cumulative[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function formatFullDay(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dayFormat.format(date);
}

function formatSigned(value: number): string {
  if (value > 0) return `+${numberFormat.format(value)}`;
  return numberFormat.format(value);
}
