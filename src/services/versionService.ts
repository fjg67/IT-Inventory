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
  updateAvailable?: boolean;
  latestVersion?: string;
  minVersion?: string;
  updateUrl?: string;
  releaseNotes?: string[];
}

function parseReleaseNotes(value?: string): string[] | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const notes = parsed
        .map((item) => String(item).trim())
        .filter(Boolean);
      return notes.length ? notes : undefined;
    }
  } catch {
    // Value is not JSON, continue with line-based parsing.
  }

  const notes = trimmed
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^[\-•\s]+/, '').trim())
    .filter(Boolean);

  return notes.length ? notes : undefined;
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
      .select('key, value')
      .in('key', ['min_app_version', 'latest_app_version', 'update_url', 'release_notes']);

    if (error || !data?.length) {
      // Si la table n'existe pas ou pas de config, on laisse passer
      return { updateRequired: false };
    }

    const configMap = data.reduce<Record<string, string>>((acc, row) => {
      if (typeof row.key === 'string' && typeof row.value === 'string') {
        acc[row.key] = row.value;
      }
      return acc;
    }, {});

    const minVersion = configMap.min_app_version;
    const latestVersion = configMap.latest_app_version;

    const updateUrl = configMap.update_url || APP_CONFIG.playStoreUrl;
    const releaseNotes = parseReleaseNotes(configMap.release_notes);

    const updateRequired = Boolean(minVersion) && isVersionOutdated(APP_CONFIG.version, minVersion);
    const updateAvailable = Boolean(latestVersion) && isVersionOutdated(APP_CONFIG.version, latestVersion);

    return {
      updateRequired,
      updateAvailable,
      latestVersion,
      minVersion,
      updateUrl,
      releaseNotes,
    };
  } catch {
    // En cas d'erreur réseau, on ne bloque pas
    return { updateRequired: false };
  }
}
