import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import AnimatedCounter from '../../Dashboard/components/effects/AnimatedCounter';
import {
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

// ─── Stat Card Config ───
interface StatConfig {
  icon: string;
  gradient: readonly [string, string];
  glowColor: string;
}

const STAT_CONFIGS: Record<string, StatConfig> = {
  total: {
    icon: 'package-variant-closed',
    gradient: ['#6366F1', '#4F46E5'],
    glowColor: 'rgba(99, 102, 241, 0.4)',
  },
  stockOK: {
    icon: 'check-circle-outline',
    gradient: ['#10B981', '#059669'],
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  alertes: {
    icon: 'alert-circle-outline',
    gradient: ['#F59E0B', '#D97706'],
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
};

// ─── Mini Stat Card ───
interface MiniStatProps {
  value: number;
  label: string;
  configKey: 'total' | 'stockOK' | 'alertes';
  index: number;
}

const MiniStatCard: React.FC<MiniStatProps> = ({
  value,
  label,
  configKey,
  index,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const cfg = STAT_CONFIGS[configKey];

  return (
    <Animated.View
      entering={SlideInRight.delay(200 + index * 100)
        .duration(500)
        .springify()
        .damping(18)}
      style={miniStyles.wrapper}
    >
      <View style={miniStyles.card}>
        {/* Glow accent line at top */}
        <LinearGradient
          colors={[...cfg.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={miniStyles.accentLine}
        />

        {/* Icon pill */}
        <LinearGradient
          colors={[...cfg.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[miniStyles.iconPill, tablet && miniStyles.iconPillTablet]}
        >
          <Icon
            name={cfg.icon}
            size={tablet ? 16 : 14}
            color="#FFFFFF"
          />
        </LinearGradient>

        {/* Value */}
        <AnimatedCounter
          value={value}
          style={{
            fontSize: tablet ? 30 : 24,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: -1,
          }}
        />

        {/* Label */}
        <Text
          style={[
            miniStyles.label,
            tablet && { fontSize: 12 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
};

const miniStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: premiumBorderRadius.lg,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: premiumBorderRadius.lg,
    borderTopRightRadius: premiumBorderRadius.lg,
  },
  iconPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconPillTablet: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
});

// ─── Decorative Mesh Dots ───
const MESH_DOTS = [
  { top: 8, right: 30, size: 4, opacity: 0.12 },
  { top: 22, right: 58, size: 3, opacity: 0.08 },
  { top: 14, right: 90, size: 5, opacity: 0.1 },
  { top: 38, right: 18, size: 3, opacity: 0.06 },
  { top: 6, left: 40, size: 4, opacity: 0.07 },
  { top: 26, left: 60, size: 3, opacity: 0.09 },
  { top: 50, right: 110, size: 4, opacity: 0.05 },
  { top: 42, left: 90, size: 3, opacity: 0.08 },
];

// ─── Main Header ───
interface PremiumArticleHeaderProps {
  totalArticles: number;
  stockOK: number;
  alertes: number;
  onAdd: () => void;
  onBack?: () => void;
}

const PremiumArticleHeader: React.FC<PremiumArticleHeaderProps> = ({
  totalArticles,
  stockOK,
  alertes,
  onAdd,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, gradients } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <LinearGradient
        colors={['#4338CA', '#6366F1', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          tablet && {
            paddingTop: premiumSpacing.xxl + 4,
            paddingBottom: premiumSpacing.xl,
            paddingHorizontal: premiumSpacing.xl,
          },
        ]}
      >
        {/* Decorative mesh dots */}
        {MESH_DOTS.map((dot, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: dot.top,
              right: dot.right,
              left: (dot as any).left,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: `rgba(255, 255, 255, ${dot.opacity})`,
            }}
          />
        ))}

        {/* Subtle radial glow behind title */}
        <View style={styles.titleGlow} />

        {/* Top Row */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(350)}
          style={styles.topRow}
        >
          {onBack ? (
            <TouchableOpacity
              onPress={() => {
                Vibration.vibrate(10);
                onBack();
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <View style={styles.backButtonInner}>
                <Icon
                  name="arrow-left"
                  size={tablet ? 24 : 20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}

          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                tablet && { fontSize: 30 },
              ]}
            >
              Articles
            </Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.iconButton} />
        </Animated.View>

        {/* Mini Stats */}
        <View
          style={[
            styles.statsRow,
            tablet && { gap: premiumSpacing.md },
          ]}
        >
          <MiniStatCard
            value={totalArticles}
            label="Total"
            configKey="total"
            index={0}
          />
          <MiniStatCard
            value={stockOK}
            label="Stock OK"
            configKey="stockOK"
            index={1}
          />
          <MiniStatCard
            value={alertes}
            label="Alertes"
            configKey="alertes"
            index={2}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: premiumSpacing.xl + 2,
    paddingBottom: premiumSpacing.lg + 4,
    paddingHorizontal: premiumSpacing.lg,
    overflow: 'hidden',
  },
  titleGlow: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    left: '30%',
    width: 140,
    height: 90,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: premiumSpacing.lg + 2,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm + 2,
  },
});

export default PremiumArticleHeader;
