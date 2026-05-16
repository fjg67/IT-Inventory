import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { MovementPeriod } from '@/constants/movementTypes';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PeriodToggleProps {
  value: MovementPeriod;
  onChange: (value: MovementPeriod) => void;
}

export const PeriodToggle: React.FC<PeriodToggleProps> = ({ value, onChange }) => {
  const slide = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const options: Array<{ key: MovementPeriod; label: string; index: number }> = [
    { key: 'today', label: 'Aujourd\'hui', index: 0 },
    { key: '7days', label: '7 jours', index: 1 },
    { key: '30days', label: '30 jours', index: 2 },
  ];

  const activeIndex = options.findIndex((option) => option.key === value);
  slide.value = activeIndex;

  const indicatorWidth = useMemo(() => {
    if (containerWidth <= 0) return 0;
    // Remove wrap horizontal padding (4 left + 4 right), then split by 3 tabs.
    return Math.max(0, (containerWidth - 8) / options.length);
  }, [containerWidth, options.length]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * indicatorWidth }],
  }));

  return (
    <View style={styles.wrap} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <Animated.View style={[styles.indicator, { width: indicatorWidth }, indicatorStyle]} />
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable key={option.key} style={styles.cell} onPress={() => {
            slide.value = withSpring(option.index, { damping: 18, stiffness: 220 });
            onChange(option.key);
          }}>
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: '33.333%',
    borderRadius: 16,
    backgroundColor: OBSIDIAN_COLORS.green_primary,
  },
  cell: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    color: 'rgba(240, 253, 244, 0.62)',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
