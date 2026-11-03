import {
  apiGet, requireArray, requireNumber, requireRecord, requireString,
} from './apiClient';
import type { AnalyticsDay, AnalyticsPeriod, AnalyticsSummary, AnalyticsTopArticle } from '../types/inventory';

const periods: AnalyticsPeriod[] = ['7days', '30days', '90days'];

function parseDay(value: unknown): AnalyticsDay {
  const row = requireRecord(value);
  return {
    date: requireString(row.date, 'date'),
    entries: requireNumber(row.entries, 'entries'),
    exits: requireNumber(row.exits, 'exits'),
    adjustments: requireNumber(row.adjustments, 'adjustments'),
    transfers: requireNumber(row.transfers, 'transfers'),
  };
}

function parseTopArticle(value: unknown): AnalyticsTopArticle {
  const row = requireRecord(value);
  return {
    id: requireString(row.id, 'id'),
    name: requireString(row.name, 'name'),
    reference: requireString(row.reference, 'reference'),
    movements: requireNumber(row.movements, 'movements'),
    quantity: requireNumber(row.quantity, 'quantity'),
  };
}

function parseAnalytics(value: unknown): AnalyticsSummary {
  const row = requireRecord(value);
  const period = requireString(row.period, 'period');
  if (!periods.includes(period as AnalyticsPeriod)) throw new Error('Invalid analytics period');
  if (typeof row.partial !== 'boolean') throw new Error('Invalid partial flag');
  return {
    period: period as AnalyticsPeriod,
    totalMovements: requireNumber(row.totalMovements, 'totalMovements'),
    inboundQuantity: requireNumber(row.inboundQuantity, 'inboundQuantity'),
    outboundQuantity: requireNumber(row.outboundQuantity, 'outboundQuantity'),
    adjustments: requireNumber(row.adjustments, 'adjustments'),
    transfers: requireNumber(row.transfers, 'transfers'),
    trend: requireArray(row.trend, 'trend').map(parseDay),
    topArticles: requireArray(row.topArticles, 'topArticles').map(parseTopArticle),
    partial: row.partial,
  };
}

export const analyticsService = {
  getSummary(siteId: string, period: AnalyticsPeriod, signal?: AbortSignal): Promise<AnalyticsSummary> {
    const query = new URLSearchParams({ siteId, period });
    return apiGet(`/api/analytics?${query}`, parseAnalytics, signal);
  },
};
