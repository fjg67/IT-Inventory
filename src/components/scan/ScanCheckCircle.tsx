import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SCAN_COLORS } from './tokens';

type ScanCheckCircleProps = {
  variant: 'success' | 'error';
  checkStyle: any;
  ringStyle: any;
};

export const ScanCheckCircle: React.FC<ScanCheckCircleProps> = ({ variant, checkStyle, ringStyle }) => {
  const tone = variant === 'error'
    ? { bg: SCAN_COLORS.danger, border: '#FCA5A5', icon: 'close' as const }
    : { bg: SCAN_COLORS.green_primary, border: SCAN_COLORS.green_light, icon: 'check' as const };

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.ring, { borderColor: tone.border }, ringStyle]} />
      <Animated.View style={[styles.circle, { backgroundColor: tone.bg, borderColor: tone.border }, checkStyle]}>
        <Icon name={tone.icon} size={30} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SCAN_COLORS.green_light,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.35,
    elevation: 10,
  },
});
