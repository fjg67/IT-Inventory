import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';
import { StockProgressBar } from './StockProgressBar';

interface Props {
  identity: MovementIdentity;
  currentStock: number;
  newStock: number;
  stockMin: number;
}

export const StockPreviewCard: React.FC<Props> = ({ identity, currentStock, newStock, stockMin }) => {
  const arrowX = useSharedValue(-3);
  const low = newStock <= stockMin && newStock > 0;
  const danger = newStock === 0;

  useEffect(() => {
    arrowX.value = withRepeat(withSequence(withTiming(3, { duration: 900 }), withTiming(-3, { duration: 900 })), -1, true);
  }, [arrowX]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <View style={[styles.card, { borderColor: identity.border }, low && styles.warning, danger && styles.danger]}>
      <View style={styles.topRow}>
        <View style={styles.col}>
          <Text style={styles.oldNum}>{currentStock}</Text>
          <Text style={styles.label}>Stock actuel</Text>
        </View>
        <Animated.View style={[styles.arrowWrap, arrowStyle]}>
          <Icon name="arrow-right" size={20} color={identity.color} />
        </Animated.View>
        <View style={styles.col}>
          <Text style={[styles.newNum, { color: identity.color }]}>{newStock}</Text>
          <Text style={styles.label}>Nouveau stock</Text>
        </View>
      </View>

      <StockProgressBar identity={identity} current={currentStock} target={newStock} />

      {danger ? <Text style={[styles.badge, { color: MOVEMENT_COLORS.danger }]}>RUPTURE</Text> : null}
      {low ? <Text style={[styles.badge, { color: MOVEMENT_COLORS.warning }]}>ALERTE</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  warning: {
    backgroundColor: MOVEMENT_COLORS.warning_subtle,
  },
  danger: {
    backgroundColor: MOVEMENT_COLORS.danger_subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  oldNum: {
    fontSize: 36,
    fontWeight: '900',
    color: MOVEMENT_COLORS.text_muted,
  },
  newNum: {
    fontSize: 36,
    fontWeight: '900',
  },
  label: {
    marginTop: 2,
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  arrowWrap: {
    width: 30,
    alignItems: 'center',
  },
  badge: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
  },
});
