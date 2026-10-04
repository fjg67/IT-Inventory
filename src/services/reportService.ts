import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import * as XLSX from 'xlsx';
import { articleRepository, mouvementRepository, siteRepository } from '@/database';
import { getSupabaseClient, tables } from '@/api/supabase';
import { Mouvement } from '@/types';

const EXPORT_DIR = RNFS.DocumentDirectoryPath;
export type ReportFormat = 'csv' | 'xlsx';

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function escapeCsv(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csv(rows: unknown[][]): string {
  return `\uFEFF${rows.map(row => row.map(escapeCsv).join(';')).join('\n')}`;
}

async function saveReport(name: string, rows: unknown[][], format: ReportFormat): Promise<string> {
  const base = `${EXPORT_DIR}/${name}_${timestamp()}`;
  if (format === 'csv') {
    const path = `${base}.csv`;
    await RNFS.writeFile(path, csv(rows), 'utf8');
    return path;
  }
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');
  const path = `${base}.xlsx`;
  const output = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  await RNFS.writeFile(path, output, 'base64');
  return path;
}

async function share(path: string, title: string): Promise<void> {
  await Share.open({ url: `file://${path}`, title, type: path.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' });
}

async function getArticleMap(ids: string[]): Promise<Map<string, { reference: string; name: string; category?: string; minStock?: number }>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await getSupabaseClient().from(tables.articles).select('id, reference, name, category, minStock').in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((article: any) => [String(article.id), article]));
}

export const reportService = {
  async exportArticleHistory(reference: string, siteId: string | number, format: ReportFormat): Promise<string> {
    const article = await articleRepository.findByReference(reference.trim(), siteId);
    if (!article) throw new Error('Article introuvable sur le site actif');
    const movements = await mouvementRepository.findByArticle(article.id, siteId, 5000);
    const rows: unknown[][] = [['Date', 'Type', 'Référence', 'Article', 'Quantité', 'Stock avant', 'Stock après', 'Technicien', 'Commentaire']];
    movements.forEach((movement: Mouvement) => rows.push([
      new Date(movement.dateMouvement).toLocaleString('fr-FR'), movement.type, article.reference, article.nom,
      movement.quantite, movement.stockAvant, movement.stockApres,
      movement.technicien ? `${movement.technicien.prenom} ${movement.technicien.nom}`.trim() : '', movement.commentaire ?? '',
    ]));
    const path = await saveReport(`historique_${article.reference.replace(/[^a-z0-9_-]/gi, '_')}`, rows, format);
    await share(path, `Historique ${article.reference}`);
    return path;
  },

  async exportStockBySite(format: ReportFormat): Promise<string> {
    const supabase = getSupabaseClient();
    const [{ data: stocks, error: stockError }, sites] = await Promise.all([
      supabase.from(tables.stocksSites).select('articleId, siteId, quantity'),
      siteRepository.findAll(),
    ]);
    if (stockError) throw new Error(stockError.message);
    const articleMap = await getArticleMap([...new Set((stocks ?? []).map((stock: any) => String(stock.articleId)))]);
    const siteMap = new Map(sites.map(site => [String(site.id), site.nom]));
    const rows: unknown[][] = [['Site', 'Référence', 'Article', 'Famille', 'Stock actuel', 'Stock minimum', 'Écart seuil']];
    (stocks ?? []).forEach((stock: any) => {
      const article = articleMap.get(String(stock.articleId));
      if (!article) return;
      rows.push([siteMap.get(String(stock.siteId)) ?? stock.siteId, article.reference, article.name, article.category ?? '', stock.quantity ?? 0, article.minStock ?? 0, (stock.quantity ?? 0) - (article.minStock ?? 0)]);
    });
    const path = await saveReport('stock_par_site', rows, format);
    await share(path, 'Rapport stock par site');
    return path;
  },

  async exportPCBreakdowns(format: ReportFormat): Promise<string> {
    const { data, error } = await getSupabaseClient().from(tables.pcPannes).select('*').order('declared_at', { ascending: false });
    if (error) throw new Error(error.message);
    const articleMap = await getArticleMap([...new Set((data ?? []).map((row: any) => String(row.pc_id)))]);
    const rows: unknown[][] = [['Date', 'PC', 'Référence', 'Type panne', 'Priorité', 'Statut', 'Ticket SAV', 'Technicien', 'Description']];
    (data ?? []).forEach((row: any) => {
      const article = articleMap.get(String(row.pc_id));
      rows.push([new Date(row.declared_at).toLocaleString('fr-FR'), article?.name ?? row.pc_id, article?.reference ?? '', row.type_panne, row.priorite, row.statut_reparation, row.ticket_sav ?? '', row.technicien_id ?? '', row.description ?? '']);
    });
    const path = await saveReport('pc_en_panne', rows, format);
    await share(path, 'Rapport PC en panne');
    return path;
  },

  async exportTransfers(format: ReportFormat): Promise<string> {
    const { data, error } = await getSupabaseClient().from(tables.mouvements).select('createdAt, articleId, quantity, fromSiteId, toSiteId, userId, reason').eq('type', 'TRANSFER').order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    const articleMap = await getArticleMap([...new Set((data ?? []).map((row: any) => String(row.articleId)))]);
    const siteIds = [...new Set((data ?? []).flatMap((row: any) => [row.fromSiteId, row.toSiteId]).filter(Boolean).map(String))];
    const { data: sites } = siteIds.length ? await getSupabaseClient().from(tables.sites).select('id, name').in('id', siteIds) : { data: [] };
    const siteMap = new Map((sites ?? []).map((site: any) => [String(site.id), site.name]));
    const rows: unknown[][] = [['Date', 'Référence', 'Article', 'Quantité', 'Site départ', 'Site arrivée', 'Utilisateur', 'Motif']];
    (data ?? []).forEach((row: any) => {
      const article = articleMap.get(String(row.articleId));
      rows.push([new Date(row.createdAt).toLocaleString('fr-FR'), article?.reference ?? '', article?.name ?? '', Math.abs(row.quantity ?? 0), siteMap.get(String(row.fromSiteId)) ?? row.fromSiteId, siteMap.get(String(row.toSiteId)) ?? row.toSiteId, row.userId ?? '', row.reason ?? '']);
    });
    const path = await saveReport('transferts', rows, format);
    await share(path, 'Rapport des transferts');
    return path;
  },

  async saveSubscription(userId: string, email: string, frequency: 'weekly' | 'monthly', enabled: boolean): Promise<void> {
    const { error } = await getSupabaseClient().from(tables.reportSubscriptions).upsert({
      id: `${userId}-${frequency}`, userId, email: email.trim(), frequency, enabled, updatedAt: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  },
};

export default reportService;
