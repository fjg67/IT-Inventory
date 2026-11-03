import type { AuthSession } from '../types/auth';
import { ApiError, apiRequest } from './apiClient';

export class AuthServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseSession(value: unknown): AuthSession {
  if (!isRecord(value) || !isRecord(value.user)) {
    throw new AuthServiceError('Réponse de session invalide.');
  }

  const { user } = value;
  const authMode = value.authMode ?? 'user';
  if (
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.role !== 'string' ||
    !Array.isArray(user.permissions) ||
    !user.permissions.every((permission) => typeof permission === 'string') ||
    (authMode !== 'user' && authMode !== 'shared')
  ) {
    throw new AuthServiceError('Le serveur a renvoyé un profil incomplet.');
  }

  let activeSite: AuthSession['activeSite'];
  if (value.activeSite === null) {
    activeSite = null;
  } else if (value.activeSite !== undefined) {
    if (
      !isRecord(value.activeSite) ||
      typeof value.activeSite.id !== 'string' ||
      typeof value.activeSite.name !== 'string'
    ) {
      throw new AuthServiceError('Le serveur a renvoyé un site invalide.');
    }
    activeSite = { id: value.activeSite.id, name: value.activeSite.name };
  }

  let activeTechnician: AuthSession['activeTechnician'];
  if (value.activeTechnician === null || value.activeTechnician === undefined) {
    activeTechnician = null;
  } else {
    if (
      !isRecord(value.activeTechnician) ||
      typeof value.activeTechnician.id !== 'string' ||
      typeof value.activeTechnician.name !== 'string' ||
      typeof value.activeTechnician.role !== 'string'
    ) {
      throw new AuthServiceError('Le serveur a renvoyé un profil technicien invalide.');
    }
    activeTechnician = {
      id: value.activeTechnician.id,
      name: value.activeTechnician.name,
      role: value.activeTechnician.role,
    };
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    },
    activeSite,
    activeTechnician,
    authMode,
  };
}

export const authService = {
  async getSession(signal?: AbortSignal): Promise<AuthSession | null> {
    try {
      return await apiRequest('/api/auth/session', { method: 'GET', signal }, parseSession);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      if (error instanceof ApiError) throw new AuthServiceError(error.message, error.status);
      throw error;
    }
  },

  async signIn(password: string): Promise<AuthSession> {
    try {
      return await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { password },
      }, parseSession);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new AuthServiceError('Mot de passe incorrect.', error.status);
      }
      if (error instanceof ApiError) throw new AuthServiceError(error.message, error.status);
      throw error;
    }
  },

  async selectSite(siteId: string): Promise<AuthSession> {
    try {
      return await apiRequest('/api/auth/site', {
        method: 'POST',
        body: { siteId },
      }, parseSession);
    } catch (error) {
      if (error instanceof ApiError) throw new AuthServiceError(error.message, error.status);
      throw error;
    }
  },

  async selectTechnician(technicianId: string): Promise<AuthSession> {
    try {
      return await apiRequest('/api/auth/technician', {
        method: 'POST',
        body: { technicianId },
      }, parseSession);
    } catch (error) {
      if (error instanceof ApiError) throw new AuthServiceError(error.message, error.status);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' }, () => undefined);
    } catch (error) {
      if (error instanceof ApiError) throw new AuthServiceError(error.message, error.status);
      throw error;
    }
  },
};
