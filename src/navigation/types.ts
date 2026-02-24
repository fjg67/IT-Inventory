// ============================================
// NAVIGATION TYPES - IT-Inventory Application
// ============================================

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Auth: { rememberMe?: boolean };
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Articles: NavigatorScreenParams<ArticlesStackParamList>;
  Mouvements: NavigatorScreenParams<MouvementsStackParamList>;
  Scan: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Settings Stack
export type SettingsStackParamList = {
  SettingsMain: undefined;
  Terms: { requireAcceptance?: boolean } | undefined;
  Help: undefined;
};

// Articles Stack
export type ArticlesStackParamList = {
  ArticlesList: { filter?: 'lowStock' } | undefined;
  ArticleDetail: { articleId: number };
  ArticleEdit: { articleId?: number; famille?: string } | undefined;
  Kit: undefined;
};

// Mouvements Stack
export type MouvementsStackParamList = {
  MouvementsList: undefined;
  MouvementForm: { articleId?: number; type?: 'entree' | 'sortie' | 'ajustement' } | undefined;
  ScanMouvement: undefined;
  TransfertForm: { articleId?: number } | undefined;
};

// Augment pour useNavigation/useRoute
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
