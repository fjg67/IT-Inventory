// ============================================
// FormProgressBar — Progression formulaire — Obsidian Grid
// IT-Inventory Application
// ============================================
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { CAC } from './createArticleColors';

interface Props {
  completed: number;
  total: number;
}

export const FormProgressBar: React.FC<Props> = ({ completed, total }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(completed / total, { duration: 400 });
  }, [completed, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{completed}/{total} sections complétées</Text>
      <View style={styles.rail}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CAC.bg_card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: CAC.border_subtle,
    gap: 6,
  },
  label: { fontSize: 11, color: CAC.text_muted },
  rail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: CAC.bg_card_elevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: CAC.green_primary,
  },
});
