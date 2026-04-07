import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient, tables } from '@/api/supabase';
import { movementNotificationService } from '@/services/movementNotificationService';
import { AuthService } from '@/services/authService';

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

async function notifyForMovement(row: MovementRow): Promise<void> {
  const currentTechnicien = await AuthService.getStoredSession();
  if (currentTechnicien?.id && String(currentTechnicien.id) === String(row.userId)) {
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
  start(): void {
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
    if (!channel) return;
    const supabase = getSupabaseClient();
    supabase.removeChannel(channel).catch((error) => {
      console.warn('[movementRealtimeNotificationService] remove channel error:', error);
    });
    channel = null;
  },
};

export default movementRealtimeNotificationService;
