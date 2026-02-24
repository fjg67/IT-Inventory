// ============================================
// APP NAVIGATOR - IT-Inventory Application
// ============================================

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { useAppSelector, useAppDispatch } from '@/store';
import { loadStoredAuth, loadTechniciens, setRedirectToTechnicianChoiceAfterLogout } from '@/store/slices/authSlice';
import { loadSites, loadStoredSite } from '@/store/slices/siteSlice';
import { setNetworkState, setSupabaseReachable } from '@/store/slices/networkSlice';
import { getSupabaseClient, tables } from '@/api/supabase';
import { preferencesService } from '@/services/preferencesService';

import { FullScreenLoading } from '@/components';
import {
  AuthScreen,
  LoginScreen,
  DashboardScreen,
  ArticlesListScreen,
  ArticleDetailScreen,
  ArticleEditScreen,
  MouvementsListScreen,
  MouvementFormScreen,
  TransfertFormScreen,
  ScanMouvementScreen,
  SettingsScreen,
  TermsScreen,
  HelpScreen,
  OnboardingScreen,
  KitScreen,
} from '@/screens';
import { colors, typography } from '@/constants/theme';
import PremiumTabBar from '@/components/navigation/PremiumTabBar';

import {
  RootStackParamList,
  MainTabParamList,
  ArticlesStackParamList,
  MouvementsStackParamList,
  SettingsStackParamList,
} from './types';

// Stacks
const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ArticlesStack = createNativeStackNavigator<ArticlesStackParamList>();
const MouvementsStack = createNativeStackNavigator<MouvementsStackParamList>();
const SettingsStackNav = createNativeStackNavigator<SettingsStackParamList>();

// Tab Bar Icon component
const TabIcon: React.FC<{ focused: boolean; emoji: string; label: string }> = ({
  focused,
  emoji,
  label,
}) => (
  <View style={styles.tabIconContainer}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

// Articles Navigator
const ArticlesNavigator: React.FC = () => (
  <ArticlesStack.Navigator screenOptions={{ headerShown: false }}>
    <ArticlesStack.Screen name="ArticlesList" component={ArticlesListScreen} />
    <ArticlesStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    <ArticlesStack.Screen name="ArticleEdit" component={ArticleEditScreen} />
    <ArticlesStack.Screen name="Kit" component={KitScreen} />
  </ArticlesStack.Navigator>
);

// Mouvements Navigator
const MouvementsNavigator: React.FC = () => (
  <MouvementsStack.Navigator screenOptions={{ headerShown: false }}>
    <MouvementsStack.Screen name="MouvementsList" component={MouvementsListScreen} />
    <MouvementsStack.Screen name="MouvementForm" component={MouvementFormScreen} />
    <MouvementsStack.Screen name="TransfertForm" component={TransfertFormScreen} />
    <MouvementsStack.Screen name="ScanMouvement" component={ScanMouvementScreen} />
  </MouvementsStack.Navigator>
);

// Settings Navigator
const SettingsNavigator: React.FC = () => (
  <SettingsStackNav.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStackNav.Screen name="SettingsMain" component={SettingsScreen} />
    <SettingsStackNav.Screen name="Terms" component={TermsScreen} />
    <SettingsStackNav.Screen name="Help" component={HelpScreen} />
  </SettingsStackNav.Navigator>
);

// Tab Icon Renderers
const DashboardIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} emoji="🏠" label="Accueil" />
);

const ArticlesIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} emoji="📦" label="Articles" />
);

const ScanIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} emoji="📷" label="Scan" />
);

const MouvementsIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} emoji="📊" label="Mouvements" />
);

const SettingsIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} emoji="⚙️" label="Paramètres" />
);

// Main Tab Navigator
const MainNavigator: React.FC = () => (
  <MainTab.Navigator
    tabBar={(props) => <PremiumTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <MainTab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarIcon: DashboardIcon,
        tabBarLabel: () => null,
      }}
    />
    <MainTab.Screen
      name="Articles"
      component={ArticlesNavigator}
      options={{
        tabBarIcon: ArticlesIcon,
        tabBarLabel: () => null,
      }}
    />
    <MainTab.Screen
      name="Scan"
      component={ScanMouvementScreen}
      options={{
        tabBarIcon: ScanIcon,
        tabBarLabel: () => null,
      }}
    />
    <MainTab.Screen
      name="Mouvements"
      component={MouvementsNavigator}
      options={{
        tabBarIcon: MouvementsIcon,
        tabBarLabel: () => null,
      }}
    />
    <MainTab.Screen
      name="Settings"
      component={SettingsNavigator}
      options={{
        tabBarIcon: SettingsIcon,
        tabBarLabel: () => null,
      }}
    />
  </MainTab.Navigator>
);

// App Navigator
export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading, redirectToTechnicianChoiceAfterLogout } = useAppSelector((state) => state.auth);

  const [isInitializing, setIsInitializing] = React.useState(true);
  const [onboardingSeen, setOnboardingSeen] = React.useState(false);

  // Réseau : écouter NetInfo et vérifier l'accès Supabase
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from(tables.sites).select('id').limit(1).maybeSingle();
        dispatch(setSupabaseReachable(!error));
      } catch {
        dispatch(setSupabaseReachable(false));
      }
    };

    const unsubNet = NetInfo.addEventListener((state: NetInfoState) => {
      dispatch(setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      }));
      if (state.isConnected && state.isInternetReachable) {
        checkSupabase();
      } else {
        dispatch(setSupabaseReachable(false));
      }
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      dispatch(setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      }));
      if (state.isConnected && state.isInternetReachable) checkSupabase();
    });

    const interval = setInterval(checkSupabase, 60000);
    return () => {
      unsubNet();
      clearInterval(interval);
    };
  }, [dispatch]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[AppNavigator] Loading stored data...');
        await Promise.all([
          dispatch(loadStoredAuth()).then(() => console.log('[AppNavigator] Auth loaded')),
          dispatch(loadTechniciens()).then(() => console.log('[AppNavigator] Techniciens loaded')),
          dispatch(loadSites()).then(() => console.log('[AppNavigator] Sites loaded')),
          dispatch(loadStoredSite()).then(() => console.log('[AppNavigator] Site loaded')),
          preferencesService.load().then(() => console.log('[AppNavigator] Preferences loaded')),
        ]);
        console.log('[AppNavigator] Stored data loaded');

        const onboardingDone = await AsyncStorage.getItem('@it-inventory/onboarding_seen');
        if (onboardingDone === 'true') {
          setOnboardingSeen(true);
        }
      } catch (error) {
        console.error('Erreur initialisation:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp().catch(console.error);
  }, [dispatch]);

  // Réinitialiser le flag "après déconnexion" une fois l'écran Auth affiché (pour que le prochain lancement affiche Login)
  useEffect(() => {
    if (!isAuthenticated && redirectToTechnicianChoiceAfterLogout) {
      const t = setTimeout(() => {
        dispatch(setRedirectToTechnicianChoiceAfterLogout(false));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, redirectToTechnicianChoiceAfterLogout, dispatch]);

  console.log(`[AppNavigator] Render: isInitializing=${isInitializing}, authLoading=${authLoading}`);

  if (isInitializing) {
    return <FullScreenLoading message="Chargement de l'application..." />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? undefined : redirectToTechnicianChoiceAfterLogout ? 'Auth' : onboardingSeen ? 'Login' : 'Onboarding'}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : onboardingSeen ? (
          // Onboarding déjà vu → page de connexion puis sélection technicien
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          // Premier lancement → onboarding puis connexion
          <>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabLabel: {
    ...typography.small,
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AppNavigator;
