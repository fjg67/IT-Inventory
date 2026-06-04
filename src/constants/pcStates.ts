import { OBSIDIAN_COLORS } from './colors';
import { Article } from '@/types';

export type PCStateKey = 'a_chaud' | 'a_reusiner' | 'en_usinage' | 'disponible' | 'envoye' | 'en_panne';

export interface PCStateMeta {
  key: PCStateKey;
  label: string;
  icon: string;
  color: string;
  subtle: string;
  bg: string;
  border: string;
  text: string;
}

export const PC_STATE_COLORS: Record<PCStateKey, PCStateMeta> = {
  a_chaud: {
    key: 'a_chaud',
    label: 'À chaud',
    icon: 'flash-outline',
    color: OBSIDIAN_COLORS.green_light,
    subtle: 'rgba(34, 197, 94, 0.10)',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.25)',
    text: OBSIDIAN_COLORS.green_light,
  },
  a_reusiner: {
    key: 'a_reusiner',
    label: 'À reusiner',
    icon: 'wrench-outline',
    color: OBSIDIAN_COLORS.warning,
    subtle: 'rgba(245, 158, 11, 0.10)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    text: OBSIDIAN_COLORS.warning,
  },
  en_usinage: {
    key: 'en_usinage',
    label: 'En usinage',
    icon: 'cog-outline',
    color: OBSIDIAN_COLORS.warning,
    subtle: 'rgba(245, 158, 11, 0.10)',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.25)',
    text: OBSIDIAN_COLORS.warning,
  },
  disponible: {
    key: 'disponible',
    label: 'Disponible',
    icon: 'check-circle-outline',
    color: OBSIDIAN_COLORS.info,
    subtle: 'rgba(59, 130, 246, 0.10)',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)',
    text: OBSIDIAN_COLORS.info,
  },
  envoye: {
    key: 'envoye',
    label: 'Envoyé',
    icon: 'send-outline',
    color: OBSIDIAN_COLORS.purple,
    subtle: 'rgba(139, 92, 246, 0.10)',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
    text: OBSIDIAN_COLORS.purple,
  },
  en_panne: {
    key: 'en_panne',
    label: 'En panne',
    icon: 'laptop-off',
    color: '#EF4444',
    subtle: 'rgba(239, 68, 68, 0.12)',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.30)',
    text: '#EF4444',
  },
};

export const PC_STATE_ORDER: PCStateKey[] = ['a_chaud', 'a_reusiner', 'en_usinage', 'disponible', 'en_panne', 'envoye'];

const normalize = (value?: string) => (value ?? '').toLowerCase().trim();

export const getPCStateKeyFromLabel = (label?: string): PCStateKey | null => {
  const value = normalize(label);
  if (!value) return null;
  if (value.includes('panne')) return 'en_panne';
  if (value.includes('envoy')) return 'envoye';
  if (value.includes('disponible')) return 'disponible';
  if (value.includes('usinage') || value.includes('en train d\'usiner')) return 'en_usinage';
  if (value.includes('reusin') || value.includes('recondition')) return 'a_reusiner';
  if (value.includes('chaud')) return 'a_chaud';
  return null;
};

export const getPCStateMeta = (label?: string): PCStateMeta => {
  const key = getPCStateKeyFromLabel(label) ?? 'a_reusiner';
  return PC_STATE_COLORS[key];
};

export const getPCStateFromArticle = (article: Article): PCStateMeta => {
  const fromDescription = getPCStateMeta(article.description);
  if (fromDescription.key !== 'a_reusiner' || normalize(article.description).includes('reusin') || normalize(article.description).includes('chaud') || normalize(article.description).includes('envoy') || normalize(article.description).includes('disponible') || normalize(article.description).includes('usinage')) {
    return fromDescription;
  }

  const values = [article.sousType, article.typeArticle, article.famille]
    .filter((value): value is string => !!value)
    .map((value) => value.toLowerCase());

  if (values.some((value) => value.includes('envoy'))) return PC_STATE_COLORS.envoye;
  if (values.some((value) => value.includes('disponible'))) return PC_STATE_COLORS.disponible;
  if (values.some((value) => value.includes('usinage'))) return PC_STATE_COLORS.en_usinage;
  if (values.some((value) => value.includes('reusin') || value.includes('recondition'))) return PC_STATE_COLORS.a_reusiner;
  return PC_STATE_COLORS.a_chaud;
};

export const formatPCDate = (value?: string | Date): string => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

export const isPCArticle = (article: Article): boolean => {
  const values = [article.typeArticle, article.sousType, article.famille]
    .filter((value): value is string => !!value)
    .map((value) => value.toLowerCase());
  return values.some((value) =>
    value === 'pc' ||
    value.includes('portable agence') ||
    value.includes('portable siège') ||
    value.includes('portable siege') ||
    value.includes('pc portable') ||
    value.includes('pc disponible') ||
    value.includes('pc en panne') ||
    value.includes('pc envoye') ||
    value.includes('pc envoyé'),
  );
};