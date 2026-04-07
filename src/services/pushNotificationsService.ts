import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { SUPABASE_CONFIG } from '@/constants';
import { getSupabaseClient, tables } from '@/api/supabase';

const DEVICE_ID_STORAGE_KEY = '@it-inventory/device-id';
const PUSH_ENABLED_STORAGE_KEY = '@it-inventory/push-enabled';
const STOCK_MOVEMENTS_CHANNEL_ID = 'stock-movements-v2';

let tokenRefreshUnsubscribe: (() => void) | null = null;
let startedForUserId: string | null = null;
let notificationPromptVisible = false;

function promptToEnableNotifications(): void {
  if (notificationPromptVisible) return;
  notificationPromptVisible = true;

  Alert.alert(
    'Activer les notifications',
    'Les notifications sont desactivees. Active-les dans les reglages pour recevoir les alertes de mouvements meme quand l\'application est fermee.',
    [
      {
        text: 'Plus tard',
        style: 'cancel',
        onPress: () => {
          notificationPromptVisible = false;
        },
      },
      {
        text: 'Ouvrir les reglages',
        onPress: () => {
          notificationPromptVisible = false;
          Linking.openSettings().catch((error) => {
            console.warn('[pushNotificationsService] open settings error:', error);
          });
        },
      },
    ],
    {
      cancelable: true,
      onDismiss: () => {
        notificationPromptVisible = false;
      },
    },
  );
}

function generateDeviceId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 12);
  return `dev-${Platform.OS}-${ts}-${rnd}`;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;
  const created = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
  return created;
}

async function getLocalPushEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(PUSH_ENABLED_STORAGE_KEY);
  if (raw == null) return true;
  return raw === 'true';
}

async function setLocalPushEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PUSH_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
}

async function saveTokenForUser(userId: string | null, token: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_CONFIG.anonKey,
  };
  headers.Authorization = `Bearer ${session?.access_token ?? SUPABASE_CONFIG.anonKey}`;

  const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/register-push-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      deviceId,
      userId: userId ?? undefined,
      token,
      platform: Platform.OS,
      enabled: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn(`[pushNotificationsService] register-push-token failed: HTTP ${response.status} ${body}`);

    // Fallback direct DB write if edge function is not deployed/available
    let { error } = await supabase.from(tables.pushDeviceTokens).upsert(
      {
        id: deviceId,
        userId,
        token,
        platform: Platform.OS,
        enabled: true,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
    if (error) {
      // Compat fallback: si la colonne enabled n'existe pas encore
      const fallbackNoEnabled = await supabase.from(tables.pushDeviceTokens).upsert(
        {
          id: deviceId,
          userId,
          token,
          platform: Platform.OS,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      error = fallbackNoEnabled.error ?? error;
    }

    if (error) {
      // Fallback final: retry sans userId si contrainte FK bloque
      const retry = await supabase.from(tables.pushDeviceTokens).upsert(
        {
          id: deviceId,
          userId: null,
          token,
          platform: Platform.OS,
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (retry.error) {
        throw new Error(retry.error.message);
      }
    }
  }
}

export const pushNotificationsService = {
  async getDeviceId(): Promise<string> {
    return getOrCreateDeviceId();
  },

  async isPushEnabledForDevice(): Promise<boolean> {
    const localEnabled = await getLocalPushEnabled();
    if (!localEnabled) return false;

    const deviceId = await getOrCreateDeviceId();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(tables.pushDeviceTokens)
      .select('enabled')
      .eq('id', deviceId)
      .maybeSingle();

    if (error) {
      console.warn('[pushNotificationsService] isPushEnabledForDevice error:', error.message);
      return true;
    }

    const enabled = (data as any)?.enabled;
    return enabled !== false;
  },

  async setPushEnabledForDevice(enabled: boolean, userId?: string): Promise<void> {
    const deviceId = await getOrCreateDeviceId();
    const supabase = getSupabaseClient();

    await setLocalPushEnabled(enabled);

    if (enabled) {
      await this.start(userId);
      const { error } = await supabase
        .from(tables.pushDeviceTokens)
        .update({ enabled: true, updatedAt: new Date().toISOString() })
        .eq('id', deviceId);
      if (error) {
        console.warn('[pushNotificationsService] set enabled=true update warning:', error.message);
      }
      return;
    }

    this.stop();
    const { error } = await supabase
      .from(tables.pushDeviceTokens)
      .update({ enabled: false, updatedAt: new Date().toISOString() })
      .eq('id', deviceId);
    if (error) {
      // Compat fallback: si la colonne enabled n'existe pas encore, supprimer le token du device.
      const fallback = await supabase
        .from(tables.pushDeviceTokens)
        .delete()
        .eq('id', deviceId);
      if (fallback.error) {
        throw new Error(fallback.error.message);
      }
    }
  },

  async start(userId?: string): Promise<void> {
    const resolvedUserId = userId && userId.trim().length > 0 ? userId : null;

    const isEnabledForDevice = await this.isPushEnabledForDevice();
    if (!isEnabledForDevice) {
      console.log('[pushNotificationsService] Push disabled for this device');
      return;
    }

    if (startedForUserId === (resolvedUserId ?? '__no_user__') && tokenRefreshUnsubscribe) return;

    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('[pushNotificationsService] POST_NOTIFICATIONS permission denied');
            promptToEnableNotifications();
            return;
          } else {
            console.log('[pushNotificationsService] POST_NOTIFICATIONS granted');
          }
        }

        await notifee.createChannel({
          id: STOCK_MOVEMENTS_CHANNEL_ID,
          name: 'Mouvements de stock',
          importance: AndroidImportance.HIGH,
          sound: 'default',
        });

        const settings = await notifee.requestPermission();
        if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
          console.warn('[pushNotificationsService] notifee permission denied');
          promptToEnableNotifications();
          return;
        }
      }

      await messaging().registerDeviceForRemoteMessages();
      const messagingStatus = await messaging().requestPermission();
      if (
        messagingStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
        messagingStatus !== messaging.AuthorizationStatus.PROVISIONAL
      ) {
        console.warn('[pushNotificationsService] messaging permission denied');
        promptToEnableNotifications();
        return;
      }

      const token = await messaging().getToken();
      if (!token) {
        throw new Error('FCM token vide');
      }
      console.log('[pushNotificationsService] FCM token acquired:', token.slice(0, 16));
      await saveTokenForUser(resolvedUserId, token);
      console.log('[pushNotificationsService] Token registered for user:', resolvedUserId ?? 'null');

      if (tokenRefreshUnsubscribe) {
        tokenRefreshUnsubscribe();
        tokenRefreshUnsubscribe = null;
      }

      tokenRefreshUnsubscribe = messaging().onTokenRefresh((nextToken: string) => {
        saveTokenForUser(resolvedUserId, nextToken).catch((error) => {
          console.warn('[pushNotificationsService] token refresh save error:', error);
        });
      });
      startedForUserId = resolvedUserId ?? '__no_user__';
    } catch (error) {
      startedForUserId = null;
      throw error;
    }
  },

  stop(): void {
    startedForUserId = null;
    if (tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe();
      tokenRefreshUnsubscribe = null;
    }
  },

  async handleForegroundMessage(_message: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    // Les notifications foreground sont déjà gérées via Realtime + Notifee.
  },
};

export default pushNotificationsService;
