import { articleRepository, mouvementRepository, stockRepository, siteRepository } from '@/database';
import { Article, ArticleForm, Site } from '@/types';

export interface BulkPatch {
  famille?: string;
  marque?: string;
  emplacement?: string;
  stockMini?: number;
  prixUnitaire?: number;
}

export interface BulkOperationResult {
  success: number;
  failed: Array<{ reference: string; message: string }>;
}

export interface ImportResult extends BulkOperationResult {
  created: number;
  updated: number;
}

function result(): BulkOperationResult {
  return { success: 0, failed: [] };
}

function addFailure(output: BulkOperationResult, article: Pick<Article, 'reference'> | string, error: unknown): void {
  output.failed.push({
    reference: typeof article === 'string' ? article : article.reference,
    message: error instanceof Error ? error.message : 'Erreur inconnue',
  });
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseNumber(rawValue: string | undefined, fallback = 0): number {
  const parsed = Number((rawValue ?? '').replace(',', '.').trim());
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export function parseImportText(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = (lines[0].match(/;/g) ?? []).length >= (lines[0].match(/,/g) ?? []).length ? ';' : ',';
  const split = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === delimiter && !quoted) {
        values.push(current.trim());
        current = '';
      } else {
        current += character;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = split(lines[0]).map(normalizeHeader);
  return lines.slice(1).map(line => {
    const values = split(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function getRowValue(row: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    const found = row[normalizeHeader(name)];
    if (found != null && found.trim() !== '') return found.trim();
  }
  return '';
}

async function allArticles(siteId: string | number): Promise<Article[]> {
  const page = await articleRepository.findAll(siteId, 0, 10000);
  return page.data;
}

async function getSites(): Promise<Site[]> {
  return siteRepository.findAll();
}

export const bulkArticleService = {
  async getArticles(siteId: string | number): Promise<Article[]> {
    return allArticles(siteId);
  },

  async getSites(): Promise<Site[]> {
    return getSites();
  },

  async updateArticles(articles: Article[], patch: BulkPatch): Promise<BulkOperationResult> {
    const output = result();
    for (const article of articles) {
      try {
        await articleRepository.update(article.id, patch);
        output.success += 1;
      } catch (error) {
        addFailure(output, article, error);
      }
    }
    return output;
  },

  async archiveArticles(articles: Article[]): Promise<BulkOperationResult> {
    const output = result();
    for (const article of articles) {
      try {
        await articleRepository.deactivate(article.id);
        output.success += 1;
      } catch (error) {
        addFailure(output, article, error);
      }
    }
    return output;
  },

  async createMovement(
    articles: Article[],
    siteId: string | number,
    type: 'entree' | 'sortie',
    quantity: number,
    technicianId: string | number,
  ): Promise<BulkOperationResult> {
    const output = result();
    const safeQuantity = Math.max(1, Math.floor(quantity));
    for (const article of articles) {
      try {
        await mouvementRepository.create({ articleId: article.id, siteId, type, quantite: safeQuantity }, technicianId);
        output.success += 1;
      } catch (error) {
        addFailure(output, article, error);
      }
    }
    return output;
  },

  async transferArticles(
    articles: Article[],
    sourceSiteId: string | number,
    destinationSiteId: string | number,
    technicianId: string | number,
  ): Promise<BulkOperationResult> {
    const output = result();
    for (const article of articles) {
      const quantity = Math.floor(article.quantiteActuelle ?? 0);
      if (quantity <= 0) {
        addFailure(output, article, 'Stock nul : aucun transfert effectué');
        continue;
      }
      try {
        await mouvementRepository.createTransfert({
          articleId: article.id,
          siteDepartId: sourceSiteId,
          siteArriveeId: destinationSiteId,
          quantite: quantity,
          commentaire: 'Transfert groupé',
        }, technicianId);
        output.success += 1;
      } catch (error) {
        addFailure(output, article, error);
      }
    }
    return output;
  },

  async importRows(rows: Array<Record<string, string>>, siteId: string | number): Promise<ImportResult> {
    const output: ImportResult = { ...result(), created: 0, updated: 0 };
    for (const row of rows) {
      const reference = getRowValue(row, 'reference', 'référence', 'ref');
      if (!reference) {
        addFailure(output, 'ligne sans référence', 'La référence est obligatoire');
        continue;
      }

      try {
        const existing = await articleRepository.findByReference(reference);
        const stockValue = getRowValue(row, 'stock', 'quantité', 'quantite', 'quantity');
        const stock = parseNumber(stockValue, 0);
        const patch: BulkPatch = {};
        const famille = getRowValue(row, 'famille', 'categorie', 'category');
        const marque = getRowValue(row, 'marque', 'brand');
        const emplacement = getRowValue(row, 'emplacement', 'location');
        const stockMini = getRowValue(row, 'stockMini', 'stock minimum', 'minimum', 'minStock');
        const prixUnitaire = getRowValue(row, 'prix', 'prix unitaire', 'prixUnitaire', 'unitPrice');
        if (famille) patch.famille = famille;
        if (marque) patch.marque = marque;
        if (emplacement) patch.emplacement = emplacement;
        if (stockMini) patch.stockMini = parseNumber(stockMini);
        if (prixUnitaire) patch.prixUnitaire = parseNumber(prixUnitaire);

        if (existing) {
          if (Object.keys(patch).length > 0) await articleRepository.update(existing.id, patch);
          await stockRepository.createOrUpdate(existing.id, siteId, stock);
          output.updated += 1;
        } else {
          const data: ArticleForm = {
            reference,
            nom: getRowValue(row, 'nom', 'article', 'name') || reference,
            barcode: getRowValue(row, 'codebarres', 'barcode', 'asset') || undefined,
            famille: famille || undefined,
            marque: marque || undefined,
            emplacement: emplacement || undefined,
            stockMini: patch.stockMini ?? 0,
            prixUnitaire: patch.prixUnitaire ?? 0,
            unite: getRowValue(row, 'unite', 'unit') || 'unité',
            description: getRowValue(row, 'description') || undefined,
          };
          const articleId = await articleRepository.create(data);
          await stockRepository.createOrUpdate(articleId, siteId, stock);
          output.created += 1;
        }
        output.success += 1;
      } catch (error) {
        addFailure(output, reference, error);
      }
    }
    return output;
  },
};

export default bulkArticleService;
