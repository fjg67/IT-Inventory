// ============================================
// STOCK ALERT EMAIL - Envoi alerte stock par email
// IT-Inventory Application
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_CONFIG } from '@/constants';
import { preferencesService } from './preferencesService';

const STORAGE_KEY = '@it-inventory/last_stock_alert_email';
const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Réinitialise le throttle pour permettre un envoi immédiat.
 * Utile pour les tests.
 */
export async function resetEmailThrottle(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  console.log('[stockAlertEmail] Throttle réinitialisé');
}

export interface ProductAlert {
  reference?: string;
  nom: string;
  emplacement?: string;
  stockActuel: number;
  stockMini: number;
}

/**
 * Génère le sujet de l'email d'alerte stock.
 */
function buildSubject(products: ProductAlert[], siteNom?: string): string {
  const sitePart = siteNom ? ` - ${siteNom}` : '';
  return `⚠️ Alerte stock : ${products.length} article${products.length > 1 ? 's' : ''} en rupture${sitePart}`;
}

/**
 * Génère le contenu HTML de l'email avec TOUS les articles en alerte.
 */
function buildHtmlContent(products: ProductAlert[], siteNom?: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows = products
    .map((p) => {
      const ratio = p.stockMini > 0 ? (p.stockActuel / p.stockMini) * 100 : 0;
      const isZero = p.stockActuel === 0;
      const badgeColor = isZero ? '#DC2626' : ratio < 50 ? '#F59E0B' : '#F97316';
      const badgeText = isZero ? 'Rupture' : 'Stock bas';
      return `
        <tr style="border-bottom: 1px solid #F3F4F6;">
          <td style="padding: 12px 16px; font-weight: 600; color: #111827;">${p.nom}</td>
          <td style="padding: 12px 16px; color: #6B7280; font-family: monospace;">${p.reference ?? '—'}</td>
          <td style="padding: 12px 16px; color: #6B7280;">${p.emplacement ?? '—'}</td>
          <td style="padding: 12px 16px; text-align: center;">
            <span style="color: ${badgeColor}; font-weight: 700; font-size: 16px;">${p.stockActuel}</span>
          </td>
          <td style="padding: 12px 16px; text-align: center; color: #6B7280;">${p.stockMini}</td>
          <td style="padding: 12px 16px; text-align: center;">
            <span style="background: ${badgeColor}15; color: ${badgeColor}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${badgeText}</span>
          </td>
        </tr>`;
    })
    .join('');

  const ruptureCount = products.filter((p) => p.stockActuel === 0).length;
  const basCount = products.length - ruptureCount;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563EB, #7C3AED); border-radius: 16px 16px 0 0; padding: 32px 24px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 8px;">⚠️</div>
      <h1 style="color: #FFFFFF; font-size: 22px; margin: 0 0 4px 0;">Alerte Stock IT-Inventory</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">${date}</p>
      ${siteNom ? `<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 600;">📍 ${siteNom}</p>` : ''}
    </div>

    <!-- Résumé -->
    <div style="background: #FFFFFF; padding: 24px; border-bottom: 1px solid #E5E7EB;">
      <div style="display: flex; gap: 16px; text-align: center;">
        <div style="flex: 1; background: #FEF2F2; border-radius: 12px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #DC2626;">${products.length}</div>
          <div style="font-size: 12px; color: #991B1B; margin-top: 4px;">Article${products.length > 1 ? 's' : ''} en alerte</div>
        </div>
        ${ruptureCount > 0 ? `
        <div style="flex: 1; background: #FEF2F2; border-radius: 12px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #DC2626;">${ruptureCount}</div>
          <div style="font-size: 12px; color: #991B1B; margin-top: 4px;">En rupture totale</div>
        </div>` : ''}
        ${basCount > 0 ? `
        <div style="flex: 1; background: #FFFBEB; border-radius: 12px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #F59E0B;">${basCount}</div>
          <div style="font-size: 12px; color: #92400E; margin-top: 4px;">Stock bas</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Tableau des articles -->
    <div style="background: #FFFFFF; border-radius: 0 0 16px 16px; overflow: hidden;">
      <div style="padding: 20px 24px 12px;">
        <h2 style="font-size: 16px; color: #111827; margin: 0;">Détail des articles</h2>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
            <th style="padding: 10px 16px; text-align: left; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Article</th>
            <th style="padding: 10px 16px; text-align: left; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Réf.</th>
            <th style="padding: 10px 16px; text-align: left; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Emplacement</th>
            <th style="padding: 10px 16px; text-align: center; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Stock</th>
            <th style="padding: 10px 16px; text-align: center; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Mini</th>
            <th style="padding: 10px 16px; text-align: center; color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <!-- Footer -->
      <div style="padding: 20px 24px; text-align: center; border-top: 1px solid #F3F4F6;">
        <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
          Email envoyé automatiquement par IT-Inventory • ${date}
        </p>
      </div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Envoie un email d'alerte stock via l'Edge Function Supabase.
 * Inclut TOUS les articles en alerte dans un tableau récapitulatif.
 * Limité à une fois par 24h (throttle).
 */
export async function sendStockAlertEmailIfNeeded(
  products: ProductAlert[],
  siteNom?: string
): Promise<{ sent: boolean; reason?: string }> {
  if (!products.length) return { sent: false, reason: 'Aucun produit en alerte' };

  // Vérifier si les notifications sont activées dans les préférences
  if (!preferencesService.areNotificationsEnabled()) {
    return { sent: false, reason: 'Notifications désactivées par l\'utilisateur' };
  }

  try {
    const last = await AsyncStorage.getItem(STORAGE_KEY);
    const lastTime = last ? parseInt(last, 10) : 0;
    if (Date.now() - lastTime < THROTTLE_MS) {
      return { sent: false, reason: 'Dernier envoi il y a moins de 24h' };
    }

    const url = `${SUPABASE_CONFIG.url}/functions/v1/send-stock-alert-email`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
      body: JSON.stringify({
        // Contenu HTML pré-formaté avec TOUS les articles
        subject: buildSubject(products, siteNom),
        htmlContent: buildHtmlContent(products, siteNom),
        // Données brutes (rétro-compatibilité Edge Function)
        products: products.map((p) => ({
          reference: p.reference,
          nom: p.nom,
          stockActuel: p.stockActuel ?? 0,
          stockMini: p.stockMini ?? 0,
        })),
        siteNom: siteNom ?? undefined,
        totalAlerts: products.length,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }

    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
    return { sent: true };
  } catch (e) {
    console.warn('[stockAlertEmail]', e);
    throw e;
  }
}
