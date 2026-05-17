import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  identity: MovementIdentity;
  current: number;
  target: number;
}

export const StockProgressBar: React.FC<Props> = ({ identity, current, target }) => {
  const max = Math.max(1, current, target);
  const currentPct = current / max;
  const targetPct = target / max;
  const isDecrease = target < current;

  const currentProgress = useSharedValue(currentPct);
  const targetProgress = useSharedValue(targetPct);

  useEffect(() => {
    currentProgress.value = withTiming(currentPct, { duration: 200 });
    targetProgress.value = withTiming(targetPct, { duration: 200 });
  }, [currentPct, currentProgress, targetPct, targetProgress]);

  const currentStyle = useAnimatedStyle(() => ({
    width: `${currentProgress.value * 100}%` as const,
  }));

  const targetStyle = useAnimatedStyle(() => ({
    left: `${Math.min(currentProgress.value, targetProgress.value) * 100}%` as const,
    width: `${Math.abs(targetProgress.value - currentProgress.value) * 100}%` as const,
  }));

  const markerStyle = useAnimatedStyle(() => ({
    left: `${currentProgress.value * 100}%` as const,
  }));

  return (
    <View>
      <View style={styles.track}>
        <Animated.View style={[styles.currentFill, { backgroundColor: `${identity.color}66` }, currentStyle]} />
        <Animated.View
          style={[styles.deltaFill, { backgroundColor: isDecrease ? MOVEMENT_COLORS.danger : identity.color }, targetStyle]}
        />
        <Animated.View style={[styles.currentMarker, markerStyle]} />
      </View>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Actuel ({current})</Text>
        <Text style={styles.legendText}>Cible ({target})</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    marginTop: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: MOVEMENT_COLORS.bg_card_elevated,
    overflow: 'hidden',
  },
  currentFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  deltaFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  currentMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: '#FFFFFF',
  },
  legendRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '600',
  },
});
