import 'react-native-url-polyfill/auto';
/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const STOCK_MOVEMENTS_CHANNEL_ID = 'stock-movements-v2';

// Crée le canal Android une seule fois (persisté sur l'appareil)
async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: STOCK_MOVEMENTS_CHANNEL_ID,
      name: 'Mouvements de stock',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

// Gestion des messages FCM quand l'app est en background ou fermée
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // On s'assure que le canal existe avant que Android affiche la notification
  await ensureNotificationChannel();

  // Si le message est data-only (pas de champ notification), on affiche manuellement
  if (!remoteMessage.notification && remoteMessage.data?.notifTitle) {
    const title = String(remoteMessage.data.notifTitle ?? '');
    const body = String(remoteMessage.data.notifBody ?? '');
    if (Platform.OS === 'android') {
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: STOCK_MOVEMENTS_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          pressAction: { id: 'default' },
        },
        data: {
          movementId: String(remoteMessage.data.movementId ?? ''),
          movementType: String(remoteMessage.data.movementType ?? ''),
        },
      });
    }
  }
});

// Gestion des interactions sur les notifications Notifee en background
notifee.onBackgroundEvent(async ({ type }) => {
  // EventType.PRESS (1) : l'utilisateur appuie sur la notification → l'app s'ouvre automatiquement
  // Aucune action supplémentaire nécessaire ici
});

AppRegistry.registerComponent(appName, () => App);
