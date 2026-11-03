import { apiGet, requireArray, requireNumber, requireRecord, requireString } from './apiClient';
import type { ArticleListItem, ArticlePage } from '../types/inventory';

function optionalString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireString(value, field);
}

function parseArticle(value: unknown): ArticleListItem {
  const row = requireRecord(value);
  return {
    id: requireString(row.id, 'id'),
    reference: requireString(row.reference, 'reference'),
    name: requireString(row.name, 'name'),
    family: optionalString(row.family, 'family'),
    quantity: requireNumber(row.quantity, 'quantity'),
    minimumStock: requireNumber(row.minimumStock, 'minimumStock'),
    unit: requireString(row.unit, 'unit'),
    location: optionalString(row.location, 'location'),
    barcode: optionalString(row.barcode, 'barcode'),
    imageUrl: row.imageUrl === undefined ? undefined : optionalString(row.imageUrl, 'imageUrl'),
  };
}

function parseArticlePage(value: unknown): ArticlePage {
  const row = requireRecord(value);
  const page = requireNumber(row.page, 'page');
  const pageSize = requireNumber(row.pageSize, 'pageSize');
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Invalid pagination');
  }
  return {
    items: requireArray(row.items, 'items').map(parseArticle),
    total: requireNumber(row.total, 'total'),
    page,
    pageSize,
  };
}

export const articleService = {
  getPage(
    siteId: string,
    options: { search: string; stock: 'all' | 'low'; page: number; pageSize: number; scope?: 'network' | 'movement' },
    signal?: AbortSignal,
  ): Promise<ArticlePage> {
    const query = new URLSearchParams({
      siteId,
      search: options.search,
      stock: options.stock,
      scope: options.scope ?? 'network',
      page: String(options.page),
      pageSize: String(options.pageSize),
    });
    return apiGet(`/api/articles?${query}`, parseArticlePage, signal);
  },

  async getAll(
    siteId: string,
    options: { search: string; stock: 'all' | 'low'; scope?: 'network' | 'movement' },
    signal?: AbortSignal,
  ): Promise<ArticleListItem[]> {
    const pageSize = 100;
    const firstPage = await this.getPage(siteId, { ...options, page: 0, pageSize }, signal);
    const items = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.total / pageSize);
    for (let page = 1; page < pageCount; page += 1) {
      const result = await this.getPage(siteId, { ...options, page, pageSize }, signal);
      if (result.items.length === 0) {
        throw new Error('Le catalogue a changé pendant l’export. Relancez l’export.');
      }
      items.push(...result.items);
    }
    if (items.length !== firstPage.total) {
      throw new Error('Le catalogue a changé pendant l’export. Relancez l’export.');
    }
    return items;
  },
};
