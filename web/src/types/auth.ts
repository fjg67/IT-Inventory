export interface AuthenticatedUser {
  id: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface ActiveSite {
  id: string;
  name: string;
}

export interface ActiveTechnician {
  id: string;
  name: string;
  role: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  activeSite?: ActiveSite | null;
  activeTechnician?: ActiveTechnician | null;
  authMode: 'user' | 'shared';
}

export interface AvailableSite extends ActiveSite {
  parentSiteId: string | null;
}

export type AvailableTechnician = ActiveTechnician;
