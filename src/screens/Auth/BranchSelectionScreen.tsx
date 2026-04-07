// ============================================
// BRANCH SELECTION SCREEN - IT-Inventory
// Choose between Siège Strasbourg and Agences
// ============================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  Vibration,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_H } = Dimensions.get('window');

// ==================== DECORATIVE ELEMENTS ====================
const BLOBS = [
  { size: 300, x: -100, y: -40, colors: ['rgba(59,130,246,0.06)', 'rgba(59,130,246,0)'] as const },
  { size: 260, x: SCREEN_WIDTH - 80, y: SCREEN_H * 0.4, colors: ['rgba(16,185,129,0.05)', 'rgba(16,185,129,0)'] as const },
  { size: 180, x: -40, y: SCREEN_H * 0.7, colors: ['rgba(139,92,246,0.04)', 'rgba(139,92,246,0)'] as const },
];

const DOTS = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  size: 3 + Math.random() * 3,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_H,
  opacity: 0.04 + Math.random() * 0.06,
  color: ['#3B82F6', '#10B981', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 4)],
}));

// ==================== BRANCH CONFIG ====================
const BRANCHES = [
  {
    key: 'strasbourg',
    label: 'Strasbourg Général',
    subtitle: 'Site principal',
    icon: 'city-variant-outline',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
  },
  {
    key: 'agences',
    label: 'Agences',
    subtitle: 'Sites régionaux',
    icon: 'office-building-marker-outline',
    gradient: ['#10B981', '#059669'] as [string, string],
  },
];

// ==================== MAIN COMPONENT ====================
export const BranchSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const params = (route.params ?? {}) as { rememberMe?: boolean };
  const rememberMe = params.rememberMe ?? true;

  // Floating animation
  const pinFloat = useSharedValue(0);

  useEffect(() => {
    pinFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinFloat.value * -6 }],
  }));

  const handleBranchPress = (branchKey: string) => {
    Vibration.vibrate(10);
    navigation.navigate('SiteSelection', { rememberMe, branch: branchKey });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundBase}
      />

      {/* Background decoration */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BLOBS.map((b, i) => (
          <LinearGradient
            key={i}
            colors={b.colors as unknown as string[]}
            style={{
              position: 'absolute',
              width: b.size,
              height: b.size,
              borderRadius: b.size / 2,
              left: b.x,
              top: b.y,
            }}
          />
        ))}
        {DOTS.map(d => (
          <View
            key={d.id}
            style={{
              position: 'absolute',
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              left: d.x,
              top: d.y,
              opacity: d.opacity,
              backgroundColor: d.color,
            }}
          />
        ))}
      </View>

      {/* Logo + Title */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.headerSection}>
        <View style={[styles.logoBox, { shadowColor: colors.primaryDark }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>IT-Inventory</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(650).duration(500)}>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>Gestion de stock IT</Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(800).duration(400)}>
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(0,122,57,0.15)' : '#B2DFDB', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separator}
          />
        </Animated.View>
      </Animated.View>

      {/* Instruction */}
      <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.instructionWrap}>
        <Animated.View style={pinStyle}>
          <Icon name="domain" size={16} color={isDark ? '#4EB35A' : '#007A39'} />
        </Animated.View>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          Sélectionnez votre espace de travail
        </Text>
        <Animated.View style={pinStyle}>
          <Icon name="domain" size={16} color={isDark ? '#4EB35A' : '#007A39'} />
        </Animated.View>
      </Animated.View>

      {/* Branch cards */}
      <View style={styles.list}>
        {BRANCHES.map((branch, index) => (
          <Animated.View
            key={branch.key}
            entering={FadeInUp.delay(800 + index * 150).duration(500)}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleBranchPress(branch.key)}
              style={[
                styles.branchCard,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                  borderColor: isDark ? colors.borderSubtle : '#E8ECF4',
                  shadowColor: isDark ? '#000' : '#64748B',
                },
              ]}
            >
              {/* Icon */}
              <LinearGradient
                colors={branch.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.branchIconCircle}
              >
                <Icon name={branch.icon} size={26} color="#FFF" />
              </LinearGradient>

              {/* Info */}
              <View style={styles.branchInfo}>
                <Text
                  style={[styles.branchName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {branch.label}
                </Text>
                <Text
                  style={[styles.branchSubtitle, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {branch.subtitle}
                </Text>
              </View>

              {/* Chevron */}
              <View
                style={[
                  styles.branchChevronBg,
                  { backgroundColor: isDark ? 'rgba(0,122,57,0.1)' : '#F1F8E9' },
                ]}
              >
                <Icon name="chevron-right" size={20} color={branch.gradient[0]} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View
          style={[
            styles.footerBadge,
            { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' },
          ]}
        >
          <Icon name="shield-check-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Données protégées et chiffrées
          </Text>
        </View>
        <Text style={[styles.versionText, { color: isDark ? colors.textMuted : '#CBD5E1' }]}>
          Version 1.5.0
        </Text>
      </View>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 8,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  separator: {
    width: 160,
    height: 1.5,
    borderRadius: 1,
  },

  // Instruction
  instructionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flex: 1,
  },

  // Branch Card
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    minHeight: 80,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  branchIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  branchSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  branchChevronBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 12,
    gap: 6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '400',
  },
});

export default BranchSelectionScreen;
