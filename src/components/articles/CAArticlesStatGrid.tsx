import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface ArticleStats {
  total:      number;
  stockOk:    number;
  alertes:    number;
  defectueux: number;
}

const useCountUp = (end: number, duration: number = 500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

const STAT_CONFIG = [
  {
    key:     'total',
    label:   'Total',
    icon:    'package-variant-closed',
    variant: 'success' as const,
    tag:     'Tous',
    getVal:  (s: ArticleStats) => s.total,
  },
  {
    key:     'stockOk',
    label:   'Stock OK',
    icon:    'check-circle-outline',
    variant: 'success' as const,
    tag:     'Dispo',
    getVal:  (s: ArticleStats) => s.stockOk,
  },
  {
    key:     'alertes',
    label:   'Alertes',
    icon:    'alert-circle-outline',
    variant: 'warning' as const,
    tag:     'Critique',
    getVal:  (s: ArticleStats) => s.alertes,
  },
  {
    key:     'defectueux',
    label:   'Défectueux',
    icon:    'hammer-wrench',
    variant: 'danger' as const,
    tag:     'À vérifier',
    getVal:  (s: ArticleStats) => s.defectueux,
  },
] as const;

export const CAArticlesStatGrid = ({
  stats,
  activeFilter,
  onFilterChange,
}: {
  stats:           ArticleStats;
  activeFilter:    string | null;
  onFilterChange:  (key: string | null) => void;
}) => (
  <View style={styles.grid}>
    {STAT_CONFIG.map((conf) => {
      const value   = conf.getVal(stats);
      const isActive = activeFilter === conf.key;

      return (
        <Pressable
          key={conf.key}
          onPress={() => onFilterChange(isActive ? null : conf.key)}
          style={[
            styles.card,
            { borderTopColor: VARIANT_COLORS[conf.variant].topBar },
            isActive && styles.cardActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${conf.label} : ${value}`}
          accessibilityState={{ selected: isActive }}
        >
          {/* Icône */}
          <View style={[
            styles.iconWrap,
            { backgroundColor: VARIANT_COLORS[conf.variant].iconBg }
          ]}>
            <Icon
              name={conf.icon}
              size={14}
              color={VARIANT_COLORS[conf.variant].iconColor}
            />
          </View>

          {/* Nombre */}
          <Text style={[
            styles.number,
            conf.variant !== 'success' && {
              color: VARIANT_COLORS[conf.variant].numberColor,
            },
          ]}>
            {useCountUp(value, 500)}
          </Text>

          {/* Label */}
          <Text style={styles.label}>{conf.label}</Text>

          {/* Tag filtrage */}
          <View style={[
            styles.tag,
            { backgroundColor: VARIANT_COLORS[conf.variant].tagBg }
          ]}>
            <Text style={[
              styles.tagText,
              { color: VARIANT_COLORS[conf.variant].tagColor }
            ]}>
              {conf.tag}
            </Text>
          </View>

          {/* Barre mini */}
          <View style={[
            styles.miniBar,
            { backgroundColor: VARIANT_COLORS[conf.variant].topBar },
          ]} />
        </Pressable>
      );
    })}
  </View>
);

const VARIANT_COLORS = {
  success: {
    topBar:      CA_THEME.green,
    iconBg:      CA_THEME.greenBg,
    iconColor:   CA_THEME.green,
    numberColor: CA_THEME.textPrimary,
    tagBg:       CA_THEME.greenBg,
    tagColor:    CA_THEME.greenText,
  },
  warning: {
    topBar:      CA_THEME.warning,
    iconBg:      CA_THEME.warningBg,
    iconColor:   CA_THEME.warning,
    numberColor: CA_THEME.warning,
    tagBg:       CA_THEME.warningBg,
    tagColor:    CA_THEME.warning,
  },
  danger: {
    topBar:      CA_THEME.danger,
    iconBg:      CA_THEME.dangerBg,
    iconColor:   CA_THEME.danger,
    numberColor: CA_THEME.danger,
    tagBg:       CA_THEME.dangerBg,
    tagColor:    CA_THEME.danger,
  },
};

const styles = StyleSheet.create({
  grid: {
    display:       'flex',
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
    paddingHorizontal: 12,
    paddingTop:    12,
    paddingBottom: 8,
    backgroundColor: CA_THEME.lightGray,
  },
  card: {
    width:           '47.5%',
    backgroundColor: CA_THEME.white,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderTopWidth:  3,
    padding:         10,
    overflow:        'hidden',
  },
  cardActive: {
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation:    3,
  },
  iconWrap: {
    width:         26,
    height:        26,
    borderRadius:  6,
    alignItems:    'center',
    justifyContent: 'center',
    marginBottom:  6,
  },
  number: {
    fontSize:      24,
    fontFamily:    CA_THEME.fontFamilyBold,
    fontWeight:    '700',
    color:         CA_THEME.textPrimary,
    lineHeight:    28,
    marginBottom:  2,
    fontVariant:   ['tabular-nums'],
  },
  label: {
    fontSize:       9,
    fontFamily:     CA_THEME.fontFamilyBold,
    fontWeight:     '700',
    textTransform:  'uppercase',
    letterSpacing:  0.8,
    color:          CA_THEME.textMuted,
    marginBottom:   6,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:      4,
    alignSelf:         'flex-start',
  },
  tagText:  { fontSize: 9, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
  miniBar:  { height: 2, borderRadius: 1, marginTop: 8, width: '60%' },
});
