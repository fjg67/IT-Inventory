import type { AnalyticsDay } from '../../types/inventory';

export const FLOW_CHART_HEIGHT = 280;
export const FLOW_CHART_VIEW_WIDTH = 960;
export const FLOW_CHART_PLOT = {
  left: 48,
  right: 42,
  top: 28,
  bottom: 228,
} as const;

export interface FlowChartPoint {
  day: AnalyticsDay;
  x: number;
  entryHeight: number;
  exitHeight: number;
  adjustmentRadius: number;
  transferRadius: number;
}

export interface FlowChartGeometry {
  width: number;
  height: number;
  baseline: number;
  plotWidth: number;
  plotHeight: number;
  maxDailyCount: number;
  points: FlowChartPoint[];
}

export function getFlowChartGeometry(days: AnalyticsDay[], width = FLOW_CHART_VIEW_WIDTH): FlowChartGeometry {
  const baseline = (FLOW_CHART_PLOT.top + FLOW_CHART_PLOT.bottom) / 2;
  const plotWidth = width - FLOW_CHART_PLOT.left - FLOW_CHART_PLOT.right;
  const plotHeight = FLOW_CHART_PLOT.bottom - FLOW_CHART_PLOT.top;
  const maxDailyCount = Math.max(1, ...days.flatMap((day) => [day.entries, day.exits]));
  const valueScale = (plotHeight / 2) / maxDailyCount;
  const cellWidth = plotWidth / Math.max(1, days.length);

  return {
    width,
    height: FLOW_CHART_HEIGHT,
    baseline,
    plotWidth,
    plotHeight,
    maxDailyCount,
    points: days.map((day, index) => ({
      day,
      x: FLOW_CHART_PLOT.left + cellWidth * (index + 0.5),
      entryHeight: day.entries * valueScale,
      exitHeight: day.exits * valueScale,
      adjustmentRadius: markerRadius(day.adjustments),
      transferRadius: markerRadius(day.transfers),
    })),
  };
}

export function getCumulativeMovementSeries(days: AnalyticsDay[]): number[] {
  let cumulative = 0;
  return days.map((day) => {
    cumulative += day.entries - day.exits;
    return cumulative;
  });
}

export function getCumulativeDomain(values: number[]): { min: number; max: number } {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  if (min === max) return { min: -1, max: 1 };
  return { min, max };
}

export function createSmoothLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  let path = `M${points[0].x},${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midpoint = (previous.x + current.x) / 2;
    path += ` C${midpoint},${previous.y} ${midpoint},${current.y} ${current.x},${current.y}`;
  }
  return path;
}

export function shouldShowDateLabel(date: string, index: number, count: number, period: '7days' | '30days' | '90days', today: string): boolean {
  if (index === 0 || index === count - 1 || date === today) return true;
  if (period === '7days') return true;
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return false;
  if (period === '90days') return day.getUTCDay() === 1 && count - 1 - index >= 3;
  return index % 5 === 0;
}

function markerRadius(count: number): number {
  return count > 0 ? Math.min(4.5, 2.5 + Math.log2(count)) : 0;
}
