import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  ZoomIn,
} from 'react-native-reanimated';
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
  processing: {
    icon: 'cog-play-outline',
    gradient: ['#F97316', '#EA580C'],
  },
  available: {
    icon: 'check-circle-outline',
    gradient: ['#3B82F6', '#2563EB'],
  },
  sent: {
    icon: 'send-outline',
    gradient: ['#E11D48', '#BE123C'],
  },
};

// ─── Stock Progress Bar ───
interface StockProgressBarProps {
  stockOK: number;
  total: number;
  alertes: number;
}

const StockProgressBar: React.FC<StockProgressBarProps> = ({ stockOK, total, alertes }) => {
  const { colors, isDark } = useTheme();
  const okRatio = useSharedValue(0);
  const alertRatio = useSharedValue(0);

  useEffect(() => {
    const ok = total > 0 ? Math.max(0, Math.min(1, stockOK / total)) : 0;
    const al = total > 0 ? Math.max(0, Math.min(1 - ok, alertes / total)) : 0;
    okRatio.value = withDelay(200, withTiming(ok, { duration: 800, easing: Easing.out(Easing.cubic) }));
    alertRatio.value = withDelay(350, withTiming(al, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [stockOK, alertes, total, okRatio, alertRatio]);

  const okStyle = useAnimatedStyle(() => ({ width: `${okRatio.value * 100}%` as any }));
  const alertStyle = useAnimatedStyle(() => ({ width: `${alertRatio.value * 100}%` as any }));

  const pct = total > 0 ? Math.round((stockOK / total) * 100) : 0;

  return (
    <View style={pbStyles.wrap}>
      <View style={pbStyles.labelRow}>
        <Text style={[pbStyles.label, { color: colors.textMuted }]}>Taux de disponibilité</Text>
        <Text style={[pbStyles.pct, { color: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }]}>
          {pct}%
        </Text>
      </View>
      <View style={[pbStyles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
        <Animated.View style={[pbStyles.barOK, okStyle]} />
        <Animated.View style={[pbStyles.barAlert, alertStyle]} />
      </View>
      <View style={pbStyles.legendRow}>
        <View style={pbStyles.legendItem}>
          <View style={[pbStyles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[pbStyles.legendText, { color: colors.textMuted }]}>Stock OK ({stockOK})</Text>
        </View>
        <View style={pbStyles.legendItem}>
          <View style={[pbStyles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[pbStyles.legendText, { color: colors.textMuted }]}>Alertes ({alertes})</Text>
        </View>
      </View>
    </View>
  );
};

const pbStyles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pct: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  track: {
    height: 7,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barOK: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  barAlert: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

// ─── Sync Pulse Dot ───
interface SyncPulseDotProps { visible: boolean }
const SyncPulseDot: React.FC<SyncPulseDotProps> = ({ visible }) => {
  const pulse = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [visible, pulse, opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + pulse.value * 0.5 }],
    opacity: opacity.value * (0.5 + pulse.value * 0.5),
  }));

  return (
    <Animated.View style={[syncStyles.dot, dotStyle]} />
  );
};

const syncStyles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
});

// ─── Mini Stat Card ───
interface MiniStatProps {
  value: number;
  label: string;
  configKey: 'total' | 'stockOK' | 'alertes' | 'processing' | 'available' | 'sent';
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
  const pcDenseMode = pcGridMode && !tablet;
  const { colors, isDark } = useTheme();
  const cfg = STAT_CONFIGS[configKey];
  const accentColor = cfg.gradient[0];

  return (
    <TouchableOpacity
      style={[
        miniStyles.wrapper,
        showcaseMode && miniStyles.wrapperShowcase,
        pcDenseMode && miniStyles.wrapperPcGridDense,
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
        pcDenseMode && miniStyles.cardPcDense,
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
                size={compactMode ? (tablet ? 12 : 10) : showcaseMode ? (tablet ? 18 : 16) : (tablet ? 14 : 12)}
                color={accentColor}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Value */}
        <Animated.View key={value} entering={ZoomIn.duration(300).springify().damping(14)}>
          <AnimatedCounter
            value={value}
            style={{
              fontSize: compactMode ? (tablet ? 20 : 16) : showcaseMode ? (tablet ? 34 : 28) : (tablet ? 30 : 24),
              fontWeight: '900',
              color: colors.textPrimary,
              letterSpacing: -1,
            }}
          />
        </Animated.View>

        {/* Label */}
        <Text
          style={[
            miniStyles.label,
            showcaseMode && miniStyles.labelShowcase,
            compactMode && miniStyles.labelCompact,
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
  wrapperPcGridDense: {
    flexBasis: '30.5%',
    maxWidth: '30.5%',
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
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 16,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  cardCompact: {
    borderRadius: 14,
    paddingTop: 8,
    paddingBottom: 7,
    paddingHorizontal: 6,
  },
  cardPcDense: {
    minHeight: 82,
    borderRadius: 14,
  },
  showcaseOrb: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    top: -34,
    right: -28,
    backgroundColor: 'rgba(0,122,57,0.1)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
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
    width: 24,
    height: 24,
    borderRadius: 8,
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
    width: 16,
    height: 16,
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
    letterSpacing: 1,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginTop: 1,
  },
});

// ─── Main Header ───
interface PremiumArticleHeaderProps {
  title?: string;
  mode?: 'articles' | 'pc';
  statsMode?: 'full' | 'totalOnly';
  totalArticles: number;
  stockOK: number;
  alertes: number;
  pcHot?: number;
  pcReconditioning?: number;
  pcProcessing?: number;
  pcAvailable?: number;
  pcSent?: number;
  pcFocusedStats?: {
    label: string;
    total: number;
    agence: number;
    siege: number;
  } | null;
  pcFocusedModels?: Array<{ label: string; count: number }>;
  activePCModelLabel?: string | null;
  tabletDecommissionedCount?: number;
  tabletDecommissionedNames?: string[];
  activeTabletFilter?: 'all' | 'active' | 'decommissioned';
  onAdd: () => void;
  onBack?: () => void;
  onTotalPress?: () => void;
  onStockOKPress?: () => void;
  onAlertesPress?: () => void;
  onProcessingPress?: () => void;
  onAvailablePress?: () => void;
  onSentPress?: () => void;
  onPCModelPress?: (label: string) => void;
  onTabletFilterChange?: (next: 'all' | 'active' | 'decommissioned') => void;
  isSyncing?: boolean;
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
  pcProcessing = 0,
  pcAvailable = 0,
  pcSent = 0,
  pcFocusedStats = null,
  pcFocusedModels = [],
  activePCModelLabel = null,
  tabletDecommissionedCount = 0,
  tabletDecommissionedNames = [],
  activeTabletFilter = 'all',
  isSyncing = false,
  onAdd,
  onBack,
  onTotalPress,
  onStockOKPress,
  onAlertesPress,
  onProcessingPress,
  onAvailablePress,
  onSentPress,
  onPCModelPress,
  onTabletFilterChange,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();
  const isTabletMode = statsMode === 'totalOnly';
  const isPCMode = mode === 'pc';
  const showPCFocusedStats = isPCMode && !!pcFocusedStats;
  const showPCModelsSection = showPCFocusedStats && pcFocusedModels.length > 0;

  return (
    <View style={[
      styles.headerCard,
      isPCMode && styles.headerCardCompact,
      isTabletMode && styles.headerCardTabletMode,
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

      {isTabletMode && (
        <>
          <View pointerEvents="none" style={styles.tabletDecoOrb} />
          <View pointerEvents="none" style={styles.tabletDecoRing} />
        </>
      )}

      {/* Top Row: back + title */}
      <View style={[styles.topRow, isTabletMode && styles.topRowTablet]}>
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
            <SyncPulseDot visible={isSyncing} />
          </View>
        </View>

        <View style={styles.spacer} />
      </View>

      {showPCModelsSection && (
        <View style={styles.focusedModelsWrap}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionDot} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Modeles</Text>
            <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.borderSubtle : colors.borderMedium }]} />
          </View>
          <View style={styles.focusedModelsGrid}>
            {pcFocusedModels.map((item) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.82}
                onPress={() => {
                  Vibration.vibrate(10);
                  onPCModelPress?.(item.label);
                }}
                style={[
                  styles.focusedModelCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      activePCModelLabel === item.label
                        ? '#0EA5E9'
                        : isDark
                          ? colors.borderSubtle
                          : colors.borderMedium,
                  },
                  activePCModelLabel === item.label && styles.focusedModelCardActive,
                ]}
              >
                <LinearGradient
                  colors={activePCModelLabel === item.label ? ['#0284C7', '#0369A1'] : ['#0EA5E9', '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.focusedModelAccent}
                />
                <View style={styles.focusedModelIconWrap}>
                  <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.focusedModelIconPill}>
                    <View style={styles.focusedModelIconInner}>
                      <Icon name="laptop" size={12} color="#0369A1" />
                    </View>
                  </LinearGradient>
                </View>
                <Text style={[styles.focusedModelCountText, { color: colors.textPrimary }]}>{item.count}</Text>
                <Text style={[styles.focusedModelCardLabel, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Mini Stats */}
      {showPCFocusedStats && (
        <View style={styles.sectionHeadingRow}>
          <View style={[styles.sectionDot, styles.sectionDotStats]} />
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Repartition</Text>
          <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.borderSubtle : colors.borderMedium }]} />
        </View>
      )}
      <View style={[
        styles.statsRow,
        tablet && { gap: premiumSpacing.md },
        isTabletMode && styles.statsRowSingle,
        isPCMode && styles.statsRowPc,
      ]}>
        {showPCFocusedStats ? (
          <>
            <MiniStatCard
              value={pcFocusedStats.total}
              label={pcFocusedStats.label}
              configKey="total"
              iconOverride="counter"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
            />
            <MiniStatCard
              value={pcFocusedStats.agence}
              label="Portable agence"
              configKey="stockOK"
              iconOverride="office-building-outline"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
            />
            <MiniStatCard
              value={pcFocusedStats.siege}
              label="Portable siège"
              configKey="available"
              iconOverride="office-building"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
            />
          </>
        ) : (
          <>
        <MiniStatCard
          value={totalArticles}
          label={isPCMode ? 'PC portables' : 'Total'}
          configKey="total"
          iconOverride={isPCMode ? 'laptop' : undefined}
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
              value={pcProcessing}
              label="En usinage"
              configKey="processing"
              iconOverride="cog-play-outline"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
              onPress={onProcessingPress}
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
            <MiniStatCard
              value={pcSent}
              label={pcSent > 1 ? 'Envoyés' : 'Envoyé'}
              configKey="sent"
              iconOverride="send-outline"
              pcGridMode={isPCMode}
              compactMode={isPCMode}
              onPress={onSentPress}
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
          </>
        )}
      </View>

      {/* ─── Progress bar stock OK ─── */}
      {!isPCMode && !isTabletMode && statsMode === 'full' && totalArticles > 0 && (
        <StockProgressBar
          stockOK={stockOK}
          total={totalArticles}
          alertes={alertes}
        />
      )}

      {isTabletMode && (
        <View style={styles.tabletStatusPanel}>
          <View style={styles.tabletStatusFiltersRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onTabletFilterChange?.('all')}
              style={[
                styles.tabletStatusChip,
                {
                  backgroundColor: activeTabletFilter === 'all' ? '#E8F5E9' : colors.backgroundSubtle,
                  borderColor: activeTabletFilter === 'all' ? '#007A39' : colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.tabletStatusChipText, { color: activeTabletFilter === 'all' ? '#007A39' : colors.textSecondary }]}>Toutes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onTabletFilterChange?.('active')}
              style={[
                styles.tabletStatusChip,
                {
                  backgroundColor: activeTabletFilter === 'active' ? '#ECFDF5' : colors.backgroundSubtle,
                  borderColor: activeTabletFilter === 'active' ? '#10B981' : colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.tabletStatusChipText, { color: activeTabletFilter === 'active' ? '#047857' : colors.textSecondary }]}>Actives</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onTabletFilterChange?.('decommissioned')}
              style={[
                styles.tabletStatusChip,
                {
                  backgroundColor: activeTabletFilter === 'decommissioned' ? '#FEF3C7' : colors.backgroundSubtle,
                  borderColor: activeTabletFilter === 'decommissioned' ? '#D97706' : colors.borderSubtle,
                },
              ]}
            >
              <Icon name="power-plug-off-outline" size={12} color={activeTabletFilter === 'decommissioned' ? '#B45309' : colors.textMuted} />
              <Text style={[styles.tabletStatusChipText, { color: activeTabletFilter === 'decommissioned' ? '#B45309' : colors.textSecondary }]}>
                Décom {tabletDecommissionedCount}
              </Text>
            </TouchableOpacity>
          </View>

          {tabletDecommissionedNames.length > 0 && (
            <Text numberOfLines={1} style={[styles.tabletStatusHint, { color: colors.textMuted }]}>
              Décommissionnées: {tabletDecommissionedNames.join(', ')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
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
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingLeft: 16,
  },
  headerCardTabletMode: {
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 18,
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 6,
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
  tabletDecoOrb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -70,
    right: -48,
    backgroundColor: 'rgba(15,118,110,0.08)',
  },
  tabletDecoRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    top: -36,
    right: -30,
    borderWidth: 1,
    borderColor: 'rgba(0,122,57,0.12)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: premiumSpacing.sm,
  },
  topRowTablet: {
    marginBottom: premiumSpacing.md,
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
  focusedModelsWrap: {
    marginBottom: 8,
    paddingHorizontal: 2,
    gap: 4,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  sectionDotStats: {
    backgroundColor: '#059669',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    opacity: 0.8,
  },
  focusedModelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  focusedModelCard: {
    width: '31.8%',
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  focusedModelCardActive: {
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  focusedModelAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  focusedModelIconWrap: {
    marginBottom: 6,
  },
  focusedModelIconPill: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedModelIconInner: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedModelCountText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  focusedModelCardLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 6,
    rowGap: 6,
    paddingHorizontal: 2,
  },
  tabletStatusPanel: {
    marginTop: 10,
    gap: 8,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabletStatusFiltersRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tabletStatusChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabletStatusChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabletStatusHint: {
    width: '100%',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PremiumArticleHeader;
