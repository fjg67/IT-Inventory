// ============================================
// PC STATUS NOTIFICATION SERVICE
// IT-Inventory Application
// ============================================

import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { Article } from '@/types';

const PC_STATUS_CHANNEL_ID = 'pc-status-changes-v1';

export type PCNextStatus = 'À chaud' | 'À reusiner' | 'Disponible' | 'Envoyé';

export interface PCStatusNotificationPayload {
  article: Article;
  nextStatus: PCNextStatus;
  technicienName: string;
}

const STATUS_EMOJI: Record<PCNextStatus, string> = {
  'À chaud': '🔥',
  'À reusiner': '🔧',
  'Disponible': '✅',
  'Envoyé': '📤',
};

const STATUS_LABEL: Record<PCNextStatus, string> = {
  'À chaud': 'À chaud',
  'À reusiner': 'À reusiner',
  'Disponible': 'Disponible',
  'Envoyé': 'Envoyé',
};

function buildTitle(nextStatus: PCNextStatus): string {
  const emoji = STATUS_EMOJI[nextStatus];
  const label = STATUS_LABEL[nextStatus];
  return `${emoji} PC ${label}`;
}

function buildBody(payload: PCStatusNotificationPayload): string {
  const { article, nextStatus, technicienName } = payload;

  const hostname = article.nom?.trim() || article.reference?.trim() || 'Inconnu';
  const asset = article.barcode?.trim() || '—';
  const categorie = article.sousType?.trim() || '—';
  const modele = article.modele?.trim() || '—';
  const marque = article.marque?.trim() || '';
  const emplacement = article.emplacement?.trim() || '—';

  const modeleLine = marque && modele !== '—' ? `${marque} ${modele}` : modele;

  const lines: string[] = [
    `Hostname : ${hostname}`,
    `Asset    : ${asset}`,
    `Catégorie: ${categorie}`,
    `Modèle   : ${modeleLine}`,
    `Emplacement: ${emplacement}`,
    `Statut   → ${nextStatus}`,
    `Technicien: ${technicienName}`,
  ];

  return lines.join('\n');
}

export async function notifyPCStatusChange(
  payload: PCStatusNotificationPayload,
): Promise<void> {
  try {
    const channelId = await notifee.createChannel({
      id: PC_STATUS_CHANNEL_ID,
      name: 'Changements de statut PC',
      importance: AndroidImportance.HIGH,
    });

    const title = buildTitle(payload.nextStatus);
    const body = buildBody(payload);

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body,
        },
        showTimestamp: true,
        pressAction: { id: 'default' },
      },
    });
  } catch (error) {
    // Ne pas bloquer le flux principal si la notif échoue
    console.warn('[pcStatusNotificationService] Erreur notification:', error);
  }
}
