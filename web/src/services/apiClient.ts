const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const apiBase = configuredApiBase.replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function apiRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; signal?: AbortSignal },
  parse: (value: unknown) => T,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('Service indisponible. Vérifiez votre connexion ou la configuration de l’API.');
  }

  if (response.status === 401) {
    throw new ApiError('Votre session a expiré. Reconnectez-vous.', response.status);
  }
  if (response.status === 403) {
    throw new ApiError('Vous n’avez pas la permission de consulter ces données.', response.status);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = isRecord(body) && typeof body.message === 'string'
      ? body.message
      : `Le service a répondu (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('Le service a renvoyé une réponse illisible.');
  }

  try {
    return parse(body);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Le service a renvoyé des données dans un format inattendu.');
  }
}

export function apiGet<T>(
  path: string,
  parse: (value: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest(path, { method: 'GET', signal }, parse);
}

export function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new ApiError('Objet de données invalide.');
  return value;
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new ApiError(`Champ « ${field} » invalide.`);
  return value;
}

export function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiError(`Champ « ${field} » invalide.`);
  }
  return value;
}

export function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new ApiError(`Liste « ${field} » invalide.`);
  return value;
}

export function apiMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Une erreur inattendue est survenue lors du chargement.';
}
