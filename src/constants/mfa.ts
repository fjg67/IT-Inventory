export type ProtectedProfileMfaConfig = {
  accountLabel: string;
  issuer: string;
  secret: string;
  requiredRole?: 'technicien' | 'superviseur';
  requiredInitials?: string;
};

export const protectedProfileMfaConfigs: ProtectedProfileMfaConfig[] = [
  {
    accountLabel: 'RL',
    issuer: 'IT-Inventory',
    secret: process.env.RL_GOOGLE_AUTH_SECRET || 'ZMPE2I26PJ22I3IBK7MEGO4QHLOEC5WP',
    requiredRole: 'superviseur',
    requiredInitials: 'RL',
  },
];