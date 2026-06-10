// ============================================
// NAVIGATION TYPES - IT-Inventory Application
// ============================================

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  BranchSelection: { rememberMe?: boolean };
  SiteSelection: { rememberMe?: boolean; branch?: string; startupMode?: boolean };
  Auth: { rememberMe?: boolean; siteId?: string | number; parentSiteId?: string | number };
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Articles: NavigatorScreenParams<ArticlesStackParamList>;
  PC: NavigatorScreenParams<ArticlesStackParamList>;
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
  ArticlesList:
    | {
        filter?: 'lowStock';
        presetTypeArticle?: string;
        lockPresetTypeArticle?: boolean;
        pcAddSuccessAt?: number;
        pcAddHostname?: string;
      }
    | undefined;
  ArticleDetail: { articleId: number; sourceTab?: 'Articles' | 'PC' };
  ArticleEdit: { articleId?: number; famille?: string } | undefined;
  AddPC: undefined;
  Kit: undefined;
};

// Mouvements Stack
export type MouvementsStackParamList = {
  MouvementsList: undefined;
  MouvementsStats: undefined;
  MouvementForm:
    | {
        articleId?: number;
        type?: 'entree' | 'sortie' | 'ajustement';
        source?: 'Dashboard' | 'Scan' | 'Mouvements' | 'ArticleDetail';
      }
    | undefined;
  ScanMouvement: undefined;
  TransfertForm: { articleId?: number } | undefined;
};

// Augment pour useNavigation/useRoute
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
