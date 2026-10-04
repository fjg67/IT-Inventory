import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { articleRepository } from '@/database';
import { Article } from '@/types';

const STORAGE_PREFIX = '@it-inventory/inventory-campaign:';

type CampaignStatus = 'active' | 'validated';

export interface InventoryLine {
  articleId: string;
  reference: string;
  barcode?: string;
  name: string;
  location?: string;
  expectedQuantity: number;
  countedQuantity: number;
  lastScannedAt?: string;
}

export interface UnknownScan {
  identifier: string;
  count: number;
  firstScannedAt: string;
  lastScannedAt: string;
}

export interface InventoryCampaign {
  id: string;
  siteId: string;
  siteName: string;
  startedAt: string;
  updatedAt: string;
  status: CampaignStatus;
  lines: InventoryLine[];
  unknownScans: UnknownScan[];
  signatureName?: string;
  signatureAt?: string;
}

export interface InventorySummary {
  totalLines: number;
  scannedLines: number;
  expectedUnits: number;
  countedUnits: number;
  missingLines: InventoryLine[];
  surplusLines: InventoryLine[];
  unknownScans: UnknownScan[];
}

function storageKey(siteId: string | number): string {
  return `${STORAGE_PREFIX}${siteId}`;
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function makeId(): string {
  return `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function save(campaign: InventoryCampaign): Promise<InventoryCampaign> {
  const next = { ...campaign, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(storageKey(next.siteId), JSON.stringify(next));
  return next;
}

function mapArticle(article: Article): InventoryLine {
  return {
    articleId: String(article.id),
    reference: article.reference,
    barcode: article.barcode,
    name: article.nom,
    location: article.emplacement,
    expectedQuantity: Math.max(0, Number(article.quantiteActuelle ?? 0)),
    countedQuantity: 0,
  };
}

export function summarizeCampaign(campaign: InventoryCampaign): InventorySummary {
  const missingLines = campaign.lines.filter(line => line.countedQuantity < line.expectedQuantity);
  const surplusLines = campaign.lines.filter(line => line.countedQuantity > line.expectedQuantity);

  return {
    totalLines: campaign.lines.length,
    scannedLines: campaign.lines.filter(line => line.countedQuantity > 0).length,
    expectedUnits: campaign.lines.reduce((total, line) => total + line.expectedQuantity, 0),
    countedUnits: campaign.lines.reduce((total, line) => total + line.countedQuantity, 0),
    missingLines,
    surplusLines,
    unknownScans: campaign.unknownScans,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character] ?? character));
}

export const inventoryCampaignService = {
  async getActive(siteId: string | number): Promise<InventoryCampaign | null> {
    const raw = await AsyncStorage.getItem(storageKey(siteId));
    if (!raw) return null;
    try {
      const campaign = JSON.parse(raw) as InventoryCampaign;
      return campaign.status === 'active' ? campaign : null;
    } catch {
      return null;
    }
  },

  async start(siteId: string | number, siteName: string): Promise<InventoryCampaign> {
    const existing = await this.getActive(siteId);
    if (existing) return existing;

    const result = await articleRepository.findAll(siteId, 0, 10000);
    const now = new Date().toISOString();
    const campaign: InventoryCampaign = {
      id: makeId(),
      siteId: String(siteId),
      siteName,
      startedAt: now,
      updatedAt: now,
      status: 'active',
      lines: result.data.map(mapArticle),
      unknownScans: [],
    };
    await AsyncStorage.setItem(storageKey(siteId), JSON.stringify(campaign));
    return campaign;
  },

  async recordScan(siteId: string | number, identifier: string): Promise<{ campaign: InventoryCampaign; line?: InventoryLine; unknown: boolean }> {
    const campaign = await this.getActive(siteId);
    if (!campaign) throw new Error('Aucune campagne active');

    const normalized = normalize(identifier);
    const line = campaign.lines.find(item => normalize(item.reference) === normalized || normalize(item.barcode) === normalized);
    const now = new Date().toISOString();

    if (line) {
      line.countedQuantity += 1;
      line.lastScannedAt = now;
      return { campaign: await save(campaign), line, unknown: false };
    }

    const existingUnknown = campaign.unknownScans.find(item => normalize(item.identifier) === normalized);
    if (existingUnknown) {
      existingUnknown.count += 1;
      existingUnknown.lastScannedAt = now;
    } else {
      campaign.unknownScans.push({ identifier: identifier.trim(), count: 1, firstScannedAt: now, lastScannedAt: now });
    }

    return { campaign: await save(campaign), unknown: true };
  },

  async validate(siteId: string | number, signatureName: string): Promise<InventoryCampaign> {
    const campaign = await this.getActive(siteId);
    if (!campaign) throw new Error('Aucune campagne active');
    const signature = signatureName.trim();
    if (!signature) throw new Error('La signature du responsable est obligatoire');
    campaign.status = 'validated';
    campaign.signatureName = signature;
    campaign.signatureAt = new Date().toISOString();
    return save(campaign);
  },

  async generateGapReport(campaign: InventoryCampaign): Promise<void> {
    const summary = summarizeCampaign(campaign);
    const lineRows = (lines: InventoryLine[], kind: string) => lines.length === 0
      ? `<tr><td colspan="5">Aucun écart de type ${kind}.</td></tr>`
      : lines.map(line => `<tr><td>${escapeHtml(line.reference)}</td><td>${escapeHtml(line.name)}</td><td>${line.expectedQuantity}</td><td>${line.countedQuantity}</td><td>${line.countedQuantity - line.expectedQuantity}</td></tr>`).join('');
    const unknownRows = summary.unknownScans.length === 0
      ? '<tr><td colspan="2">Aucun code inconnu.</td></tr>'
      : summary.unknownScans.map(item => `<tr><td>${escapeHtml(item.identifier)}</td><td>${item.count}</td></tr>`).join('');

    const html = `<html><head><style>
      body { font-family: Helvetica, Arial, sans-serif; color: #17231d; padding: 28px; }
      h1 { color: #007a55; margin-bottom: 4px; } h2 { margin-top: 28px; color: #007a55; }
      .meta { color: #63736b; margin-bottom: 20px; } .stats { display: flex; gap: 12px; }
      .stat { background: #edf7f1; padding: 12px; flex: 1; } .stat strong { display: block; font-size: 22px; color: #007a55; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border-bottom: 1px solid #dce5df; padding: 8px; text-align: left; } th { background: #007a55; color: white; }
    </style></head><body>
      <h1>Rapport d'écarts d'inventaire</h1>
      <div class="meta">Site : ${escapeHtml(campaign.siteName)}<br>Campagne : ${escapeHtml(campaign.id)}<br>Validée par : ${escapeHtml(campaign.signatureName ?? 'Non validée')}</div>
      <div class="stats"><div class="stat"><strong>${summary.scannedLines} / ${summary.totalLines}</strong>lignes scannées</div><div class="stat"><strong>${summary.expectedUnits}</strong>stock théorique</div><div class="stat"><strong>${summary.countedUnits}</strong>stock compté</div></div>
      <h2>Articles manquants</h2><table><tr><th>Référence</th><th>Article</th><th>Théorique</th><th>Compté</th><th>Écart</th></tr>${lineRows(summary.missingLines, 'manquant')}</table>
      <h2>Articles en surplus</h2><table><tr><th>Référence</th><th>Article</th><th>Théorique</th><th>Compté</th><th>Écart</th></tr>${lineRows(summary.surplusLines, 'surplus')}</table>
      <h2>Codes inconnus</h2><table><tr><th>Code</th><th>Nombre de scans</th></tr>${unknownRows}</table>
    </body></html>`;

    const file = await generatePDF({ html, fileName: `inventaire_ecarts_${campaign.siteId}_${Date.now()}`, directory: 'Documents' });
    if (file.filePath) {
      await Share.open({ url: `file://${file.filePath}`, title: 'Rapport écarts inventaire', type: 'application/pdf' });
    }
  },
};

export default inventoryCampaignService;
