import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SCAN_COLORS } from './tokens';

type ScanStockBarProps = {
  progress: number;
  color: string;
};

export const ScanStockBar: React.FC<ScanStockBarProps> = ({ progress, color }) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 500 });
  }, [animatedProgress, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View style={styles.rail}>
      <Animated.View style={[styles.fill, fillStyle, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  rail: {
    marginTop: 10,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: SCAN_COLORS.bg_card,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
