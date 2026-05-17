import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { SCAN_COLORS } from './tokens';

type ScanLineProps = {
  animatedStyle: any;
};

export const ScanLine: React.FC<ScanLineProps> = ({ animatedStyle }) => {
  return (
    <Animated.View style={[styles.line, animatedStyle]}>
      <LinearGradient
        colors={['transparent', SCAN_COLORS.green_light, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 90,
    height: 3,
  },
  gradient: {
    flex: 1,
    borderRadius: 999,
  },
});
