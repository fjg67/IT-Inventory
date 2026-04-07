import { SUPABASE_CONFIG } from '@/constants';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { getSupabaseClient } from '@/api/supabase';

interface DispatchMovementPushPayload {
  movementId: string;
  senderUserId: string;
}

export const movementPushDispatchService = {
  async dispatchMovementCreated(payload: DispatchMovementPushPayload): Promise<void> {
    const senderDeviceId = await pushNotificationsService.getDeviceId();
    const url = `${SUPABASE_CONFIG.url}/functions/v1/send-movement-push`;
    const {
      data: { session },
    } = await getSupabaseClient().auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_CONFIG.anonKey,
    };
    headers.Authorization = `Bearer ${session?.access_token ?? SUPABASE_CONFIG.anonKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movementId: payload.movementId,
        senderUserId: payload.senderUserId,
        senderDeviceId,
      }),
    });

    const body = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(`send-movement-push HTTP ${response.status}: ${body}`);
    }

    if (body) {
      console.log('[movementPushDispatchService] send-movement-push OK:', body);
    }
  },
};

export default movementPushDispatchService;
