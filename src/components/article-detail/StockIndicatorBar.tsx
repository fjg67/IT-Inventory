import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ADC } from './articleDetailColors';

interface StockIndicatorBarProps {
  current: number;
  min: number;
}

export const StockIndicatorBar: React.FC<StockIndicatorBarProps> = ({ current, min }) => {
  const max = Math.max(min * 4, current, 1);
  const ratio = Math.min(current / max, 1);
  const isOut = current === 0;
  const isCritical = current <= min && !isOut;
  const isOk = current > min;

  const color = isOut ? ADC.danger : isCritical ? ADC.warning : ADC.green_light;
  const label = isOut
    ? 'Rupture de stock'
    : isCritical
    ? "Seuil d'alerte atteint"
    : 'Stock OK';

  const barWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    barWidth.value = withTiming(ratio * 100, { duration: 700, easing: Easing.out(Easing.quad) });
    if (!isOk) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        false,
      );
    }
  }, [ratio, isOk]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%` as `${number}%`,
    opacity: isOk ? 1 : pulseOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.container}>
      <View style={styles.rail}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, barStyle]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.counts}>
          {current}/{max} unités
        </Text>
        <View style={styles.statusRow}>
          {(isOut || isCritical) && (
            <View style={[styles.urgentBadge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
              <Text style={[styles.urgentText, { color }]}>
                {isOut ? 'URGENT' : 'ALERTE'}
              </Text>
            </View>
          )}
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ADC.bg_card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    padding: 14,
    gap: 8,
  },
  rail: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ADC.bg_card_elevated,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counts: {
    fontSize: 11,
    fontWeight: '600',
    color: ADC.text_muted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  urgentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  urgentText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
