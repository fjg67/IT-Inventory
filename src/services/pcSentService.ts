import { getSupabaseClient, tables } from '@/api/supabase';

function generateId(): string {
  return `sent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface SentPCPayload {
  articleId?: string;
  hostname: string;
  asset?: string;
  model?: string;
  brand?: string;
  sourceSiteId: string;
  sourceSiteName?: string;
  sourceAgencyEds?: string;
  destinationAgencyEds: string;
  sentByUserId?: string;
  sentByName?: string;
}

export interface SentPCRecord {
  id: string;
  articleId?: string;
  hostname: string;
  asset?: string;
  model?: string;
  brand?: string;
  sourceSiteId: string;
  sourceSiteName?: string;
  sourceAgencyEds?: string;
  destinationAgencyEds: string;
  sentByUserId?: string;
  sentByName?: string;
  sentAt: string;
  createdAt: string;
}

interface SentPCRow {
  id: string;
  articleId: string | null;
  hostname: string;
  asset: string | null;
  model: string | null;
  brand: string | null;
  sourceSiteId: string;
  sourceSiteName: string | null;
  sourceAgencyEds: string | null;
  destinationAgencyEds: string;
  sentByUserId: string | null;
  sentByName: string | null;
  sentAt: string;
  createdAt: string;
}

function mapRow(row: SentPCRow): SentPCRecord {
  return {
    id: row.id,
    articleId: row.articleId ?? undefined,
    hostname: row.hostname,
    asset: row.asset ?? undefined,
    model: row.model ?? undefined,
    brand: row.brand ?? undefined,
    sourceSiteId: row.sourceSiteId,
    sourceSiteName: row.sourceSiteName ?? undefined,
    sourceAgencyEds: row.sourceAgencyEds ?? undefined,
    destinationAgencyEds: row.destinationAgencyEds,
    sentByUserId: row.sentByUserId ?? undefined,
    sentByName: row.sentByName ?? undefined,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  };
}

export const pcSentService = {
  async record(payload: SentPCPayload): Promise<void> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(tables.pcSentHistory)
      .insert({
        id: generateId(),
        articleId: payload.articleId ?? null,
        hostname: payload.hostname,
        asset: payload.asset ?? null,
        model: payload.model ?? null,
        brand: payload.brand ?? null,
        sourceSiteId: payload.sourceSiteId,
        sourceSiteName: payload.sourceSiteName ?? null,
        sourceAgencyEds: payload.sourceAgencyEds ?? null,
        destinationAgencyEds: payload.destinationAgencyEds,
        sentByUserId: payload.sentByUserId ?? null,
        sentByName: payload.sentByName ?? null,
        sentAt: now,
        createdAt: now,
      });

    if (error) {
      throw new Error(`Historique envoi impossible: ${error.message}`);
    }
  },

  async listBySourceSite(sourceSiteId: string, limit: number = 500): Promise<SentPCRecord[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.pcSentHistory)
      .select('*')
      .eq('sourceSiteId', sourceSiteId)
      .order('sentAt', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Chargement historique envois impossible: ${error.message}`);
    }

    return (data ?? []).map((row: SentPCRow) => mapRow(row));
  },

  async countBySourceSite(sourceSiteId: string): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from(tables.pcSentHistory)
      .select('id', { count: 'exact', head: true })
      .eq('sourceSiteId', sourceSiteId);

    if (error) {
      throw new Error(`Comptage envois impossible: ${error.message}`);
    }

    return count ?? 0;
  },
};
