import { Alert, Linking } from 'react-native';
import { APP_CONFIG } from '@/constants/config';

export async function openAppUpdatePage(updateUrl?: string): Promise<boolean> {
  const urls = Array.from(new Set([
    updateUrl?.trim(),
    APP_CONFIG.playStoreUrl,
    'market://details?id=com.itinventory',
  ].filter((url): url is string => Boolean(url))));

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // Try the next supported store URL.
    }
  }

  return false;
}

export function showUpdateLinkError(): void {
  Alert.alert(
    'Mise à jour indisponible',
    'Le Play Store n’a pas pu être ouvert. Vérifiez votre connexion puis réessayez.',
  );
}