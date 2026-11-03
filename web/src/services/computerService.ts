import { apiGet, requireArray, requireNumber, requireRecord, requireString } from './apiClient';
import type { ComputerListItem, ComputerPage, PCState } from '../types/inventory';

const states: PCState[] = ['a_chaud', 'a_reusiner', 'en_usinage', 'disponible', 'en_panne', 'envoye'];

function optionalString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireString(value, field);
}

function parseComputer(value: unknown): ComputerListItem {
  const row = requireRecord(value);
  const state = requireString(row.state, 'state');
  if (!states.includes(state as PCState)) throw new Error('Invalid computer state');
  return {
    id: requireString(row.id, 'id'),
    name: requireString(row.name, 'name'),
    hostname: requireString(row.hostname, 'hostname'),
    reference: requireString(row.reference, 'reference'),
    barcode: optionalString(row.barcode, 'barcode'),
    brand: optionalString(row.brand, 'brand'),
    model: optionalString(row.model, 'model'),
    allocation: requireString(row.allocation, 'allocation'),
    location: optionalString(row.location, 'location'),
    state: state as PCState,
    quantity: requireNumber(row.quantity, 'quantity'),
    updatedAt: requireString(row.updatedAt, 'updatedAt'),
  };
}

function parseComputerPage(value: unknown): ComputerPage {
  const row = requireRecord(value);
  const countsRecord = requireRecord(row.counts);
  const page = requireNumber(row.page, 'page');
  const pageSize = requireNumber(row.pageSize, 'pageSize');
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Invalid pagination');
  }
  return {
    items: requireArray(row.items, 'items').map(parseComputer),
    total: requireNumber(row.total, 'total'),
    page,
    pageSize,
    counts: {
      total: requireNumber(countsRecord.total, 'total'),
      a_chaud: requireNumber(countsRecord.a_chaud, 'a_chaud'),
      a_reusiner: requireNumber(countsRecord.a_reusiner, 'a_reusiner'),
      en_usinage: requireNumber(countsRecord.en_usinage, 'en_usinage'),
      disponible: requireNumber(countsRecord.disponible, 'disponible'),
      en_panne: requireNumber(countsRecord.en_panne, 'en_panne'),
      envoye: requireNumber(countsRecord.envoye, 'envoye'),
    },
  };
}

export const computerService = {
  getPage(
    siteId: string,
    options: { search: string; state: PCState | 'all'; page: number; pageSize: number },
    signal?: AbortSignal,
  ): Promise<ComputerPage> {
    const query = new URLSearchParams({
      siteId,
      search: options.search,
      state: options.state,
      page: String(options.page),
      pageSize: String(options.pageSize),
    });
    return apiGet(`/api/computers?${query}`, parseComputerPage, signal);
  },

  async getAll(
    siteId: string,
    options: { search: string; state: PCState | 'all' },
    signal?: AbortSignal,
  ): Promise<ComputerListItem[]> {
    const pageSize = 100;
    const firstPage = await this.getPage(siteId, { ...options, page: 0, pageSize }, signal);
    const items = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.total / pageSize);
    for (let page = 1; page < pageCount; page += 1) {
      const result = await this.getPage(siteId, { ...options, page, pageSize }, signal);
      const expectedItems = Math.min(pageSize, firstPage.total - page * pageSize);
      if (result.total !== firstPage.total || result.items.length !== expectedItems) {
        throw new Error('Le parc PC a changé pendant l’export. Relancez l’export.');
      }
      items.push(...result.items);
    }
    if (items.length !== firstPage.total) {
      throw new Error('Le parc PC a changé pendant l’export. Relancez l’export.');
    }
    return items;
  },
};
