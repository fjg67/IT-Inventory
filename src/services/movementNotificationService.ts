import { Alert, Platform, PermissionsAndroid } from 'react-native';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';

const STOCK_MOVEMENTS_CHANNEL_ID = 'stock-movements-v3';

interface MovementNotificationPayload {
  movementId?: string;
  articleName: string;
  stockLocation: string;
  quantity: number;
  movementType: 'entree' | 'sortie' | 'ajustement' | 'transfert';
  technicianInitials: string;
  happenedAt?: Date;
}

const movementTypeLabel: Record<MovementNotificationPayload['movementType'], string> = {
  entree: 'Entrée',
  sortie: 'Sortie',
  ajustement: 'Ajustement',
  transfert: 'Transfert',
};

const movementTypeColor: Record<MovementNotificationPayload['movementType'], string> = {
  entree: '#18865B',
  sortie: '#D92D55',
  ajustement: '#C77900',
  transfert: '#4267B2',
};

function formatQuantity(type: MovementNotificationPayload['movementType'], quantity: number): string {
  if (type === 'sortie') return `-${Math.abs(quantity)}`;
  if (type === 'transfert') return quantity < 0 ? `-${Math.abs(quantity)}` : `+${Math.abs(quantity)}`;
  return `+${Math.abs(quantity)}`;
}

function buildTitle(payload: MovementNotificationPayload): string {
  const typeLabel = movementTypeLabel[payload.movementType];
  return `${typeLabel} de stock`;
}

function buildLines(payload: MovementNotificationPayload): string[] {
  const qty = formatQuantity(payload.movementType, payload.quantity);

  return [
    `Article  ·  ${payload.articleName}`,
    `Stock    ·  ${payload.stockLocation}`,
    `Quantité ·  ${qty}`,
    `Technicien ·  ${payload.technicianInitials}`,
  ];
}

function getTechnicianInitials(prenom?: string, nom?: string): string {
  const p = (prenom ?? '').trim().charAt(0);
  const n = (nom ?? '').trim().charAt(0);
  const initials = `${p}${n}`.toUpperCase();
  return initials || '??';
}

function getInitialsFromDisplayName(name?: string): string {
  const clean = (name ?? '').trim();
  if (!clean) return '??';
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = (parts.length > 1 ? parts[parts.length - 1] : parts[0])?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase() || '??';
}

const recentlyNotifiedMovementIds = new Map<string, number>();
const RECENT_CACHE_MS = 5 * 60 * 1000;

function cleanupRecentCache(now: number): void {
  for (const [id, ts] of recentlyNotifiedMovementIds.entries()) {
    if (now - ts > RECENT_CACHE_MS) {
      recentlyNotifiedMovementIds.delete(id);
    }
  }
}

function shouldNotify(movementId?: string): boolean {
  if (!movementId) return true;
  const now = Date.now();
  cleanupRecentCache(now);
  if (recentlyNotifiedMovementIds.has(movementId)) return false;
  recentlyNotifiedMovementIds.set(movementId, now);
  return true;
}

export const movementNotificationService = {
  getTechnicianInitials,
  getInitialsFromDisplayName,
  async notify(payload: MovementNotificationPayload): Promise<void> {
    if (!shouldNotify(payload.movementId)) return;

    const lines = buildLines(payload);
    const message = lines.join('\n');
    const title = buildTitle(payload);

    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Notifications desactivees',
            'Active les notifications Android pour recevoir les alertes de mouvements.',
          );
          return;
        }
      }

      const channelId = await notifee.createChannel({
        id: STOCK_MOVEMENTS_CHANNEL_ID,
        name: 'Mouvements de stock',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus === 0) {
        Alert.alert(
          'Notifications bloquees',
          'Les notifications sont bloquees pour IT-Inventory sur cet appareil.',
        );
        return;
      }

      await notifee.displayNotification({
        title,
        body: message,
        android: {
          channelId,
          sound: 'default',
          color: movementTypeColor[payload.movementType],
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
          timestamp: (payload.happenedAt ?? new Date()).getTime(),
          showTimestamp: true,
          style: {
            type: AndroidStyle.INBOX,
            lines,
            summary: `IT-Inventory · ${payload.stockLocation}`,
          },
        },
      });
      return;
    }

    await notifee.displayNotification({
      id: payload.movementId,
      title,
      body: message,
      data: payload.movementId ? { movementId: payload.movementId } : undefined,
      ios: {
        sound: 'default',
        foregroundPresentationOptions: { alert: true, sound: true, badge: false },
      },
    });
  },
};

export default movementNotificationService;
