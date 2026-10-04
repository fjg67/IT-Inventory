import { getSupabaseClient, tables } from '@/api/supabase';
import { articleRepository, siteRepository } from '@/database';
import { Article, Mouvement, Site } from '@/types';

export interface GlobalSearchResults {
  articles: Article[];
  movements: Mouvement[];
  sites: Site[];
}

export const globalSearchService = {
  async search(query: string, siteId?: string | number): Promise<GlobalSearchResults> {
    const text = query.trim();
    if (text.length < 2) return { articles: [], movements: [], sites: [] };

    const [articlesResult, sites, movementRows] = await Promise.all([
      siteId
        ? articleRepository.search(siteId, { searchQuery: text, stockFaible: false }, 0, 30)
        : Promise.resolve({ data: [] as Article[] }),
      siteRepository.findAll(),
      getSupabaseClient().from(tables.mouvements).select('*').or(`reason.ilike.%${text}%,type.ilike.%${text}%`).order('createdAt', { ascending: false }).limit(30),
    ]);
    if (movementRows.error) throw new Error(movementRows.error.message);

    const normalized = text.toLowerCase();
    const matchingSites = sites.filter(site => `${site.nom} ${site.code} ${site.adresse ?? ''}`.toLowerCase().includes(normalized));
    const articleIds = [...new Set((movementRows.data ?? []).map((row: any) => String(row.articleId)))];
    const articleMap = new Map<string, Article>();
    for (const id of articleIds) {
      const article = await articleRepository.findById(id, siteId);
      if (article) articleMap.set(id, article);
    }
    const movements = (movementRows.data ?? []).map((row: any): Mouvement => ({
      id: row.id,
      articleId: row.articleId,
      article: articleMap.get(String(row.articleId)),
      siteId: row.fromSiteId,
      type: String(row.type).toLowerCase() as Mouvement['type'],
      quantite: row.quantity,
      stockAvant: 0,
      stockApres: 0,
      technicienId: row.userId,
      dateMouvement: new Date(row.createdAt),
      commentaire: row.reason ?? undefined,
      syncStatus: 'synced' as any,
    }));

    return { articles: articlesResult.data, movements, sites: matchingSites };
  },
};

export default globalSearchService;
