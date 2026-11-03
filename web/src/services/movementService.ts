import { apiGet, apiRequest, requireArray, requireNumber, requireRecord, requireString } from './apiClient';
import type { MovementListItem, MovementPage } from '../types/inventory';

export type StockMovementInput = {
  articleId: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reason: string;
  destinationSiteId?: string;
};

export type StockMovementResult = {
  movementIds: string[];
  quantity: number;
};

function optionalString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireString(value, field);
}

function parseMovement(value: unknown): MovementListItem {
  const row = requireRecord(value);
  return {
    id: requireString(row.id, 'id'),
    type: requireString(row.type, 'type'),
    quantity: requireNumber(row.quantity, 'quantity'),
    reason: optionalString(row.reason, 'reason'),
    articleName: requireString(row.articleName, 'articleName'),
    articleReference: requireString(row.articleReference, 'articleReference'),
    userName: requireString(row.userName, 'userName'),
    fromSiteName: optionalString(row.fromSiteName, 'fromSiteName'),
    toSiteName: optionalString(row.toSiteName, 'toSiteName'),
    occurredAt: requireString(row.occurredAt, 'occurredAt'),
  };
}

function parseMovementPage(value: unknown): MovementPage {
  const row = requireRecord(value);
  const page = requireNumber(row.page, 'page');
  const pageSize = requireNumber(row.pageSize, 'pageSize');
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Invalid pagination');
  }
  return {
    items: requireArray(row.items, 'items').map(parseMovement),
    total: requireNumber(row.total, 'total'),
    page,
    pageSize,
  };
}

export const movementService = {
  create(input: StockMovementInput): Promise<StockMovementResult> {
    return apiRequest('/api/movements', { method: 'POST', body: input }, (value) => {
      const row = requireRecord(value);
      return {
        movementIds: requireArray(row.movementIds, 'movementIds').map((id) => requireString(id, 'movementId')),
        quantity: requireNumber(row.quantity, 'quantity'),
      };
    });
  },

  getPage(
    siteId: string,
    options: { period: '7days' | '30days' | 'all'; type: string; page: number; pageSize: number },
    signal?: AbortSignal,
  ): Promise<MovementPage> {
    const query = new URLSearchParams({
      siteId,
      period: options.period,
      type: options.type,
      page: String(options.page),
      pageSize: String(options.pageSize),
    });
    return apiGet(`/api/movements?${query}`, parseMovementPage, signal);
  },

  async getAll(
    siteId: string,
    options: { period: '7days' | '30days' | 'all'; type: string },
    signal?: AbortSignal,
  ): Promise<MovementListItem[]> {
    const pageSize = 100;
    const firstPage = await this.getPage(siteId, { ...options, page: 0, pageSize }, signal);
    const items = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.total / pageSize);
    for (let page = 1; page < pageCount; page += 1) {
      const result = await this.getPage(siteId, { ...options, page, pageSize }, signal);
      const expectedItems = Math.min(pageSize, firstPage.total - page * pageSize);
      if (result.total !== firstPage.total || result.items.length !== expectedItems) {
        throw new Error('Le journal a changé pendant l’export. Relancez l’export.');
      }
      items.push(...result.items);
    }
    if (items.length !== firstPage.total) {
      throw new Error('Le journal a changé pendant l’export. Relancez l’export.');
    }
    return items;
  },
};
