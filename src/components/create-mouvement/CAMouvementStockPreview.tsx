import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, MOVEMENT_TYPE_CA } from '@/constants/caTheme';
import type { MovementType } from './CAMouvementTypeGrid';

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
  const maxBar    = Math.max(stockBefore, stockAfter, threshold ?? 0) * 1.2;
  const beforePct = maxBar > 0 ? (stockBefore / maxBar) * 100 : 0;
  const afterPct  = maxBar > 0 ? (stockAfter  / maxBar) * 100 : 0;

  return (
    <View style={styles.card}>

      {/* Nums : avant → après */}
      <View style={styles.numsRow}>
        <View style={styles.numBlock}>
          <Text style={styles.numBefore} aria-label={`Stock actuel : ${stockBefore}`}>
            {stockBefore}
          </Text>
          <Text style={styles.numLabel}>Stock actuel</Text>
        </View>

        <View style={styles.arrowWrap}>
          <Icon name="arrow-right" size={22} color={typeConf.color} />
        </View>

        <View style={styles.numBlock}>
          <Text style={[styles.numAfter, { color: typeConf.color }]}
            aria-label={`Nouveau stock : ${stockAfter}`}>
            {stockAfter}
          </Text>
          <Text style={styles.numLabel}>Nouveau stock</Text>
        </View>
      </View>

      {/* Barre comparative */}
      <View style={styles.barWrap}>
        <View style={styles.barTrack}>
          {/* Barre avant (gris) */}
          <View style={[styles.barBefore, { width: `${beforePct}%` }]} />
          {/* Barre après (couleur type) */}
          <View style={[styles.barAfter, { width: `${afterPct}%`, backgroundColor: typeConf.color }]} />
        </View>
        <View style={styles.barLabels}>
          <Text style={styles.barLabelLeft}>Actuel ({stockBefore})</Text>
          <Text style={[styles.barLabelRight, { color: typeConf.color }]}>
            Cible ({stockAfter})
          </Text>
        </View>
      </View>

      {/* Alerte si nouveau stock sous le seuil */}
      {isBelow && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.alertRow}>
          <Icon name="alert-circle-outline" size={13} color={CA_THEME.warning} />
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
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    padding:         14,
  },
  numsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 14 },
  numBlock: { alignItems: 'center', gap: 4 },
  numBefore: { fontSize: 32, fontWeight: '800', color: CA_THEME.textMuted },
  numAfter:  { fontSize: 32, fontWeight: '800' },
  numLabel:  {
    fontSize: 9, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: CA_THEME.textMuted,
  },
  arrowWrap: { alignItems: 'center', justifyContent: 'center' },
  barWrap:   { gap: 5 },
  barTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: CA_THEME.borderGray,
    overflow: 'hidden', position: 'relative',
  },
  barBefore: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: CA_THEME.textMuted, opacity: 0.35,
  },
  barAfter: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: 4,
  },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabelLeft:  { fontSize: 10, color: CA_THEME.textMuted },
  barLabelRight: { fontSize: 10, fontWeight: '600' },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 10, padding: 8, borderRadius: 8,
    backgroundColor: CA_THEME.warningBg,
    borderWidth: 1, borderColor: 'rgba(230,81,0,0.22)',
  },
  alertText: { flex: 1, fontSize: 11, color: CA_THEME.warningText, lineHeight: 16 },
});
