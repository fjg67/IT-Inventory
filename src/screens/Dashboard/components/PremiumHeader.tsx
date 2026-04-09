import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumSpacing,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { toAbbreviation } from '@/utils/abbreviation';

import { useResponsive } from '@/utils/responsive';

interface PremiumHeaderProps {
  user: {
    firstName: string;
    lastName: string;
  };
  site: {
    name: string;
  } | null;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error' | 'idle';
  syncPendingCount?: number;
  isConnected: boolean;
  supabaseReachable?: boolean;
  onSiteChange: () => void;
}

const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  user,
  site,
  syncStatus: _syncStatus,
  syncPendingCount: _syncPendingCount = 0,
  isConnected: _isConnected,
  supabaseReachable: _supabaseReachable = false,
  onSiteChange,
}) => {
  const { isTablet, fs } = useResponsive();
  const { colors, isDark } = useTheme();

  const initials = toAbbreviation(`${user.firstName} ${user.lastName}`, 3, '?');

  // Greeting based on time
  const { greetingText, greetingEmoji } = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return { greetingText: 'Bonne nuit', greetingEmoji: '🌙' };
    if (h < 12) return { greetingText: 'Bonjour', greetingEmoji: '👋' };
    if (h < 18) return { greetingText: 'Bon après-midi', greetingEmoji: '☀️' };
    return { greetingText: 'Bonsoir', greetingEmoji: '🌆' };
  }, []);

  // Formatted date
  const dateStr = useMemo(() => {
    const now = new Date();
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  }, []);

  // Animated glow pulse
  const glowAnim = useSharedValue(0);
  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [glowAnim]);

  const statusDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(600).springify()}
      style={[styles.outerWrap, { backgroundColor: colors.surface, borderColor: isDark ? colors.borderSubtle : colors.borderMedium }]}
    >
      {/* Left gradient accent bar */}
      <LinearGradient
        colors={['#007A39', '#005C2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      <View style={styles.container}>
        {/* ===== Top Row: Date + Status ===== */}
        <View style={styles.topRow}>
          <View style={styles.dateWrap}>
            <Icon name="calendar-month-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBadge}
          >
            <View style={styles.statusBadgeDot} />
            <Text style={styles.statusBadgeText}>En ligne</Text>
          </LinearGradient>
        </View>

        {/* ===== Main Row: Avatar + Info ===== */}
        <View style={styles.mainRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.iconPillShadow, { shadowColor: '#007A39' }]}>
              <LinearGradient
                colors={['#007A39', '#005C2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.avatar, isTablet && { width: 58, height: 58, borderRadius: 20 }]}
              >
                <View style={[styles.avatarInnerCircle, isTablet && { width: 36, height: 36, borderRadius: 12 }]}>
                  <Text style={[styles.avatarText, isTablet && { fontSize: fs(17) }]}>{initials}</Text>
                </View>
              </LinearGradient>
            </View>
            {/* Online dot */}
            <Animated.View style={[styles.onlineDot, statusDotStyle]}>
              <View style={[styles.onlineDotInner, { borderColor: colors.surface }]} />
            </Animated.View>
          </View>

          {/* Greeting + Name */}
          <View style={styles.userInfo}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: colors.textMuted }, isTablet && { fontSize: fs(18) }]}>
                {greetingText}
              </Text>
              <Text style={styles.waveEmoji}> {greetingEmoji}</Text>
            </View>
            <Text style={[styles.userName, { color: colors.textPrimary }, isTablet && { fontSize: fs(18) }]} numberOfLines={1}>
              {initials}
            </Text>
          </View>
        </View>

        {/* ===== Bottom Row: Site Pill ===== */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Vibration.vibrate(10);
              onSiteChange();
            }}
            style={styles.sitePill}
          >
            <LinearGradient
              colors={['#007A39', '#005C2B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sitePillGradient}
            >
              <View style={styles.siteIconDot}>
                <Icon name="map-marker" size={10} color="#007A39" />
              </View>
              <Text style={styles.sitePillText} numberOfLines={1}>
                {site?.name ?? 'Aucun site'}
              </Text>
              <Icon name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: premiumSpacing.lg + 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  container: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingLeft: 22,
  },

  // Top row: date + status
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },

  // Main row: avatar + info
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  // Avatar
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  iconPillShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#005C2B',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
  },

  // User info
  userInfo: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  waveEmoji: {
    fontSize: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // Bottom row: site pill
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Site pill
  sitePill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sitePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 7,
    borderRadius: 12,
  },
  siteIconDot: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sitePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    maxWidth: 160,
  },
});

export default PremiumHeader;
