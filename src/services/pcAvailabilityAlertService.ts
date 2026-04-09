import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, AndroidStyle, AuthorizationStatus } from '@notifee/react-native';
import { articleRepository } from '@/database';
import { Article, ArticleFilters } from '@/types';

const PC_ALERT_CHANNEL_ID = 'pc-availability-alerts-v1';
const PC_ALERT_CACHE_KEY = '@it-inventory/pc-availability-alert-cache-v1';
const PC_ALERT_THRESHOLD_DAYS = 21;
const PC_FETCH_LIMIT = 1000;

type AlertCache = Record<string, string>;

function isPCAvailable(article: Article): boolean {
  const statusRaw = (article.description ?? '').toLowerCase();
  const familyRaw = (article.famille ?? '').toLowerCase();
  return statusRaw.includes('disponible') || familyRaw.includes('pc disponible');
}

function isOlderThanThreshold(date: Date): boolean {
  const ageMs = Date.now() - date.getTime();
  return ageMs >= PC_ALERT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

function buildArticleSignature(article: Article): string {
  return `${article.dateModification.toISOString()}|${article.description ?? ''}|${article.famille ?? ''}`;
}

function getNotificationBody(article: Article): string {
  const location = article.emplacement?.trim() || 'Emplacement non renseigné';
  return [
    `PC: ${article.nom}`,
    `Lieu de stock: ${location}`,
    '',
    'Ce poste est disponible depuis 3 semaines.',
    'Action recommandee: le remettre a chaud.',
  ].join('\n');
}

async function loadCache(): Promise<AlertCache> {
  try {
    const raw = await AsyncStorage.getItem(PC_ALERT_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as AlertCache;
    return {};
  } catch {
    return {};
  }
}

async function saveCache(cache: AlertCache): Promise<void> {
  await AsyncStorage.setItem(PC_ALERT_CACHE_KEY, JSON.stringify(cache));
}

async function ensurePermissionsAndChannel(): Promise<string | null> {
  const settings = await notifee.requestPermission();
  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (!granted) return null;

  const channelId = await notifee.createChannel({
    id: PC_ALERT_CHANNEL_ID,
    name: 'Alertes parc PC',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  return channelId;
}

function buildPCFilters(): ArticleFilters {
  return {
    searchQuery: '',
    categorieId: null,
    stockFaible: false,
    codeFamille: null,
    famille: null,
    typeArticle: ['PC'],
    sousType: null,
    marque: null,
    emplacement: null,
  };
}

export const pcAvailabilityAlertService = {
  async checkAndNotify(siteId: string | number): Promise<void> {
    if (siteId == null) return;

    const channelId = await ensurePermissionsAndChannel();
    if (!channelId) return;

    const result = await articleRepository.search(siteId, buildPCFilters(), 0, PC_FETCH_LIMIT);
    const eligibleArticles = result.data.filter((article) => {
      return isPCAvailable(article) && isOlderThanThreshold(article.dateModification);
    });

    if (eligibleArticles.length === 0) return;

    const cache = await loadCache();
    let cacheChanged = false;

    for (const article of eligibleArticles) {
      const articleId = String(article.id);
      const signature = buildArticleSignature(article);
      if (cache[articleId] === signature) continue;

      await notifee.displayNotification({
        title: 'Alerte PC disponible depuis 3 semaines',
        body: `${article.nom} - ${article.emplacement?.trim() || 'Lieu non renseigne'}`,
        android: {
          channelId,
          pressAction: { id: 'default' },
          smallIcon: 'ic_launcher',
          style: {
            type: AndroidStyle.BIGTEXT,
            text: getNotificationBody(article),
          },
        },
      });

      cache[articleId] = signature;
      cacheChanged = true;
    }

    if (cacheChanged) {
      await saveCache(cache);
    }
  },
};

export default pcAvailabilityAlertService;
