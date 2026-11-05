import { buildAnalyticsInsights } from '../web/src/components/analytics/insightCalculations';
import type { AnalyticsDay, AnalyticsSummary } from '../web/src/types/inventory';

const day = (date: string, entries: number, exits = 0, adjustments = 0, transfers = 0): AnalyticsDay => ({
  date,
  entries,
  exits,
  adjustments,
  transfers,
});

function summary(overrides: Partial<AnalyticsSummary> = {}): AnalyticsSummary {
  return {
    period: '7days',
    totalMovements: 8,
    inboundQuantity: 18,
    outboundQuantity: 9,
    adjustments: 1,
    transfers: 1,
    trend: [
      day('2025-03-10', 1),
      day('2025-03-11', 1),
      day('2025-03-12', 2, 0, 1, 1),
      day('2025-03-13', 2),
    ],
    topArticles: [],
    partial: false,
    ...overrides,
  };
}

describe('analytics insights', () => {
  it('finds the busiest day and compares daily movement counts between period halves', () => {
    const insights = buildAnalyticsInsights(summary());

    expect(insights.items[0]).toMatchObject({
      id: 'peak-day',
      value: 'mercredi 12 mars 2025',
    });
    expect(insights.items[1]).toMatchObject({
      id: 'recent-pace',
      value: '+200 %',
    });
    expect(insights.items[2]).toMatchObject({
      id: 'other-movements',
      value: '2 / 8',
    });
    expect(insights.analystMessage).toContain('4 jours actifs sur 4');
  });

  it('does not present an activity trend when the received period is partial', () => {
    const insights = buildAnalyticsInsights(summary({ partial: true }));

    expect(insights.items[1]).toMatchObject({
      value: 'Lecture partielle',
      tone: 'caution',
    });
    expect(insights.botState).toBe('warning');
    expect(insights.analystMessage).toContain('je ne compare pas les deux moitiés');
  });

  it('distinguishes a genuinely quiet period from missing daily data', () => {
    const quiet = buildAnalyticsInsights(summary({
      totalMovements: 0,
      trend: [day('2025-03-10', 0), day('2025-03-11', 0)],
    }));
    const missing = buildAnalyticsInsights(summary({ totalMovements: 4, trend: [] }));
    const incomplete = buildAnalyticsInsights(summary({
      totalMovements: 4,
      trend: [day('2025-03-10', 0), day('2025-03-11', 0)],
      partial: true,
    }));

    expect(quiet.items[0].value).toBe('Aucune activité');
    expect(quiet.botState).toBe('searching');
    expect(missing.items[0]).toMatchObject({
      id: 'daily-series',
      value: 'Indisponible',
      tone: 'caution',
    });
    expect(missing.analystMessage).toContain('aucun détail par jour');
    expect(incomplete.items[0].value).toBe('À vérifier');
    expect(incomplete.botState).toBe('warning');
    expect(incomplete.analystMessage).toContain('ne confirme pas une absence');
  });
});
