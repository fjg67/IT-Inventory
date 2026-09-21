import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CASparkline } from './CASparkline';

interface CAStatCardProps {
  value:     number;
  label:     string;
  icon:      string;
  trend?:    string;
  variant:   'success' | 'danger' | 'warning' | 'info';
  badge?:    string | number;
  sparklineData?: number[];
  onPress?:  () => void;
}

const VARIANT_STYLES = {
  success: {
    topBar:     CA_THEME.green,
    iconBg:     CA_THEME.greenBg,
    iconColor:  CA_THEME.green,
    badgeBg:    CA_THEME.greenBg,
    badgeColor: CA_THEME.greenText,
    barColor:   CA_THEME.green,
  },
  danger: {
    topBar:     CA_THEME.danger,
    iconBg:     CA_THEME.dangerBg,
    iconColor:  CA_THEME.danger,
    badgeBg:    CA_THEME.danger,
    badgeColor: CA_THEME.white,
    barColor:   CA_THEME.danger,
  },
  warning: {
    topBar:     CA_THEME.warning,
    iconBg:     CA_THEME.warningBg,
    iconColor:  CA_THEME.warning,
    badgeBg:    CA_THEME.warningBg,
    badgeColor: CA_THEME.warning,
    barColor:   CA_THEME.warning,
  },
  info: {
    topBar:     CA_THEME.info,
    iconBg:     CA_THEME.infoBg,
    iconColor:  CA_THEME.info,
    badgeBg:    CA_THEME.infoBg,
    badgeColor: CA_THEME.info,
    barColor:   CA_THEME.info,
  },
};

export const CAStatCard = ({
  value, label, icon, trend, variant, badge, sparklineData, onPress
}: CAStatCardProps) => {
  const v = VARIANT_STYLES[variant];

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderTopColor: v.topBar }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: v.iconBg }]}>
          <Icon name={icon} size={18} color={v.iconColor} />
        </View>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: v.badgeBg }]}>
            <Text style={[styles.badgeText, { color: v.badgeColor }]}>
              {typeof badge === 'string' ? badge : `+${badge}%`}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: variant === 'danger' ? v.iconColor : CA_THEME.textPrimary }]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>

      {/* Barre ou Sparkline en bas */}
      {sparklineData && sparklineData.length > 0 ? (
        <View style={styles.sparklineContainer}>
          <CASparkline
            data={sparklineData}
            width={120}
            height={36}
            lineColor={v.barColor}
            fillColor={v.barColor}
            strokeWidth={2.5}
          />
        </View>
      ) : (
        <View style={[styles.miniBar, { backgroundColor: v.barColor, width: `${Math.min(value * 2, 100)}%` }]} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex:             1,
    backgroundColor:  CA_THEME.white,
    borderRadius:     10,
    borderWidth:      1,
    borderColor:      CA_THEME.borderGray,
    borderTopWidth:   3,
    padding:          14,
    overflow:         'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
  value: { fontSize: 26, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', lineHeight: 32, marginBottom: 3, fontVariant: ['tabular-nums'] },
  label: { fontSize: 12, color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilyMedium, fontWeight: '500' },
  sparklineContainer: { marginTop: 8, height: 36, alignSelf: 'stretch', alignItems: 'center' },
  miniBar: { height: 3, borderRadius: 2, marginTop: 12 },
});
