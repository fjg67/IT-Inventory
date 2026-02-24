// ============================================
// DATE UTILS - Heure Paris (Europe/Paris)
// IT-Inventory Application
// ============================================

const PARIS_TZ = 'Europe/Paris';

/**
 * Heure au format HH:MM en fuseau Paris
 */
export function formatTimeParis(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    timeZone: PARIS_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Date + heure complète en fuseau Paris (fr-FR)
 */
export function formatDateTimeParis(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    timeZone: PARIS_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Date seule en Paris (pour affichage relatif ou liste)
 */
export function formatDateParis(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    timeZone: PARIS_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

/**
 * Pour libellés relatifs (Aujourd'hui, Hier, etc.) en se basant sur la date en Paris
 */
export function formatRelativeDateParis(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, day: 'numeric', month: 'numeric', year: 'numeric' });
  const targetStr = formatter.format(d);
  const todayStr = formatter.format(new Date());
  if (targetStr === todayStr) return "Aujourd'hui";

  const target = new Date(d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / 86400000);

  if (diffDays === 1) return 'Hier';
  if (diffDays > 0 && diffDays < 7) return `Il y a ${diffDays} jours`;
  return d.toLocaleDateString('fr-FR', { timeZone: PARIS_TZ, day: '2-digit', month: 'long', year: 'numeric' });
}
