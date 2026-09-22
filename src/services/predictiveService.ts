import { getSupabaseClient, tables } from '@/api/supabase';
import { articleRepository } from '@/database/repositories/articleRepository';
import { Article } from '@/types/models';

export interface PredictiveAlert {
  articleId: number;
  articleNom: string;
  articleFamille?: string;
  velocity: number; // unités consommées par jour
  daysRemaining: number;
  currentStock: number;
}

export const predictiveService = {
  /**
   * Analyse les mouvements des X derniers jours pour estimer la vitesse de baisse des stocks.
   * Retourne les articles avec moins de `thresholdDays` restants.
   */
  async getPredictiveAlerts(
    siteId: string | number,
    daysHistory = 30,
    thresholdDays = 14
  ): Promise<PredictiveAlert[]> {
    try {
      const supabase = getSupabaseClient();
      
      // Date de début d'analyse
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysHistory);
      const startIso = startDate.toISOString();

      // Récupérer les mouvements de SORTIE sur la période
      const { data: mouvements, error } = await supabase
        .from(tables.mouvements)
        .select('articleId, quantity, fromSiteId')
        .eq('type', 'EXIT')
        .eq('fromSiteId', siteId)
        .gte('createdAt', startIso);

      if (error) {
        console.error('[PredictiveService] Erreur lors de la récupération des mouvements:', error);
        return [];
      }

      if (!mouvements || mouvements.length === 0) {
        return [];
      }

      // Calculer le total sorti par article
      const outMap = new Map<number, number>();
      for (const m of mouvements as any[]) {
        if (!m.articleId || !m.quantity) continue;
        const current = outMap.get(m.articleId) || 0;
        outMap.set(m.articleId, current + m.quantity);
      }

      // Récupérer les articles concernés pour avoir le stock actuel
      const articleIds = Array.from(outMap.keys());
      if (articleIds.length === 0) return [];

      const articlesResults = await Promise.all(
        articleIds.map((id) => articleRepository.findById(id, siteId))
      );
      const articles = articlesResults.filter((a): a is Article => a !== null);
      
      const alerts: PredictiveAlert[] = [];

      for (const article of articles) {
        const totalOut = outMap.get(Number(article.id)) || 0;
        if (totalOut === 0) continue;

        // Vélocité = nombre d'articles sortis par jour en moyenne
        const velocity = totalOut / daysHistory;
        
        // Stock actuel
        const currentStock = article.quantiteActuelle || 0;

        // S'il n'y a plus de stock, on est déjà en rupture
        if (currentStock <= 0) continue;

        // Jours restants estimés
        const daysRemaining = currentStock / velocity;

        if (daysRemaining <= thresholdDays) {
          alerts.push({
            articleId: Number(article.id),
            articleNom: article.nom,
            articleFamille: article.famille,
            velocity,
            daysRemaining: Math.floor(daysRemaining),
            currentStock,
          });
        }
      }

      // Trier par urgence (jours restants croissants)
      alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

      return alerts;
    } catch (e) {
      console.error('[PredictiveService] Erreur globale:', e);
      return [];
    }
  }
};
