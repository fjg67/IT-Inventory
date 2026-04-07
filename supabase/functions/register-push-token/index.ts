import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

type RequestBody = {
  deviceId?: string;
  userId?: string;
  token?: string;
  platform?: string;
  enabled?: boolean;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const body = (await req.json()) as RequestBody;
    if (!body.deviceId || !body.token) {
      return new Response(
        JSON.stringify({ error: 'deviceId and token are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let { error } = await supabase.from('PushDeviceToken').upsert(
      {
        id: body.deviceId,
        userId: body.userId ?? null,
        token: body.token,
        platform: body.platform ?? 'android',
        enabled: body.enabled ?? true,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      const fallbackNoEnabled = await supabase.from('PushDeviceToken').upsert(
        {
          id: body.deviceId,
          userId: body.userId ?? null,
          token: body.token,
          platform: body.platform ?? 'android',
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      error = fallbackNoEnabled.error ?? error;
    }

    if (error && body.userId) {
      // Fallback robuste: si la FK userId bloque, enregistrer quand même le token
      const retry = await supabase.from('PushDeviceToken').upsert(
        {
          id: body.deviceId,
          userId: null,
          token: body.token,
          platform: body.platform ?? 'android',
          enabled: body.enabled ?? true,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (retry.error) {
        const retryNoEnabled = await supabase.from('PushDeviceToken').upsert(
          {
            id: body.deviceId,
            userId: null,
            token: body.token,
            platform: body.platform ?? 'android',
            updatedAt: new Date().toISOString(),
          },
          { onConflict: 'id' },
        );
        error = retryNoEnabled.error ?? retry.error;
      } else {
        error = null;
      }
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
