export type InvenBotMotionPreference = 'full' | 'reduced' | 'off';

export const invenBotMotionStorageKey = 'it-inventory-web-invenbot-motion';
export const invenBotMotionEvent = 'invenbot-motion-change';

export function readInvenBotMotionPreference(): InvenBotMotionPreference {
  try {
    const stored = window.localStorage.getItem(invenBotMotionStorageKey);
    if (stored === 'full' || stored === 'reduced' || stored === 'off') return stored;
  } catch {
    // Stockage indisponible : on garde la valeur par défaut.
  }
  return 'full';
}

export function applyInvenBotMotionPreference(value: InvenBotMotionPreference) {
  document.documentElement.dataset.invenbotMotion = value;
  window.dispatchEvent(new CustomEvent(invenBotMotionEvent, { detail: value }));
}

/** Enregistre et applique la préférence. Renvoie false si le stockage est indisponible. */
export function saveInvenBotMotionPreference(value: InvenBotMotionPreference): boolean {
  let saved = true;
  try {
    window.localStorage.setItem(invenBotMotionStorageKey, value);
  } catch {
    saved = false;
  }
  applyInvenBotMotionPreference(value);
  return saved;
}

/** Vrai si seuls les fondus et changements d'état statiques sont autorisés. */
export function isMotionReduced(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  const root = document.documentElement;
  if (root.classList.contains('reduce-motion')) return true;
  const pref = root.dataset.invenbotMotion;
  if (pref === 'reduced' || pref === 'off') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
