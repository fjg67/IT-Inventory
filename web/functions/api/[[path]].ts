interface Environment {
  SUPABASE_PROJECT_URL: string;
}

interface PagesContext {
  request: Request;
  env: Environment;
}

const allowedMethods = new Set(['GET', 'POST']);
const hopByHopHeaders = [
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

export async function onRequest({ request, env }: PagesContext): Promise<Response> {
  if (!allowedMethods.has(request.method)) {
    return Response.json({ message: 'Méthode non autorisée.' }, {
      status: 405,
      headers: { Allow: 'GET, POST', 'Cache-Control': 'no-store' },
    });
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(env.SUPABASE_PROJECT_URL)) {
    return Response.json({ message: 'Configuration API Supabase invalide.' }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const projectUrl = new URL(env.SUPABASE_PROJECT_URL);

  const requestUrl = new URL(request.url);
  if (requestUrl.pathname !== '/api' && !requestUrl.pathname.startsWith('/api/')) {
    return Response.json({ message: 'Route introuvable.' }, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const upstreamUrl = new URL(
    `/functions/v1/web-api${requestUrl.pathname}`,
    projectUrl.origin,
  );
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  for (const header of hopByHopHeaders) headers.delete(header);
  headers.set('Cache-Control', 'no-store');

  const upstreamInit: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    body: request.method === 'GET' ? undefined : request.body,
    ...(request.method === 'GET' ? {} : { duplex: 'half' }),
    redirect: 'manual',
  };
  const upstreamRequest = new Request(upstreamUrl, upstreamInit);
  const upstreamResponse = await fetch(upstreamRequest);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set('Cache-Control', 'no-store');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
