import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, tables } from '@/api/supabase';
import { movementNotificationService } from '@/services/movementNotificationService';
import { AuthService } from '@/services/authService';
import type { Technicien } from '@/types';

type MovementRow = {
  id: string;
  articleId: string;
  fromSiteId: string;
  toSiteId?: string | null;
  type: string;
  quantity: number;
  userId: string;
  createdAt: string;
};

function normalizeSiteName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isEpinalSite(value?: string | null): boolean {
  if (!value) return false;
  return normalizeSiteName(value).includes('epinal');
}

function isExcludedForEpinal(value?: string | null): boolean {
  if (!value) return false;
  const normalized = normalizeSiteName(value);
  return (
    normalized.includes('stock 1') ||
    normalized.includes('1er') ||
    normalized.includes('comptoir') ||
    normalized.includes('sous sol') ||
    normalized.includes('sous-sol')
  );
}

// Techniciens qui ne doivent jamais recevoir les notifications de mouvements liés à Epinal
const EPINAL_EXCLUDED_TECHNICIAN_NAMES = ['florian', 'julien', 'assen', 'christian'];

function isExcludedTechnicianForEpinal(name?: string | null): boolean {
  if (!name) return false;
  const normalized = normalizeSiteName(name);
  return EPINAL_EXCLUDED_TECHNICIAN_NAMES.some((keyword) => normalized.includes(keyword));
}

// Techniciens qui ne doivent jamais recevoir les notifications de mouvements liés à Stock 1er / Comptoir / Sous sol
const STOCK1ER_EXCLUDED_TECHNICIAN_NAMES = ['etienne', 'illias', 'ilias'];

function isExcludedTechnicianForStock1er(name?: string | null): boolean {
  if (!name) return false;
  const normalized = normalizeSiteName(name);
  return STOCK1ER_EXCLUDED_TECHNICIAN_NAMES.some((keyword) => normalized.includes(keyword));
}

function mapDbTypeToNotifyType(type: string): 'entree' | 'sortie' | 'ajustement' | 'transfert' {
  const normalized = (type ?? '').toUpperCase();
  if (normalized === 'ENTRY') return 'entree';
  if (normalized === 'EXIT') return 'sortie';
  if (normalized === 'ADJUSTMENT') return 'ajustement';
  if (normalized === 'TRANSFER') return 'transfert';
  if (normalized === 'SORTIE') return 'sortie';
  if (normalized === 'AJUSTEMENT') return 'ajustement';
  return 'entree';
}

let channel: RealtimeChannel | null = null;
let activeTechnicien: Pick<Technicien, 'id' | 'nom'> | null = null;

async function notifyForMovement(row: MovementRow): Promise<void> {
  const currentTechnicien = activeTechnicien ?? await AuthService.getStoredSession();
  if (currentTechnicien?.id != null && String(currentTechnicien.id) === String(row.userId)) {
    return;
  }

  const supabase = getSupabaseClient();

  const [articleRes, fromSiteRes, toSiteRes, userRes] = await Promise.all([
    supabase.from(tables.articles).select('name').eq('id', row.articleId).maybeSingle(),
    supabase.from(tables.sites).select('name').eq('id', row.fromSiteId).maybeSingle(),
    row.toSiteId
      ? supabase.from(tables.sites).select('name').eq('id', row.toSiteId).maybeSingle()
      : Promise.resolve({ data: null as any, error: null as any }),
    supabase.from(tables.techniciens).select('name').eq('id', row.userId).maybeSingle(),
  ]);

  const articleName = (articleRes.data as any)?.name ?? 'Article inconnu';
  const fromSiteName = (fromSiteRes.data as any)?.name ?? 'Stock inconnu';
  const toSiteName = (toSiteRes.data as any)?.name;

  let currentUserSiteName: string | null = null;
  if (currentTechnicien?.id) {
    try {
      const { data } = await supabase
        .from(tables.techniciens)
        .select('Site:siteId(name)')
        .eq('id', currentTechnicien.id)
        .maybeSingle();
      currentUserSiteName = (data as any)?.Site?.name ?? null;
    } catch {
      currentUserSiteName = null;
    }
  }

  const epinalMovement = isEpinalSite(fromSiteName) || isEpinalSite(toSiteName);
  if (epinalMovement && (isExcludedForEpinal(currentUserSiteName) || isExcludedTechnicianForEpinal(currentTechnicien?.nom))) {
    return;
  }

  const stock1erMovement = isExcludedForEpinal(fromSiteName) || isExcludedForEpinal(toSiteName);
  if (stock1erMovement && isExcludedTechnicianForStock1er(currentTechnicien?.nom)) {
    return;
  }

  const stockLocation = toSiteName ? `${fromSiteName} -> ${toSiteName}` : fromSiteName;
  const technicianName = (userRes.data as any)?.name ?? '';
  const technicianInitials = movementNotificationService.getInitialsFromDisplayName(technicianName);

  await movementNotificationService.notify({
    movementId: row.id,
    articleName,
    stockLocation,
    quantity: row.quantity,
    movementType: mapDbTypeToNotifyType(row.type),
    technicianInitials,
    happenedAt: row.createdAt ? new Date(row.createdAt) : new Date(),
  });
}

export const movementRealtimeNotificationService = {
  start(technicien?: Pick<Technicien, 'id' | 'nom'> | null): void {
    activeTechnicien = technicien ?? null;
    if (channel) return;
    const supabase = getSupabaseClient();

    channel = supabase
      .channel('stock-movement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tables.mouvements,
        },
        (payload) => {
          notifyForMovement(payload.new as MovementRow).catch((error) => {
            console.warn('[movementRealtimeNotificationService] notify error:', error);
          });
        },
      )
      .subscribe((status) => {
        console.log('[movementRealtimeNotificationService] status:', status);
      });
  },

  stop(): void {
    activeTechnicien = null;
    if (channel) {
      const supabase = getSupabaseClient();
      supabase.removeChannel(channel).catch((error) => {
        console.warn('[movementRealtimeNotificationService] remove channel error:', error);
      });
    }
    channel = null;
  },
};

export default movementRealtimeNotificationService;
