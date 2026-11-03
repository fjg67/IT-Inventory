import { apiGet, requireArray, requireNumber, requireRecord, requireString } from './apiClient';
import type { StockMapData, StockMapItem } from '../types/inventory';

function parseStockMapItem(value: unknown): StockMapItem {
  const row = requireRecord(value);
  return {
    reference: requireString(row.reference, 'reference'),
    quantity: requireNumber(row.quantity, 'quantity'),
  };
}

function parseStockMap(value: unknown): StockMapData {
  const row = requireRecord(value);
  return { items: requireArray(row.items, 'items').map(parseStockMapItem) };
}

export const stockMapService = {
  getStock(siteId: string, signal?: AbortSignal): Promise<StockMapData> {
    const query = new URLSearchParams({ siteId });
    return apiGet(`/api/stock-map?${query}`, parseStockMap, signal);
  },
};
