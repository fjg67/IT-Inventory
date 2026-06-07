import React from 'react';
import { StyleSheet, View } from 'react-native';

const GRID_LINE_COLOR = 'rgba(34,197,94,0.045)';

export const UpdateBackground: React.FC = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />

      <View style={styles.gridWrap}>
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={`h-${index}`} style={[styles.hLine, { top: index * 64 }]} />
        ))}

        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`v-${index}`} style={[styles.vLine, { left: index * 64 }]} />
        ))}
      </View>

      <View style={styles.haloTopRight} />
      <View style={styles.haloBottomLeft} />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0F0D',
  },
  gridWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GRID_LINE_COLOR,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GRID_LINE_COLOR,
  },
  haloTopRight: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 170,
    backgroundColor: 'rgba(34,197,94,0.14)',
  },
  haloBottomLeft: {
    position: 'absolute',
    bottom: -150,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 160,
    backgroundColor: 'rgba(27,138,62,0.1)',
  },
});
