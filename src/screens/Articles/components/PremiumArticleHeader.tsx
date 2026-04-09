import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import AnimatedCounter from '../../Dashboard/components/effects/AnimatedCounter';
import {
  premiumSpacing,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

// ─── Stat Card Config ───
interface StatConfig {
  icon: string;
  gradient: readonly [string, string];
}

const STAT_CONFIGS: Record<string, StatConfig> = {
  total: {
    icon: 'package-variant-closed',
    gradient: ['#007A39', '#007A39'],
  },
  stockOK: {
    icon: 'check-circle-outline',
    gradient: ['#10B981', '#059669'],
  },
  alertes: {
    icon: 'alert-circle-outline',
    gradient: ['#F59E0B', '#D97706'],
  },
  available: {
    icon: 'check-circle-outline',
    gradient: ['#3B82F6', '#2563EB'],
  },
};

// ─── Mini Stat Card ───
interface MiniStatProps {
  value: number;
  label: string;
  configKey: 'total' | 'stockOK' | 'alertes' | 'available';
  iconOverride?: string;
  showcaseMode?: boolean;
  pcGridMode?: boolean;
  compactMode?: boolean;
  onPress?: () => void;
}

const MiniStatCard: React.FC<MiniStatProps> = ({
  value,
  label,
  configKey,
  iconOverride,
  showcaseMode = false,
  pcGridMode = false,
  compactMode = false,
  onPress,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();
  const cfg = STAT_CONFIGS[configKey];
  const accentColor = cfg.gradient[0];

  return (
    <TouchableOpacity
      style={[
        miniStyles.wrapper,
        showcaseMode && miniStyles.wrapperShowcase,
        pcGridMode && !tablet && miniStyles.wrapperPcGrid,
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Vibration.vibrate(10);
        onPress?.();
      }}
    >
      <View style={[
        miniStyles.card,
        showcaseMode && miniStyles.cardShowcase,
        compactMode && miniStyles.cardCompact,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
        },
      ]}>
        {showcaseMode && <View style={miniStyles.showcaseOrb} />}

        {/* Left accent bar */}
        <LinearGradient
          colors={[...cfg.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={miniStyles.accentBar}
        />

        {/* Icon pill */}
        <View style={[miniStyles.iconShadow, { shadowColor: accentColor }]}>
          <LinearGradient
            colors={[...cfg.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              miniStyles.iconPill,
              tablet && miniStyles.iconPillTablet,
              showcaseMode && miniStyles.iconPillShowcase,
              compactMode && miniStyles.iconPillCompact,
            ]}
          >
            <View style={[miniStyles.iconInner, showcaseMode && miniStyles.iconInnerShowcase, compactMode && miniStyles.iconInnerCompact]}>
              <Icon
                name={iconOverride ?? cfg.icon}
                size={compactMode ? (tablet ? 13 : 12) : showcaseMode ? (tablet ? 18 : 16) : (tablet ? 14 : 12)}
                color={accentColor}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Value */}
        <AnimatedCounter
          value={value}
          style={{
            fontSize: compactMode ? (tablet ? 22 : 20) : showcaseMode ? (tablet ? 34 : 28) : (tablet ? 30 : 24),
            fontWeight: '900',
            color: colors.textPrimary,
            letterSpacing: -1,
          }}
        />

        {/* Label */}
        <Text
          style={[
            miniStyles.label,
            showcaseMode && miniStyles.labelShowcase,
            { color: colors.textMuted },
            tablet && { fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const miniStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  wrapperShowcase: {
    flex: 0,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  wrapperPcGrid: {
    flexBasis: '48%',
    maxWidth: '48%',
  },
  card: {
    alignItems: 'center',
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardShowcase: {
    width: '100%',
    minWidth: 220,
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 14,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardCompact: {
    borderRadius: 14,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 6,
  },
  showcaseOrb: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    top: -30,
    right: -24,
    backgroundColor: 'rgba(0,122,57,0.08)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillTablet: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },
  iconPillShowcase: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  iconPillCompact: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  iconInner: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerShowcase: {
    width: 24,
    height: 24,
    borderRadius: 9,
  },
  iconInnerCompact: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  labelShowcase: {
    letterSpacing: 0.9,
  },
});

// ─── Main Header ───
interface PremiumArticleHeaderProps {
  title?: string;
  mode?: 'articles' | 'tablettes' | 'pc';
  statsMode?: 'full' | 'totalOnly';
  totalArticles: number;
  stockOK: number;
  alertes: number;
  pcHot?: number;
  pcReconditioning?: number;
  pcAvailable?: number;
  onAdd: () => void;
  onBack?: () => void;
  onTotalPress?: () => void;
  onStockOKPress?: () => void;
  onAlertesPress?: () => void;
  onAvailablePress?: () => void;
}

const PremiumArticleHeader: React.FC<PremiumArticleHeaderProps> = ({
  title = 'Articles',
  mode = 'articles',
  statsMode = 'full',
  totalArticles,
  stockOK,
  alertes,
  pcHot = 0,
  pcReconditioning = 0,
  pcAvailable = 0,
  onAdd,
  onBack,
  onTotalPress,
  onStockOKPress,
  onAlertesPress,
  onAvailablePress,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();
  const isTabletMode = mode === 'tablettes' || statsMode === 'totalOnly';
  const isPCMode = mode === 'pc';

  return (
    <View style={[
      styles.headerCard,
      isPCMode && styles.headerCardCompact,
      {
        backgroundColor: colors.surface,
        borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
      },
    ]}>
      {/* Left accent bar */}
      <LinearGradient
        colors={['#007A39', '#005C2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      {/* Top Row: back + title */}
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={() => {
              Vibration.vibrate(10);
              onBack();
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={[
              styles.backButtonInner,
              { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(0,122,57,0.08)' },
            ]}>
              <Icon name="arrow-left" size={tablet ? 22 : 18} color="#007A39" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIconShadow]}>
              <LinearGradient
                colors={['#007A39', '#005C2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.titleIconPill}
              >
                <View style={styles.titleIconInner}>
                  <Icon
                    name={isTabletMode ? 'tablet-cellphone' : isPCMode ? 'laptop' : 'cube-outline'}
                    size={tablet ? 16 : 14}
                    color="#007A39"
                  />
                </View>
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }, tablet && { fontSize: 26 }]}>
              {title}
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </View>

      {/* Mini Stats */}
      <View style={[
        styles.statsRow,
        tablet && { gap: premiumSpacing.md },
        (isTabletMode || isPCMode) && styles.statsRowSingle,
        isPCMode && styles.statsRowPc,
      ]}>
        <MiniStatCard
          value={totalArticles}
          label={isTabletMode ? 'Tablettes' : isPCMode ? 'PC portables' : 'Total'}
          configKey="total"
          iconOverride={isTabletMode ? 'tablet-cellphone' : isPCMode ? 'laptop' : undefined}
          showcaseMode={isTabletMode}
          pcGridMode={isPCMode}
          compactMode={isPCMode}
          onPress={onTotalPress}
        />
        {isPCMode ? (
          <>
            <MiniStatCard
              value={pcHot}
              label="A chaud"
              configKey="stockOK"
              iconOverride="flash-outline"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
              onPress={onStockOKPress}
            />
            <MiniStatCard
              value={pcReconditioning}
              label="A reusiner"
              configKey="alertes"
              iconOverride="wrench-outline"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
              onPress={onAlertesPress}
            />
            <MiniStatCard
              value={pcAvailable}
              label="Disponible"
              configKey="available"
              iconOverride="check-circle-outline"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
              onPress={onAvailablePress}
            />
          </>
        ) : statsMode === 'full' && (
          <>
            <MiniStatCard
              value={stockOK}
              label="Stock OK"
              configKey="stockOK"
              onPress={onStockOKPress}
            />
            <MiniStatCard
              value={alertes}
              label="Alertes"
              configKey="alertes"
              onPress={onAlertesPress}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    marginHorizontal: premiumSpacing.lg,
    marginTop: premiumSpacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    paddingLeft: 22,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  headerCardCompact: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingLeft: 18,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: premiumSpacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIconShadow: {
    shadowColor: '#007A39',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  titleIconPill: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIconInner: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm + 2,
  },
  statsRowSingle: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: premiumSpacing.xs,
  },
  statsRowPc: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    rowGap: premiumSpacing.xs,
  },
});

export default PremiumArticleHeader;
