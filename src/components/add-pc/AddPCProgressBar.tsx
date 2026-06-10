import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AddPCProgressBarProps {
  progress: number;
  statusColor: string;
}

export const AddPCProgressBar: React.FC<AddPCProgressBarProps> = ({ progress, statusColor }) => {
  const widthProgress = useSharedValue(0);

  useEffect(() => {
    widthProgress.value = withTiming(Math.max(0, Math.min(progress, 1)), { duration: 400 });
  }, [progress, widthProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value * 100}%`,
    backgroundColor: statusColor,
  }));

  return (
    <View style={styles.rail}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  rail: {
    height: 4,
    backgroundColor: 'rgba(148,163,184,0.16)',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
