import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SETTINGS_COLORS, getComplianceVisual } from '@/constants/settingsColors';
import { useCountUp } from '@/hooks/useCountUp';
import { AuditMiniStatCard } from './AuditMiniStatCard';

interface AuditPulseWidgetProps {
  daysSinceRecount: number | null;
  lastRecountDateLabel: string;
  siteName: string;
  recountLoading: boolean;
  onExplore: () => void;
  onRecount: () => void;
}

export const AuditPulseWidget: React.FC<AuditPulseWidgetProps> = ({
  daysSinceRecount,
  lastRecountDateLabel,
  siteName,
  recountLoading,
  onExplore,
  onRecount,
}) => {
  const visual = getComplianceVisual(daysSinceRecount);
  const count = useCountUp(daysSinceRecount ?? 0, { duration: 800 });
  const progress = useSharedValue(0);
  const shake = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    const ratio = daysSinceRecount == null ? 0.5 : Math.min(1, Math.max(0, daysSinceRecount / 60));
    progress.value = withTiming(ratio, { duration: 800 });

    if ((daysSinceRecount ?? 0) > 30) {
      shake.value = withSequence(
        withTiming(-2, { duration: 45 }),
        withTiming(2, { duration: 45 }),
        withTiming(-2, { duration: 45 }),
        withTiming(2, { duration: 45 }),
        withTiming(0, { duration: 45 }),
      );
    }
  }, [daysSinceRecount, progress, shake]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const handleRecountPress = () => {
    spin.value = 0;
    spin.value = withRepeat(withTiming(360, { duration: 600 }), 1, false);
    onRecount();
  };

  return (
    <View style={[styles.card, { backgroundColor: visual.tint, borderColor: visual.borderColor }]}> 
      <View style={styles.topBarTrack}>
        <Animated.View style={[styles.topBarFill, { backgroundColor: visual.status.text }, barStyle]} />
      </View>

      <View style={styles.topRow}>
        <View>
          <View style={styles.eyebrowRow}>
            <Icon name="shield-check-outline" size={14} color={SETTINGS_COLORS.text_secondary} />
            <Text style={styles.eyebrow}>AUDIT INVENTAIRE</Text>
          </View>
          <Text style={styles.title}>Pulse du stock</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: visual.status.bg }]}> 
          <View style={[styles.statusDot, { backgroundColor: visual.status.text }]} />
          <Text style={[styles.statusText, { color: visual.status.text }]}>{visual.status.label}</Text>
        </View>
      </View>

      <Animated.View style={[styles.bigValueWrap, shakeStyle]}>
        <Text style={[styles.bigValue, { color: visual.status.text }]}>{count} j</Text>
        <Text style={styles.bigCaption}>depuis le dernier controle</Text>
      </Animated.View>

      <View style={styles.sitePill}>
        <Icon name="map-marker-outline" size={12} color={SETTINGS_COLORS.text_muted} />
        <Text style={styles.siteText}>{siteName}</Text>
      </View>

      <View style={styles.grid}>
        <AuditMiniStatCard icon="calendar" label="Dernier inventaire" value={lastRecountDateLabel} iconColor={SETTINGS_COLORS.info} />
        <AuditMiniStatCard
          icon="timer-sand"
          label="Jours ecoules"
          value={daysSinceRecount == null ? '--' : `${daysSinceRecount}j`}
          iconColor={SETTINGS_COLORS.warning}
        />
      </View>

      <View style={[styles.complianceRow, { backgroundColor: SETTINGS_COLORS.bg_card_elevated }]}> 
        <Icon name="target" size={14} color={visual.status.text} />
        <Text style={styles.complianceLabel}>Niveau de conformite</Text>
        <Text style={[styles.complianceValue, { color: visual.status.text }]}>{visual.status.label}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.exploreBtn} onPress={onExplore}>
          <Icon name="chart-box-outline" size={14} color={SETTINGS_COLORS.green_light} />
          <Text style={styles.exploreText}>Explorer</Text>
        </Pressable>

        <Pressable style={[styles.recountBtn, recountLoading && { opacity: 0.7 }]} disabled={recountLoading} onPress={handleRecountPress}>
          {recountLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Animated.View style={[styles.recountIconWrap, spinStyle]}>
              <Icon name="refresh" size={15} color="#FFFFFF" />
            </Animated.View>
          )}
          <Text style={styles.recountText}>Relancer le controle</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  topBarTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  topBarFill: {
    height: 3,
    borderRadius: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    color: SETTINGS_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 4,
    color: SETTINGS_COLORS.text_primary,
    fontSize: 18,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bigValueWrap: {
    marginTop: 14,
    alignItems: 'center',
  },
  bigValue: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 56,
  },
  bigCaption: {
    marginTop: 4,
    color: SETTINGS_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
  sitePill: {
    marginTop: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  siteText: {
    color: SETTINGS_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  complianceRow: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complianceLabel: {
    color: SETTINGS_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
  complianceValue: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  exploreBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_accent,
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exploreText: {
    color: SETTINGS_COLORS.green_light,
    fontSize: 13,
    fontWeight: '600',
  },
  recountBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: SETTINGS_COLORS.green_primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recountIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
