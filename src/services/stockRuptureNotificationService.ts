import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { predictiveService } from '@/services/predictiveService';

const CACHE_KEY = '@it-inventory/stock-rupture-alerts';
const CHANNEL_ID = 'stock-rupture-alerts-v1';

export const stockRuptureNotificationService = {
  async checkAndNotify(siteId: string | number): Promise<void> {
    const alerts = await predictiveService.getPredictiveAlerts(siteId, 30, 7);
    if (!alerts.length) return;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) as Record<string, string> : {};
    const channelId = await notifee.createChannel({ id: CHANNEL_ID, name: 'Ruptures imminentes', importance: AndroidImportance.HIGH, sound: 'default' });
    for (const alert of alerts) {
      const signature = `${alert.currentStock}|${alert.daysRemaining}`;
      if (cache[String(alert.articleId)] === signature) continue;
      await notifee.displayNotification({ title: `Rupture imminente · ${alert.articleNom}`, body: `${alert.currentStock} unité(s) restantes, risque de rupture dans ${alert.daysRemaining} jour(s).`, android: { channelId, smallIcon: 'ic_launcher', pressAction: { id: 'default' } } });
      cache[String(alert.articleId)] = signature;
    }
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  },
};

export default stockRuptureNotificationService;
