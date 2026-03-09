// ============================================
// VERSION SERVICE - Force Update Check
// IT-Inventory Application
// ============================================

import { getSupabaseClient } from '@/api/supabase';
import { APP_CONFIG } from '@/constants';

/**
 * Compare deux versions semver (ex: "1.7" vs "1.8").
 * Retourne true si current < minimum.
 */
function isVersionOutdated(current: string, minimum: string): boolean {
  const cur = current.split('.').map(Number);
  const min = minimum.split('.').map(Number);
  const len = Math.max(cur.length, min.length);
  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0;
    const m = min[i] ?? 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
}

export interface VersionCheckResult {
  updateRequired: boolean;
  minVersion?: string;
}

/**
 * Vérifie auprès de Supabase si la version actuelle de l'app est suffisante.
 * Lit la clé "min_app_version" dans la table "AppConfig".
 */
export async function checkAppVersion(): Promise<VersionCheckResult> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('AppConfig')
      .select('value')
      .eq('key', 'min_app_version')
      .maybeSingle();

    if (error || !data?.value) {
      // Si la table n'existe pas ou pas de config, on laisse passer
      return { updateRequired: false };
    }

    const minVersion = data.value as string;
    const outdated = isVersionOutdated(APP_CONFIG.version, minVersion);
    return { updateRequired: outdated, minVersion };
  } catch {
    // En cas d'erreur réseau, on ne bloque pas
    return { updateRequired: false };
  }
}
