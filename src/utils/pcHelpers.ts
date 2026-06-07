import { Article } from '@/types';

interface PCDisplayCandidate {
  hostname?: string | null;
  nom?: string | null;
  reference?: string | null;
  display_name?: string | null;
  displayName?: string | null;
}

const isAllUpper = (value: string) => /^[A-Z0-9-]+$/.test(value);

const normalizeWordCase = (word: string): string => {
  if (!word) return word;
  if (word.length <= 3 && isAllUpper(word)) return word;
  if (isAllUpper(word)) return `${word[0]}${word.slice(1).toLowerCase()}`;
  return word;
};

export const cleanModelName = (model?: string | null): string => {
  const source = (model ?? '').trim();
  if (!source) return '';

  const words = source.split(/\s+/);
  const deduplicated: string[] = [];

  for (const rawWord of words) {
    const normalizedWord = normalizeWordCase(rawWord);
    const prevWord = deduplicated[deduplicated.length - 1];
    if (prevWord?.toLowerCase() !== normalizedWord.toLowerCase()) {
      deduplicated.push(normalizedWord);
    }
  }

  return deduplicated.join(' ');
};

export const getPCDisplayName = (pc: PCDisplayCandidate): string => {
  const customName = pc.display_name?.trim() || pc.displayName?.trim();
  if (customName) return customName;
  return pc.hostname?.trim() || pc.nom?.trim() || pc.reference?.trim() || 'PC sans nom';
};

export const hasPCDisplayName = (pc: PCDisplayCandidate): boolean => {
  return Boolean(pc.display_name?.trim() || pc.displayName?.trim());
};

export const getPCHostname = (pc: PCDisplayCandidate): string => {
  return pc.hostname?.trim() || pc.nom?.trim() || pc.reference?.trim() || 'PC inconnu';
};

export const getPCAsset = (pc: Pick<Article, 'barcode' | 'reference'>): string => {
  return (pc.barcode ?? '').trim() || (pc.reference ?? '').trim() || 'Sans asset';
};
