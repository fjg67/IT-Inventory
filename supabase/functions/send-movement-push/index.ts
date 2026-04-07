import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'npm:jose@5.9.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? '';
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL') ?? '';
const FIREBASE_PRIVATE_KEY = (Deno.env.get('FIREBASE_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const FCM_V1_URL = FIREBASE_PROJECT_ID
  ? `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`
  : '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

type RequestBody = {
  movementId?: string;
  senderUserId?: string;
  senderDeviceId?: string;
};

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

function toMovementLabel(type: string): { label: string; emoji: string } {
  const t = (type ?? '').toUpperCase();
  if (t === 'ENTRY') return { label: 'Entree', emoji: '🟢' };
  if (t === 'EXIT') return { label: 'Sortie', emoji: '🔴' };
  if (t === 'ADJUSTMENT') return { label: 'Ajustement', emoji: '🟡' };
  return { label: 'Transfert', emoji: '🔄' };
}

function toQuantity(type: string, quantity: number): string {
  const t = (type ?? '').toUpperCase();
  if (t === 'EXIT') return `-${Math.abs(quantity)}`;
  if (t === 'TRANSFER') return quantity < 0 ? `-${Math.abs(quantity)}` : `+${Math.abs(quantity)}`;
  return `+${Math.abs(quantity)}`;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt - 60 > now) {
    return cachedAccessToken.token;
  }

  const privateKey = await importPKCS8(FIREBASE_PRIVATE_KEY, 'RS256');
  const jwt = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(FIREBASE_CLIENT_EMAIL)
    .setSubject(FIREBASE_CLIENT_EMAIL)
    .setAudience(GOOGLE_OAUTH_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errPayload = await tokenResponse.text().catch(() => '');
    throw new Error(`Google OAuth token error: HTTP ${tokenResponse.status} ${errPayload}`);
  }

  const tokenPayload = await tokenResponse.json();
  const token = tokenPayload.access_token as string | undefined;
  const expiresIn = Number(tokenPayload.expires_in ?? 3600);
  if (!token) {
    throw new Error('Google OAuth token missing access_token');
  }

  cachedAccessToken = {
    token,
    expiresAt: now + Math.max(60, expiresIn),
  };
  return token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !FIREBASE_PROJECT_ID ||
      !FIREBASE_CLIENT_EMAIL ||
      !FIREBASE_PRIVATE_KEY
    ) {
      return new Response(
        JSON.stringify({
          error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY',
        }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const body = (await req.json()) as RequestBody;
    if (!body.movementId || !body.senderUserId) {
      return new Response(
        JSON.stringify({ error: 'movementId and senderUserId are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: movement, error: movementError } = await supabase
      .from('StockMovement')
      .select('id, articleId, fromSiteId, toSiteId, type, quantity, userId, createdAt')
      .eq('id', body.movementId)
      .maybeSingle<MovementRow>();

    if (movementError || !movement) {
      return new Response(
        JSON.stringify({ error: movementError?.message ?? 'Movement not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const [articleRes, fromSiteRes, toSiteRes, techRes] = await Promise.all([
      supabase.from('Article').select('name').eq('id', movement.articleId).maybeSingle(),
      supabase.from('Site').select('name').eq('id', movement.fromSiteId).maybeSingle(),
      movement.toSiteId ? supabase.from('Site').select('name').eq('id', movement.toSiteId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      supabase.from('User').select('name').eq('id', movement.userId).maybeSingle(),
    ]);

    const articleName = (articleRes.data as any)?.name ?? 'Article inconnu';
    const fromSiteName = (fromSiteRes.data as any)?.name ?? 'Stock inconnu';
    const toSiteName = (toSiteRes.data as any)?.name;
    const techName = (techRes.data as any)?.name ?? '';
    const techInitials = techName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part: string) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';

    const { label, emoji } = toMovementLabel(movement.type);
    const quantity = toQuantity(movement.type, movement.quantity);
    const stockLocation = toSiteName ? `${fromSiteName} -> ${toSiteName}` : fromSiteName;
    const eventTime = new Date(movement.createdAt).toISOString();

    const title = `${emoji} ${label} de stock`;
    const message = [
      `📦 Article: ${articleName}`,
      `📍 Stock: ${stockLocation}`,
      `🔢 Quantite: ${quantity}`,
      `${emoji} Type: ${label}`,
      `👷 Technicien: ${techInitials}`,
    ].join('\n');

    const actorUserId = String(movement.userId ?? body.senderUserId ?? '');

    let tokenRows: any[] | null = null;
    const tokenQueryWithEnabled = await supabase
      .from('PushDeviceToken')
      .select('id, userId, token, enabled');

    if (tokenQueryWithEnabled.error) {
      const tokenQueryFallbackWithUser = await supabase
        .from('PushDeviceToken')
        .select('id, userId, token');
      if (tokenQueryFallbackWithUser.error) {
        const tokenQueryLegacy = await supabase
          .from('PushDeviceToken')
          .select('id, token, enabled');
        if (tokenQueryLegacy.error) {
          const tokenQueryFinal = await supabase
            .from('PushDeviceToken')
            .select('id, token');
          if (tokenQueryFinal.error) {
            throw new Error(tokenQueryFinal.error.message);
          }
          tokenRows = tokenQueryFinal.data as any[];
        } else {
          tokenRows = tokenQueryLegacy.data as any[];
        }
      } else {
        tokenRows = tokenQueryFallbackWithUser.data as any[];
      }
    } else {
      tokenRows = tokenQueryWithEnabled.data as any[];
    }

    const tokens = (tokenRows ?? [])
      .filter((r: any) => r.enabled !== false)
      .filter((r: any) => !body.senderDeviceId || String(r.id) !== String(body.senderDeviceId))
      .filter((r: any) => !r.userId || !actorUserId || String(r.userId) !== actorUserId)
      .map((r: any) => r.token)
      .filter(Boolean);
    if (!tokens.length) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'No destination token' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const accessToken = await getGoogleAccessToken();
    const sendResults = await Promise.all(
      tokens.map(async (token) => {
        const fcmRes = await fetch(FCM_V1_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title,
                body: message,
              },
              data: {
                movementId: movement.id,
                movementType: movement.type,
                notifTitle: title,
                notifBody: message,
              },
              android: {
                priority: 'HIGH',
                notification: {
                  channel_id: 'stock-movements-v2',
                  event_time: eventTime,
                  sound: 'default',
                },
              },
              apns: {
                headers: {
                  'apns-priority': '10',
                },
                payload: {
                  aps: {
                    sound: 'default',
                    'content-available': 1,
                  },
                },
              },
            },
          }),
        });

        const payload = await fcmRes.json().catch(() => null);
        return { ok: fcmRes.ok, token, payload };
      }),
    );

    const successCount = sendResults.filter((r) => r.ok).length;
    const failures = sendResults
      .filter((r) => !r.ok)
      .map((r) => ({
        tokenPrefix: String(r.token).slice(0, 16),
        error: r.payload,
      }));
    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: tokens.length, failures }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
