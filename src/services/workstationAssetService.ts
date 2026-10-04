import { getSupabaseClient } from '@/api/supabase';
import { Article } from '@/types';
import { movementPushDispatchService } from '@/services/movementPushDispatchService';

const TRACKED_REFERENCES = new Set(['1800001', '1800002', '1800003', '1800004']);

export type AssetScanRecord = {
  id: string;
  code: string;
  direction: 'entree' | 'sortie';
  createdAt: string;
};

export const isTrackedWorkstation = (article: Pick<Article, 'reference'>): boolean =>
  TRACKED_REFERENCES.has(article.reference);

export const getAssetsInStock = (history: AssetScanRecord[]): AssetScanRecord[] => {
  const latestByCode = new Map<string, AssetScanRecord>();
  for (const record of history) {
    if (!latestByCode.has(record.code)) latestByCode.set(record.code, record);
  }
  return [...latestByCode.values()].filter(record => record.direction === 'entree');
};

export const workstationAssetService = {
  async listHistory(articleId: string | number, siteId: string | number): Promise<AssetScanRecord[]> {
    const pageSize = 500;
    const history: AssetScanRecord[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await getSupabaseClient()
        .from('StockMovement')
        .select('id, reason, type, createdAt')
        .eq('articleId', String(articleId))
        .eq('fromSiteId', String(siteId))
        .like('reason', 'Asset %')
        .order('createdAt', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      history.push(...rows.map((row) => ({
        id: row.id,
        code: String(row.reason).slice('Asset '.length),
        direction: row.type === 'EXIT' ? 'sortie' as const : 'entree' as const,
        createdAt: row.createdAt,
      })));
      if (rows.length < pageSize) break;
    }
    return history;
  },

  async record(articleId: string | number, siteId: string | number, assetCode: string, direction: 'entree' | 'sortie', userId: string | number) {
    const { data, error } = await getSupabaseClient().rpc('record_workstation_asset', {
      p_article_id: String(articleId),
      p_site_id: String(siteId),
      p_asset_code: assetCode.trim().toUpperCase(),
      p_direction: direction,
      p_user_id: String(userId),
    });
    if (error) throw new Error(error.message);
    const result = data as { assetCode: string; quantity: number; movementId: string };
    movementPushDispatchService.dispatchMovementCreated({
      movementId: result.movementId,
      senderUserId: String(userId),
    }).catch((pushError) => {
      console.warn('[workstationAssetService] Push movement failed:', pushError);
    });
    return result;
  },
};