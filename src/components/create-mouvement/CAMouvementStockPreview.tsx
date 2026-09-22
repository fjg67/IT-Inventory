import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, MOVEMENT_TYPE_CA } from '@/constants/caTheme';
import type { MovementType } from './CAMouvementTypeGrid';
import LinearGradient from 'react-native-linear-gradient';

interface CAMouvementStockPreviewProps {
  stockBefore:  number;
  stockAfter:   number;
  movementType: MovementType;
  quantity:     number;
  threshold?:   number;
}

export const CAMouvementStockPreview = ({
  stockBefore, stockAfter, movementType, quantity, threshold,
}: CAMouvementStockPreviewProps) => {
  const typeConf  = MOVEMENT_TYPE_CA[movementType];
  const isBelow   = threshold !== undefined && stockAfter <= threshold;
  const isIncrease = stockAfter >= stockBefore;
  const maxBar    = Math.max(stockBefore, stockAfter, threshold ?? 0) * 1.2;
  const beforePct = maxBar > 0 ? (stockBefore / maxBar) * 100 : 0;
  const afterPct  = maxBar > 0 ? (stockAfter  / maxBar) * 100 : 0;
  const diff      = stockAfter - stockBefore;
  const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;

  const animatedAfterStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${afterPct}%`, { damping: 14, stiffness: 90 }),
    };
  }, [afterPct]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: isBelow 
        ? withRepeat(withTiming(0.4, { duration: 800 }), -1, true)
        : 1,
    };
  }, [isBelow]);

  return (
    <View style={styles.card}>

      {/* ─── Header ─── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Icon name="swap-vertical" size={16} color={typeConf.color} />
          <Text style={styles.headerTitle}>Aperçu du stock</Text>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: typeConf.color + '18' }]}>
          <Icon 
            name={isIncrease ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={typeConf.color} 
          />
          <Text style={[styles.diffText, { color: typeConf.color }]}>{diffLabel}</Text>
        </View>
      </View>

      {/* ─── Nums : avant → après ─── */}
      <View style={styles.numsRow}>

        {/* Before */}
        <View style={styles.numCard}>
          <Text style={styles.numLabel}>AVANT</Text>
          <Text style={styles.numBefore}>{stockBefore}</Text>
          <Text style={styles.numUnit}>unités</Text>
        </View>

        {/* Arrow */}
        <View style={[styles.arrowCircle, { backgroundColor: typeConf.color + '15' }]}>
          <Icon name="chevron-right" size={24} color={typeConf.color} />
        </View>

        {/* After */}
        <View style={[styles.numCard, styles.numCardAfter]}>
          <Text style={[styles.numLabel, { color: typeConf.color }]}>APRÈS</Text>
          <Text style={[styles.numAfter, { color: typeConf.color }]}>{stockAfter}</Text>
          <Text style={[styles.numUnit, { color: typeConf.color + '99' }]}>unités</Text>
        </View>

      </View>

      {/* ─── Barre de progression ─── */}
      <View style={styles.barSection}>
        <View style={styles.barTrack}>
          {/* Fond dégradé pour la barre avant */}
          <View style={[styles.barBefore, { width: `${beforePct}%` }]}>
            <LinearGradient
              colors={['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          {/* Barre après avec dégradé coloré */}
          <Animated.View style={[styles.barAfter, animatedAfterStyle]}>
            <LinearGradient
              colors={[typeConf.color + '88', typeConf.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>
        
        <View style={styles.barLabels}>
          <View style={styles.barLabelItem}>
            <View style={[styles.barLegendDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.barLabelText}>Actuel ({stockBefore})</Text>
          </View>
          <View style={styles.barLabelItem}>
            <View style={[styles.barLegendDot, { backgroundColor: typeConf.color }]} />
            <Text style={[styles.barLabelText, { color: typeConf.color, fontWeight: '700' }]}>
              Cible ({stockAfter})
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Alerte si nouveau stock sous le seuil ─── */}
      {isBelow && (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.alertRow, pulseStyle]}>
          <View style={styles.alertIconWrap}>
            <Icon name="alert-circle" size={16} color="#F59E0B" />
          </View>
          <Text style={styles.alertText}>
            Le stock passera sous le seuil d'alerte ({threshold} unités)
          </Text>
        </Animated.View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    padding:         18,
    gap:             16,
    elevation:       3,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
  },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: CA_THEME.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  // ─── Numbers ───
  numsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: CA_THEME.lightGray,
    gap: 2,
  },
  numCardAfter: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: CA_THEME.borderGray,
    borderStyle: 'dashed',
  },
  numBefore: {
    fontSize: 36,
    fontWeight: '900',
    color: CA_THEME.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  numAfter: {
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  numLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: CA_THEME.textMuted,
  },
  numUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: CA_THEME.textMuted,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },

  // ─── Bar ───
  barSection: { gap: 6 },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: CA_THEME.lightGray,
    overflow: 'hidden',
    position: 'relative',
  },
  barBefore: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barAfter: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barLabelText: {
    fontSize: 10,
    color: CA_THEME.textMuted,
    fontWeight: '600',
  },

  // ─── Alert ───
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 17,
  },
});
