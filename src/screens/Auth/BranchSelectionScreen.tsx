import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch } from '@/store';
import { selectSite } from '@/store/slices/siteSlice';
import {
  OnboardingFooter,
  OnboardingLayout,
  OnboardingLogo,
  ONBOARDING_COLORS,
  WorkspaceCard,
} from '@/components/onboarding';

const WORKSPACES = [
  {
    key: 'strasbourg',
    title: 'Strasbourg General',
    subtitle: 'Site principal',
    icon: 'city-variant-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.12)',
    info: '4 sites disponibles',
    disabled: false,
  },
  {
    key: 'agences',
    title: 'Agences',
    subtitle: 'Sites regionaux',
    icon: 'map-marker-multiple-outline',
    iconColor: ONBOARDING_COLORS.green_light,
    iconBg: ONBOARDING_COLORS.green_subtle,
    info: 'Bientot disponible',
    disabled: true,
  },
] as const;

type ResumeState = {
  siteId: string;
  siteName: string;
  profileName: string;
} | null;

export const BranchSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const rememberMe = route.params?.rememberMe ?? true;
  const [resumeState, setResumeState] = useState<ResumeState>(null);

  useEffect(() => {
    const loadResume = async () => {
      try {
        const [siteId, siteName, profileName] = await Promise.all([
          AsyncStorage.getItem('lastSite'),
          AsyncStorage.getItem('lastSiteName'),
          AsyncStorage.getItem('lastProfileName'),
        ]);

        if (siteId && siteName && profileName) {
          setResumeState({ siteId, siteName, profileName });
        }
      } catch {
        setResumeState(null);
      }
    };

    loadResume().catch(() => {});
  }, []);

  const handleResume = useCallback(async () => {
    if (!resumeState) return;
    Vibration.vibrate(10);

    try {
      await dispatch(selectSite(resumeState.siteId)).unwrap();
      navigation.navigate('Auth', { rememberMe, siteId: resumeState.siteId });
    } catch {
      navigation.navigate('SiteSelection', { rememberMe, branch: 'strasbourg' });
    }
  }, [dispatch, navigation, rememberMe, resumeState]);

  const handleWorkspacePress = useCallback(
    async (workspace: string) => {
      Vibration.vibrate(10);
      await AsyncStorage.setItem('lastWorkspace', workspace);
      navigation.navigate('SiteSelection', { rememberMe, branch: workspace });
    },
    [navigation, rememberMe],
  );

  return (
    <OnboardingLayout step={1} totalSteps={3}>
      <StatusBar barStyle="light-content" backgroundColor={ONBOARDING_COLORS.bg_primary} />

      <OnboardingLogo />

      {resumeState ? (
        <Animated.View entering={FadeInDown.delay(140).duration(240)}>
          <TouchableOpacity activeOpacity={0.88} style={styles.resumeCard} onPress={handleResume}>
            <View style={styles.resumeLeft}>
              <Icon name="history" size={15} color={ONBOARDING_COLORS.green_light} />
              <Text style={styles.resumeText}>
                Reprendre {resumeState.profileName} - {resumeState.siteName}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={ONBOARDING_COLORS.green_light} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(210).duration(220)} style={styles.guidance}>
        <Icon name="domain" size={16} color={ONBOARDING_COLORS.text_secondary} />
        <Text style={styles.guidanceText}>Selectionnez votre espace de travail</Text>
        <Icon name="domain" size={16} color={ONBOARDING_COLORS.text_secondary} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {WORKSPACES.map((workspace, index) => (
          <View key={workspace.key} style={styles.cardWrap}>
            <WorkspaceCard
              title={workspace.title}
              subtitle={workspace.subtitle}
              info={workspace.info}
              icon={workspace.icon}
              iconColor={workspace.iconColor}
              iconBg={workspace.iconBg}
              delay={250 + index * 90}
              disabled={workspace.disabled}
              onPress={() => {
                if (workspace.disabled) return;
                handleWorkspacePress(workspace.key).catch(() => {});
              }}
            />
          </View>
        ))}

        <OnboardingFooter />
      </ScrollView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  resumeCard: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_accent,
    backgroundColor: ONBOARDING_COLORS.green_subtle,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resumeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  resumeText: {
    color: ONBOARDING_COLORS.green_light,
    fontSize: 13,
    fontWeight: '600',
  },
  guidance: {
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guidanceText: {
    color: ONBOARDING_COLORS.text_muted,
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  cardWrap: {
    marginBottom: 10,
  },
});

export default BranchSelectionScreen;