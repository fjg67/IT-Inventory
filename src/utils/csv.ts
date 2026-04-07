// ============================================
// CSV EXPORT UTILITIES - IT-Inventory Application
// ============================================

import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform, Alert } from 'react-native';
import { getSupabaseClient, tables } from '@/api/supabase';
import { ExportOptions, Article, Mouvement } from '@/types';

const EXPORT_DIR = Platform.OS === 'android' 
  ? RNFS.DownloadDirectoryPath 
  : RNFS.DocumentDirectoryPath;

/**
 * Échappe une valeur pour le format CSV
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // Échapper les guillemets et encadrer si nécessaire
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Génère une ligne CSV à partir d'un tableau de valeurs
 */
function toCSVRow(values: unknown[]): string {
  return values.map(escapeCSV).join(';');
}

/**
 * Génère le nom de fichier avec timestamp
 */
function generateFilename(prefix: string, extension = 'csv'): string {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Export des articles en CSV (données Supabase)
 */
export async function exportArticles(siteId?: string | number): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: articles, error: errArt } = await supabase
    .from(tables.articles)
    .select('id, reference, name, description, minStock, unit, category')
    .eq('isArchived', false)
    .order('reference');
  if (errArt) throw new Error(errArt.message);

  let stockMap = new Map<string, number>();
  if (siteId) {
    const { data: stocks } = await supabase
      .from(tables.stocksSites)
      .select('articleId, quantity')
      .eq('siteId', siteId);
    stockMap = new Map((stocks ?? []).map((s: any) => [s.articleId, s.quantity ?? 0]));
  }

  const headers = ['Référence', 'Nom', 'Description', 'Catégorie', 'Stock Mini', 'Unité', 'Stock Actuel'];
  const rows = (articles ?? []).map((a: any) => [
    a.reference,
    a.name,
    a.description ?? '',
    a.category ?? '',
    a.minStock,
    a.unit,
    siteId != null ? (stockMap.get(a.id) ?? 0) : '',
  ]);

  const csvContent = [toCSVRow(headers), ...rows.map(toCSVRow)].join('\n');
  const filename = generateFilename('articles');
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export des stocks par site en CSV (Supabase)
 */
export async function exportStocks(siteId?: string | number): Promise<string> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from(tables.stocksSites)
    .select('articleId, siteId, quantity');
  if (siteId) query = query.eq('siteId', siteId);
  const { data: stocks, error } = await query;
  if (error) throw new Error(error.message);

  // Fetch article info
  const articleIds = [...new Set((stocks ?? []).map((s: any) => s.articleId))];
  const { data: articles } = articleIds.length > 0
    ? await supabase.from(tables.articles).select('id, reference, name, minStock, unit').in('id', articleIds)
    : { data: [] };
  const articleMap = new Map<string, any>();
  for (const a of articles ?? []) articleMap.set(a.id, a);

  // Fetch site info
  const siteIds = [...new Set((stocks ?? []).map((s: any) => s.siteId))];
  const { data: sites } = siteIds.length > 0
    ? await supabase.from(tables.sites).select('id, name').in('id', siteIds)
    : { data: [] };
  const siteMap = new Map<string, string>();
  for (const s of sites ?? []) siteMap.set(s.id, s.name);

  const headers = ['Référence', 'Article', 'Site', 'Stock Actuel', 'Stock Mini', 'Unité'];
  const rows = (stocks ?? []).map((s: any) => {
    const art = articleMap.get(s.articleId);
    return [
      art?.reference ?? '',
      art?.name ?? '',
      siteMap.get(s.siteId) ?? '',
      s.quantity,
      art?.minStock ?? 0,
      art?.unit ?? '',
    ];
  });

  const csvContent = [toCSVRow(headers), ...rows.map(toCSVRow)].join('\n');
  const filename = generateFilename(siteId ? `stocks_site_${siteId}` : 'stocks');
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export des mouvements en CSV (Supabase)
 */
export async function exportMouvements(options: ExportOptions = { type: 'mouvements' }): Promise<string> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from(tables.mouvements)
    .select('createdAt, type, quantity, reason, articleId, fromSiteId, userId')
    .order('createdAt', { ascending: false });
  if (options.siteId) query = query.eq('fromSiteId', options.siteId);
  if (options.dateDebut) query = query.gte('createdAt', options.dateDebut.toISOString());
  if (options.dateFin) query = query.lte('createdAt', options.dateFin.toISOString());
  const { data: mouvements, error } = await query;
  if (error) throw new Error(error.message);

  // Fetch article info
  const articleIds = [...new Set((mouvements ?? []).map((m: any) => m.articleId))];
  const { data: articles } = articleIds.length > 0
    ? await supabase.from(tables.articles).select('id, reference, name').in('id', articleIds)
    : { data: [] };
  const articleMap = new Map<string, any>();
  for (const a of articles ?? []) articleMap.set(a.id, a);

  // Fetch site info
  const siteIds = [...new Set((mouvements ?? []).map((m: any) => m.fromSiteId))];
  const { data: sites } = siteIds.length > 0
    ? await supabase.from(tables.sites).select('id, name').in('id', siteIds)
    : { data: [] };
  const siteMap = new Map<string, string>();
  for (const s of sites ?? []) siteMap.set(s.id, s.name);

  const headers = [
    'Date', 'Référence', 'Article', 'Site', 'Type',
    'Quantité', 'Commentaire',
  ];
  const rows = (mouvements ?? []).map((m: any) => {
    const art = articleMap.get(m.articleId);
    return [
      m.createdAt,
      art?.reference ?? '',
      art?.name ?? '',
      siteMap.get(m.fromSiteId) ?? '',
      m.type,
      m.quantity,
      m.reason ?? '',
    ];
  });

  const csvContent = [toCSVRow(headers), ...rows.map(toCSVRow)].join('\n');
  const filename = generateFilename('mouvements');
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export du journal de modifications en CSV (Supabase)
 * AuditLog columns: id, action, entityType, entityId, oldValue, newValue, userId, articleId, createdAt
 */
export async function exportJournal(dateDebut?: Date): Promise<string> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from(tables.journalModifications)
    .select('createdAt, action, entityType, entityId, oldValue, newValue, userId')
    .order('createdAt', { ascending: false });
  if (dateDebut) query = query.gte('createdAt', dateDebut.toISOString());
  const { data: journal, error } = await query;
  if (error) throw new Error(error.message);

  const headers = [
    'Date', 'Action', 'Type Entité', 'ID Entité',
    'Ancienne Valeur', 'Nouvelle Valeur', 'Utilisateur',
  ];
  const rows = (journal ?? []).map((j: any) => [
    j.createdAt,
    j.action,
    j.entityType,
    j.entityId,
    j.oldValue ? JSON.stringify(j.oldValue) : '',
    j.newValue ? JSON.stringify(j.newValue) : '',
    j.userId ?? '',
  ]);

  const csvContent = [toCSVRow(headers), ...rows.map(toCSVRow)].join('\n');
  const filename = generateFilename('journal_modifications');
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export des données d'un article (fiche + historique mouvements) en CSV, enregistré sur le téléphone
 */
export async function exportArticleDetail(article: Article, movements: Mouvement[], siteNom: string): Promise<string> {
  const currentStock = Number(article.quantiteActuelle ?? 0);
  const minStock = Number(article.stockMini ?? 0);
  const isLowStock = currentStock < minStock;
  const generatedAt = new Date();

  const totalMouvements = movements.length;
  const totalEntries = movements.filter(m => Number(m.quantite ?? 0) > 0).reduce((sum, m) => sum + Number(m.quantite ?? 0), 0);
  const totalExits = movements.filter(m => Number(m.quantite ?? 0) < 0).reduce((sum, m) => sum + Math.abs(Number(m.quantite ?? 0)), 0);
  const netFlow = totalEntries - totalExits;

  const lines: string[] = [];
  lines.push('\uFEFFIT-INVENTORY EXPORT ARTICLE PREMIUM');
  lines.push('==============================');
  lines.push(toCSVRow(['Export généré le', generatedAt.toLocaleString('fr-FR')]));
  lines.push(toCSVRow(['Site', siteNom]));
  lines.push(toCSVRow(['']));
  lines.push('RESUME ARTICLE');
  lines.push(toCSVRow(['Référence', 'Nom', 'Description', 'Code famille', 'Famille', 'Type', 'Sous-type', 'Marque', 'Emplacement', 'Unité']));
  lines.push(
    toCSVRow([
      article.reference,
      article.nom,
      article.description ?? '',
      article.codeFamille ?? '',
      article.famille ?? '',
      article.typeArticle ?? '',
      article.sousType ?? '',
      article.marque ?? '',
      article.emplacement ?? '',
      article.unite,
    ]),
  );
  lines.push(toCSVRow(['']));
  lines.push('INDICATEURS STOCK');
  lines.push(toCSVRow(['Stock actuel', 'Stock minimum', 'État stock', 'Total mouvements', 'Entrées cumulées', 'Sorties cumulées', 'Flux net']));
  lines.push(
    toCSVRow([
      currentStock,
      minStock,
      isLowStock ? 'Stock faible' : 'Stock correct',
      totalMouvements,
      totalEntries,
      totalExits,
      netFlow,
    ]),
  );
  lines.push(toCSVRow(['']));
  lines.push('HISTORIQUE COMPLET DES MOUVEMENTS');
  lines.push(
    toCSVRow([
      '#',
      'Date',
      'Type',
      'Quantité',
      'Stock avant',
      'Stock après',
      'Technicien',
      'Commentaire',
    ]),
  );

  movements.forEach((m, index) => {
    const technicienStr = m.technicien
      ? `${m.technicien.prenom ?? ''} ${m.technicien.nom ?? ''}`.trim()
      : '';
    const rawDate = m.dateMouvement instanceof Date ? m.dateMouvement : new Date(String(m.dateMouvement));
    const dateStr = Number.isNaN(rawDate.getTime()) ? String(m.dateMouvement) : rawDate.toLocaleString('fr-FR');
    lines.push(
      toCSVRow([
        index + 1,
        dateStr,
        m.type,
        m.quantite,
        m.stockAvant,
        m.stockApres,
        technicienStr,
        m.commentaire ?? '',
      ]),
    );
  });

  const csvContent = lines.join('\n');
  const safeRef = (article.reference || 'article').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = generateFilename(`article_premium_${safeRef}`);
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export analytique d'un article (format plat pour BI/Excel)
 */
export async function exportArticleDetailAnalytics(
  article: Article,
  movements: Mouvement[],
  siteNom: string,
): Promise<string> {
  const currentStock = Number(article.quantiteActuelle ?? 0);
  const minStock = Number(article.stockMini ?? 0);
  const isLowStock = currentStock < minStock;
  const generatedAt = new Date().toISOString();

  const headers = [
    'export_generated_at',
    'site_name',
    'article_id',
    'article_reference',
    'article_name',
    'article_unit',
    'article_current_stock',
    'article_min_stock',
    'article_is_low_stock',
    'movement_index',
    'movement_id',
    'movement_date_iso',
    'movement_type',
    'movement_quantity',
    'movement_stock_before',
    'movement_stock_after',
    'movement_technician_id',
    'movement_technician_name',
    'movement_comment',
  ];

  const rows = movements.map((m, index) => {
    const dateIso =
      m.dateMouvement instanceof Date
        ? m.dateMouvement.toISOString()
        : new Date(String(m.dateMouvement)).toISOString();
    const technicienName = m.technicien
      ? `${m.technicien.prenom ?? ''} ${m.technicien.nom ?? ''}`.trim()
      : '';

    return [
      generatedAt,
      siteNom,
      String(article.id ?? ''),
      article.reference,
      article.nom,
      article.unite,
      currentStock,
      minStock,
      isLowStock ? 1 : 0,
      index + 1,
      String(m.id ?? ''),
      dateIso,
      m.type,
      m.quantite,
      m.stockAvant,
      m.stockApres,
      String(m.technicienId ?? ''),
      technicienName,
      m.commentaire ?? '',
    ];
  });

  // Conserver une ligne même sans mouvement, utile pour dashboards
  if (rows.length === 0) {
    rows.push([
      generatedAt,
      siteNom,
      String(article.id ?? ''),
      article.reference,
      article.nom,
      article.unite,
      currentStock,
      minStock,
      isLowStock ? 1 : 0,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  }

  const csvContent = ['\uFEFF' + toCSVRow(headers), ...rows.map(toCSVRow)].join('\n');
  const safeRef = (article.reference || 'article').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = generateFilename(`article_analytics_${safeRef}`);
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export comptable d'un article (entrées/sorties + totaux)
 */
export async function exportArticleDetailAccounting(
  article: Article,
  movements: Mouvement[],
  siteNom: string,
): Promise<string> {
  const currentStock = Number(article.quantiteActuelle ?? 0);
  const minStock = Number(article.stockMini ?? 0);
  const generatedAt = new Date();

  let totalEntrees = 0;
  let totalSorties = 0;

  const rows = movements.map((m, index) => {
    const qty = Number(m.quantite ?? 0);
    const entree = qty > 0 ? qty : 0;
    const sortie = qty < 0 ? Math.abs(qty) : 0;
    totalEntrees += entree;
    totalSorties += sortie;

    const rawDate = m.dateMouvement instanceof Date ? m.dateMouvement : new Date(String(m.dateMouvement));
    const dateStr = Number.isNaN(rawDate.getTime()) ? String(m.dateMouvement) : rawDate.toLocaleString('fr-FR');
    const techName = m.technicien ? `${m.technicien.prenom ?? ''} ${m.technicien.nom ?? ''}`.trim() : '';

    return [
      index + 1,
      dateStr,
      m.type,
      entree,
      sortie,
      qty,
      m.stockAvant,
      m.stockApres,
      techName,
      m.commentaire ?? '',
    ];
  });

  const fluxNet = totalEntrees - totalSorties;

  const lines: string[] = [];
  lines.push('\uFEFFIT-INVENTORY EXPORT COMPTABLE');
  lines.push(toCSVRow(['Généré le', generatedAt.toLocaleString('fr-FR')]));
  lines.push(toCSVRow(['Article', `${article.reference} - ${article.nom}`]));
  lines.push(toCSVRow(['Site', siteNom]));
  lines.push('');
  lines.push('SYNTHÈSE');
  lines.push(toCSVRow(['Stock actuel', 'Stock minimum', 'Total entrées', 'Total sorties', 'Flux net']));
  lines.push(toCSVRow([currentStock, minStock, totalEntrees, totalSorties, fluxNet]));
  lines.push('');
  lines.push('DÉTAIL MOUVEMENTS');
  lines.push(
    toCSVRow([
      '#',
      'Date',
      'Type',
      'Entrée',
      'Sortie',
      'Quantité signée',
      'Stock avant',
      'Stock après',
      'Technicien',
      'Commentaire',
    ]),
  );
  rows.forEach((r) => lines.push(toCSVRow(r)));

  if (rows.length === 0) {
    lines.push(toCSVRow(['', '', '', 0, 0, 0, '', '', '', 'Aucun mouvement']));
  }

  const csvContent = lines.join('\n');
  const safeRef = (article.reference || 'article').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = generateFilename(`article_comptable_${safeRef}`);
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, csvContent, 'utf8');
  return filepath;
}

/**
 * Export principal avec options
 */
export async function exportToCSV(options: ExportOptions): Promise<string> {
  let filepath: string;

  switch (options.type) {
    case 'articles':
      filepath = await exportArticles(options.siteId);
      break;
    case 'stocks':
      filepath = await exportStocks(options.siteId);
      break;
    case 'mouvements':
      filepath = await exportMouvements(options);
      break;
    case 'journal':
      filepath = await exportJournal(options.dateDebut);
      break;
    default:
      throw new Error(`Type d'export non supporté: ${options.type}`);
  }

  return filepath;
}

/**
 * Partage un fichier exporté
 */
export async function shareExportedFile(filepath: string): Promise<void> {
  try {
    const filename = filepath.split('/').pop() || 'export.csv';
    
    await Share.open({
      url: Platform.OS === 'android' ? `file://${filepath}` : filepath,
      type: 'text/csv',
      filename,
      title: 'Partager le fichier',
    });
  } catch (error) {
    // L'utilisateur a annulé le partage
    if ((error as Error).message !== 'User did not share') {
      console.error('[CSV] Erreur partage:', error);
      throw error;
    }
  }
}

/**
 * Export et partage en une seule opération
 */
export async function exportAndShare(options: ExportOptions): Promise<void> {
  try {
    const filepath = await exportToCSV(options);
    await shareExportedFile(filepath);
  } catch (error) {
    Alert.alert('Erreur', `Erreur lors de l'export: ${(error as Error).message}`);
  }
}

/**
 * Export les données utilisateur pour RGPD (Supabase)
 */
export async function exportUserDataRGPD(technicienId: string | number): Promise<string> {
  const supabase = getSupabaseClient();
  const [profilRes, mouvementsRes, modificationsRes] = await Promise.all([
    supabase.from(tables.techniciens).select('id, technicianId, name').eq('id', technicienId).maybeSingle(),
    supabase.from(tables.mouvements).select('*').eq('userId', technicienId).order('createdAt', { ascending: false }),
    supabase.from(tables.journalModifications).select('*').eq('userId', technicienId).order('createdAt', { ascending: false }),
  ]);
  const userData = {
    export_date: new Date().toISOString(),
    profil: profilRes.data ?? null,
    mouvements: mouvementsRes.data ?? [],
    modifications: modificationsRes.data ?? [],
  };
  const json = JSON.stringify(userData, null, 2);
  const filename = generateFilename('mes_donnees_rgpd', 'json');
  const filepath = `${EXPORT_DIR}/${filename}`;
  await RNFS.writeFile(filepath, json, 'utf8');
  return filepath;
}
