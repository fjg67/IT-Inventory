import { apiGet, requireArray, requireNumber, requireRecord, requireString } from './apiClient';
import type { DashboardSummary, RecentMovement } from '../types/inventory';

function parseMovement(value: unknown): RecentMovement {
  const row = requireRecord(value);
  return {
    id: requireString(row.id, 'id'),
    type: requireString(row.type, 'type'),
    articleName: requireString(row.articleName, 'articleName'),
    quantity: requireNumber(row.quantity, 'quantity'),
    siteName: requireString(row.siteName, 'siteName'),
    userName: requireString(row.userName, 'userName'),
    occurredAt: requireString(row.occurredAt, 'occurredAt'),
  };
}

function parseDashboard(value: unknown): DashboardSummary {
  const row = requireRecord(value);
  return {
    totalArticles: requireNumber(row.totalArticles, 'totalArticles'),
    lowStockArticles: requireNumber(row.lowStockArticles, 'lowStockArticles'),
    movementsToday: requireNumber(row.movementsToday, 'movementsToday'),
    recentMovements: requireArray(row.recentMovements, 'recentMovements').map(parseMovement),
  };
}

export const dashboardService = {
  getSummary(siteId: string, signal?: AbortSignal): Promise<DashboardSummary> {
    const query = new URLSearchParams({ siteId });
    return apiGet(`/api/dashboard?${query}`, parseDashboard, signal);
  },
};
