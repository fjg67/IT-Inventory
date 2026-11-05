import {
  createSmoothLinePath,
  getCumulativeDomain,
  getCumulativeMovementSeries,
  getFlowChartGeometry,
  shouldShowDateLabel,
} from '../web/src/components/analytics/chartScales';
import type { AnalyticsDay } from '../web/src/types/inventory';

const day = (date: string, entries: number, exits: number, adjustments = 0, transfers = 0): AnalyticsDay => ({
  date,
  entries,
  exits,
  adjustments,
  transfers,
});

describe('analytics chart scales', () => {
  it('scales entries above zero and exits below zero while keeping adjustment markers separate', () => {
    const geometry = getFlowChartGeometry([
      day('2025-03-10', 4, 2, 1, 0),
      day('2025-03-11', 0, 0, 0, 3),
    ], 500);

    expect(geometry.points[0]).toMatchObject({
      entryHeight: 100,
      exitHeight: 50,
    });
    expect(geometry.points[0].adjustmentRadius).toBeGreaterThan(0);
    expect(geometry.points[0].transferRadius).toBe(0);
    expect(geometry.points[1].transferRadius).toBeGreaterThan(0);
  });

  it('builds a cumulative daily operation balance without treating it as stock quantity', () => {
    const values = getCumulativeMovementSeries([
      day('2025-03-10', 3, 0),
      day('2025-03-11', 1, 4),
      day('2025-03-12', 0, 2),
    ]);

    expect(values).toEqual([3, 0, -2]);
    expect(getCumulativeDomain(values)).toEqual({ min: -2, max: 3 });
  });

  it('uses a stable domain and smooth path for empty or flat data', () => {
    expect(getCumulativeDomain([0, 0])).toEqual({ min: -1, max: 1 });
    expect(createSmoothLinePath([{ x: 12, y: 8 }])).toBe('M12,8');
    expect(createSmoothLinePath([{ x: 0, y: 2 }, { x: 10, y: 8 }])).toBe('M0,2 C5,2 5,8 10,8');
  });

  it('spaces date labels by period and always keeps the first and last day', () => {
    expect(shouldShowDateLabel('2025-03-10', 0, 30, '30days', '')).toBe(true);
    expect(shouldShowDateLabel('2025-03-12', 2, 30, '30days', '')).toBe(false);
    expect(shouldShowDateLabel('2025-03-10', 2, 90, '90days', '')).toBe(true);
    expect(shouldShowDateLabel('2025-03-11', 89, 90, '90days', '')).toBe(true);
    expect(shouldShowDateLabel('2025-03-10', 88, 90, '90days', '2025-03-11')).toBe(false);
  });
});
