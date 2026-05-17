import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ScanLine } from './ScanLine';
import { SCAN_COLORS } from './tokens';

type ScanFrameProps = {
  size?: number;
  state: 'idle' | 'scanning' | 'success' | 'error';
  frameStyle: any;
  scanLineStyle: any;
};

export const ScanFrame: React.FC<ScanFrameProps> = ({ size = 200, state, frameStyle, scanLineStyle }) => {
  const cornerColor = state === 'error' ? SCAN_COLORS.danger : SCAN_COLORS.green_light;

  return (
    <Animated.View style={[styles.frame, { width: size, height: size }, frameStyle]}>
      <View style={[styles.corner, styles.topLeft, { borderColor: cornerColor }]} />
      <View style={[styles.corner, styles.topRight, { borderColor: cornerColor }]} />
      <View style={[styles.corner, styles.bottomLeft, { borderColor: cornerColor }]} />
      <View style={[styles.corner, styles.bottomRight, { borderColor: cornerColor }]} />

      {(state === 'idle' || state === 'scanning') ? <ScanLine animatedStyle={scanLineStyle} /> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
});
