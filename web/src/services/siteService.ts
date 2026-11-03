import type { AvailableSite } from '../types/auth';
import { apiGet, requireArray, requireRecord, requireString } from './apiClient';

function parseSites(value: unknown): AvailableSite[] {
  const record = requireRecord(value);
  return requireArray(record.items, 'sites').map((item) => {
    const site = requireRecord(item);
    const parentSiteId = site.parentSiteId === null
      ? null
      : requireString(site.parentSiteId, 'parentSiteId');
    return {
      id: requireString(site.id, 'id'),
      name: requireString(site.name, 'name'),
      parentSiteId,
    };
  });
}

export const siteService = {
  getAvailableSites(signal?: AbortSignal): Promise<AvailableSite[]> {
    return apiGet('/api/sites', parseSites, signal);
  },
};
