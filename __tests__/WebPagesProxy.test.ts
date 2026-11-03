import { onRequest } from '../web/functions/api/[[path]]';

describe('Cloudflare Pages API proxy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards the session cookie, origin, query, and response headers', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ activeSite: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'it_inventory_web_session=token; HttpOnly; Secure; SameSite=Strict; Path=/',
        },
      }),
    );
    const request = new Request(
      'https://it-inventory-web.pages.dev/api/auth/session?siteId=site-1',
      {
        headers: {
          Cookie: 'it_inventory_web_session=token',
          Origin: 'https://it-inventory-web.pages.dev',
          'X-Forwarded-For': '203.0.113.8',
        },
      },
    );

    const response = await onRequest({
      request,
      env: { SUPABASE_PROJECT_URL: 'https://lghhzbkbwttvroxodlzd.supabase.co' },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const upstream = fetchMock.mock.calls[0][0] as Request;
    expect(upstream.url).toBe(
      'https://lghhzbkbwttvroxodlzd.supabase.co/functions/v1/web-api/api/auth/session?siteId=site-1',
    );
    expect(upstream.headers.get('cookie')).toBe('it_inventory_web_session=token');
    expect(upstream.headers.get('origin')).toBe('https://it-inventory-web.pages.dev');
    expect(upstream.headers.get('x-forwarded-for')).toBe('203.0.113.8');
    expect(upstream.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toContain('SameSite=Strict');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ activeSite: null });
  });

  it('forwards POST JSON without altering its method or body', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ authMode: 'shared' }),
    );
    const request = new Request('https://it-inventory-web.pages.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'example' }),
    });

    const response = await onRequest({
      request,
      env: { SUPABASE_PROJECT_URL: 'https://lghhzbkbwttvroxodlzd.supabase.co' },
    });

    const upstream = fetchMock.mock.calls[0][0] as Request;
    expect(upstream.method).toBe('POST');
    await expect(upstream.json()).resolves.toEqual({ password: 'example' });
    expect(response.status).toBe(200);
  });

  it('rejects unsupported methods and non-Supabase upstreams', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const deleteResponse = await onRequest({
      request: new Request('https://it-inventory-web.pages.dev/api/auth/session', { method: 'DELETE' }),
      env: { SUPABASE_PROJECT_URL: 'https://lghhzbkbwttvroxodlzd.supabase.co' },
    });
    const invalidUpstreamResponse = await onRequest({
      request: new Request('https://it-inventory-web.pages.dev/api/auth/session'),
      env: { SUPABASE_PROJECT_URL: 'http://example.com' },
    });

    expect(deleteResponse.status).toBe(405);
    expect(deleteResponse.headers.get('allow')).toBe('GET, POST');
    expect(invalidUpstreamResponse.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
