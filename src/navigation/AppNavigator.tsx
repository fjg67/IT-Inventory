// ============================================
// APP NAVIGATOR - IT-Inventory Application
// ============================================

import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { useAppSelector, useAppDispatch } from '@/store';
import { loadStoredAuth, loadTechniciens, setRedirectToTechnicianChoiceAfterLogout } from '@/store/slices/authSlice';
import { loadSites, loadStoredSite } from '@/store/slices/siteSlice';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { setNetworkState, setSupabaseReachable } from '@/store/slices/networkSlice';
import { getSupabaseClient, tables } from '@/api/supabase';
import { preferencesService } from '@/services/preferencesService';
import { movementRealtimeNotificationService } from '@/services/movementRealtimeNotificationService';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { pcAvailabilityAlertService } from '@/services/pcAvailabilityAlertService';

import { NoConnectionScreen } from '@/components';
import SplashScreen from '@/screens/SplashScreen';
import { AuthScreen } from '@/screens/Auth/AuthScreen';
import { BranchSelectionScreen } from '@/screens/Auth/BranchSelectionScreen';
import ForceUpdateScreen from '@/screens/Auth/ForceUpdateScreen';
import { LoginScreen } from '@/screens/Auth/LoginScreen';
import { SiteSelectionScreen } from '@/screens/Auth/SiteSelectionScreen';
import { DashboardScreen } from '@/screens/Dashboard/DashboardScreen';
import { ArticlesListScreen } from '@/screens/Articles/ArticlesListScreen';
import { ArticleDetailScreen } from '@/screens/Articles/ArticleDetailScreen';
import { ArticleEditScreen } from '@/screens/Articles/ArticleEditScreen';
import { AddPCScreen } from '@/screens/AddPCScreen';
import { MouvementsListScreen } from '@/screens/Mouvements/MouvementsListScreen';
import { MouvementsStatsScreen } from '@/screens/Mouvements/MouvementsStatsScreen';
import { MouvementFormScreen } from '@/screens/Mouvements/MouvementFormScreen';
import { TransfertFormScreen } from '@/screens/Mouvements/TransfertFormScreen';
import { ScanMouvementScreen } from '@/screens/Mouvements/ScanMouvementScreen';
import { SettingsScreen } from '@/screens/Settings/SettingsScreen';
import { TermsScreen } from '@/screens/Settings/TermsScreen';
import { HelpScreen } from '@/screens/Settings/HelpScreen';
import OnboardingScreen from '@/screens/Onboarding/OnboardingScreen';
import { KitScreen } from '@/screens/Kit/KitScreen';
import { colors, typography } from '@/constants/theme';
import { useTheme } from '@/theme';
import { checkAppVersion, VersionCheckResult } from '@/services/versionService';
import PremiumTabBar from '@/components/navigation/PremiumTabBar';
import { type InitStep } from '@/hooks/useSplashSequence';

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

const getActiveRouteName = (state: any): string => {
  if (!state || !state.routes || state.index == null) return 'Unknown';
  const route = state.routes[state.index];
  if (route?.state) return getActiveRouteName(route.state);
  return route?.name ?? 'Unknown';
};

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

// Articles Navigator - Standard (Articles, Kits, etc)
const ArticlesNavigator: React.FC = () => (
  <ArticlesStack.Navigator screenOptions={{ headerShown: false }}>
    <ArticlesStack.Screen name="ArticlesList" component={ArticlesListScreen} />
    <ArticlesStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    <ArticlesStack.Screen name="ArticleEdit" component={ArticleEditScreen} />
    <ArticlesStack.Screen name="AddPC" component={AddPCScreen} />
    <ArticlesStack.Screen name="Kit" component={KitScreen} />
  </ArticlesStack.Navigator>
);

// Articles Navigator - PC Mode (with locked PC type)
const PCNavigator: React.FC = () => (
  <ArticlesStack.Navigator screenOptions={{ headerShown: false }}>
    <ArticlesStack.Screen
      name="ArticlesList"
      component={ArticlesListScreen}
      initialParams={{
        presetTypeArticle: 'PC',
        lockPresetTypeArticle: true,
      }}
    />
    <ArticlesStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    <ArticlesStack.Screen name="ArticleEdit" component={ArticleEditScreen} />
    <ArticlesStack.Screen name="AddPC" component={AddPCScreen} />
    <ArticlesStack.Screen name="Kit" component={KitScreen} />
  </ArticlesStack.Navigator>
);

// Mouvements Navigator
const MouvementsNavigator: React.FC = () => (
  <MouvementsStack.Navigator screenOptions={{ headerShown: false }}>
    <MouvementsStack.Screen name="MouvementsList" component={MouvementsListScreen} />
    <MouvementsStack.Screen name="MouvementsStats" component={MouvementsStatsScreen} />
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

const PCIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} emoji="🖥️" label="PC" />
);

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  return (
    <MainTab.Navigator
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          paddingBottom: 92,
          backgroundColor: '#0A0F0D',
        },
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
        name="PC"
        component={PCNavigator}
        options={{
          tabBarIcon: PCIcon,
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
};

// App Navigator
export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigationRef = React.useRef<any>(null);
  const { isAuthenticated, isLoading: authLoading, redirectToTechnicianChoiceAfterLogout, currentTechnicien } = useAppSelector((state) => state.auth);
  const { isConnected, isInternetReachable } = useAppSelector((state) => state.network);
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);

  const [isInitializing, setIsInitializing] = React.useState(true);
  const [initStep, setInitStep] = React.useState<InitStep>('connecting');
  const [initErrorMessage, setInitErrorMessage] = React.useState<string | null>(null);
  const [onboardingSeen, setOnboardingSeen] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState<VersionCheckResult | null>(null);
  const [siteGateSeed, setSiteGateSeed] = React.useState(0);
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const isAuthenticatedRef = React.useRef(isAuthenticated);
  const prevIsAuthenticatedRef = React.useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    console.log(`[AppNavigator] Auth state: isAuthenticated=${isAuthenticated}, authLoading=${authLoading}`);
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const wasAuthenticated = prevIsAuthenticatedRef.current;
    prevIsAuthenticatedRef.current = isAuthenticated;

    if (wasAuthenticated || !isAuthenticated) {
      return;
    }

    // Safety net: after successful login, force root route to Main
    // in case Auth screen reset happened before navigator tree switched.
    setTimeout(() => {
      const nav = navigationRef.current;
      if (!nav?.getRootState || !nav?.resetRoot) return;

      const currentRoute = getActiveRouteName(nav.getRootState());
      if (currentRoute === 'Auth' || currentRoute === 'Login' || currentRoute === 'SiteSelection' || currentRoute === 'BranchSelection' || currentRoute === 'Onboarding') {
        console.log('[AppNavigator] Forcing post-login route to Main from', currentRoute);
        nav.resetRoot({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    }, 0);
  }, [isAuthenticated]);

  const runVersionCheck = React.useCallback(async () => {
    try {
      const versionResult = await checkAppVersion();
      setForceUpdate(versionResult.updateRequired ? versionResult : null);
    } catch (error) {
      console.warn('[AppNavigator] checkAppVersion error:', error);
    }
  }, []);

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

  const initializeApp = React.useCallback(async () => {
    setIsInitializing(true);
    setInitErrorMessage(null);

    try {
      console.log('[AppNavigator] Loading stored data...');

      setInitStep('connecting');
      await dispatch(loadStoredAuth()).unwrap();
      console.log('[AppNavigator] Auth loaded');

      setInitStep('auth_check');
      await Promise.all([
        dispatch(loadTechniciens()).unwrap(),
        dispatch(loadSites()).unwrap(),
        dispatch(loadStoredSite()).unwrap(),
      ]);
      console.log('[AppNavigator] Techniciens, sites and stored site loaded');

      setInitStep('config_load');
      await preferencesService.load();
      console.log('[AppNavigator] Preferences loaded');

      await runVersionCheck();

      setInitStep('session_restore');
      const onboardingDone = await AsyncStorage.getItem('@it-inventory/onboarding_seen');
      if (onboardingDone === 'true') {
        setOnboardingSeen(true);
      }

      setInitStep('ready');
      setIsInitializing(false);
    } catch (error) {
      console.error('Erreur initialisation:', error);
      setInitErrorMessage('Impossible de se connecter');
      setIsInitializing(false);
    }
  }, [dispatch, runVersionCheck]);

  useEffect(() => {
    initializeApp().catch(console.error);
  }, [initializeApp]);

  // Re-vérifier la version quand l'app revient au premier plan
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      if (wasBackground && nextState === 'active') {
        runVersionCheck().catch(() => {});
        if (isAuthenticatedRef.current) {
          setSiteGateSeed((prev) => prev + 1);
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      sub.remove();
    };
  }, [runVersionCheck]);

  useEffect(() => {
    if (isAuthenticated) {
      movementRealtimeNotificationService.start();
    } else {
      movementRealtimeNotificationService.stop();
    }

    return () => {
      movementRealtimeNotificationService.stop();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      pushNotificationsService.stop();
      return;
    }

    pushNotificationsService.start(currentTechnicien?.id != null ? String(currentTechnicien.id) : undefined).catch((error) => {
      console.warn('[AppNavigator] pushNotificationsService.start error:', error);
    });

    return () => {
      pushNotificationsService.stop();
    };
  }, [isAuthenticated, currentTechnicien?.id]);

  useEffect(() => {
    if (!isAuthenticated || !effectiveSiteId) return;

    const runCheck = () => {
      pcAvailabilityAlertService
        .checkAndNotify(effectiveSiteId)
        .catch((error) => {
          console.warn('[AppNavigator] pcAvailabilityAlertService.checkAndNotify error:', error);
        });
    };

    runCheck();
    const interval = setInterval(runCheck, 6 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, effectiveSiteId]);

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

  const { colors: themeColors, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: themeColors.primary,
      background: themeColors.backgroundBase,
      card: themeColors.surface,
      text: themeColors.textPrimary,
      border: themeColors.borderSubtle,
      notification: themeColors.danger,
    },
  };

  if (isInitializing) {
    return (
      <SplashScreen
        step={initStep}
        isError={Boolean(initErrorMessage)}
        message={initErrorMessage ?? undefined}
        onRetry={initErrorMessage ? initializeApp : undefined}
      />
    );
  }

  // Version trop ancienne → écran de mise à jour obligatoire
  if (forceUpdate?.updateRequired) {
    return (
      <ForceUpdateScreen
        minVersion={forceUpdate.minVersion}
        updateUrl={forceUpdate.updateUrl}
        releaseNotes={forceUpdate.releaseNotes}
      />
    );
  }

  // Pas de connexion internet → écran offline
  if (!isConnected || !isInternetReachable) {
    return <NoConnectionScreen />;
  }

  return (
    <View style={{flex: 1}}>
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        const rootState = navigationRef.current?.getRootState?.();
        console.log('[NavState] ready route =', getActiveRouteName(rootState));
      }}
      onStateChange={(state) => {
        console.log('[NavState] route =', getActiveRouteName(state));
      }}
    >
      <RootStack.Navigator
        key={`root-stack-${siteGateSeed}-${isAuthenticated ? 'auth' : 'guest'}`}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0A0F0D' },
        }}
        initialRouteName={isAuthenticated ? 'Main' : redirectToTechnicianChoiceAfterLogout ? 'Auth' : onboardingSeen ? 'Login' : 'Onboarding'}
      >
        {isAuthenticated ? (
          <>
            <RootStack.Screen
              name="SiteSelection"
              component={SiteSelectionScreen}
              initialParams={{ startupMode: true }}
            />
            <RootStack.Screen name="Auth" component={AuthScreen} />
            <RootStack.Screen name="Main" component={MainNavigator} />
          </>
        ) : onboardingSeen ? (
          // Onboarding déjà vu → connexion → branche → site → technicien
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="BranchSelection" component={BranchSelectionScreen} />
            <RootStack.Screen name="SiteSelection" component={SiteSelectionScreen} />
            <RootStack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          // Premier lancement → onboarding → connexion → branche → site → technicien
          <>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="BranchSelection" component={BranchSelectionScreen} />
            <RootStack.Screen name="SiteSelection" component={SiteSelectionScreen} />
            <RootStack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
    </View>
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
