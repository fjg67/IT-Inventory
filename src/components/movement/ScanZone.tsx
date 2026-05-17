import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  identity: MovementIdentity;
  onPress: () => void;
}

export const ScanZone: React.FC<Props> = ({ identity, onPress }) => {
  const lineY = useSharedValue(-20);

  useEffect(() => {
    lineY.value = withRepeat(
      withSequence(withTiming(20, { duration: 1000 }), withTiming(-20, { duration: 1000 })),
      -1,
      true,
    );
  }, [lineY]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lineY.value }],
  }));

  return (
    <TouchableOpacity style={[styles.scanBox, { borderColor: identity.border }]} activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.scanInner, { backgroundColor: identity.subtle }]}>
        <View style={[styles.iconWrap, { borderColor: identity.border, backgroundColor: identity.subtle }]}>
          <Icon name="barcode-scan" size={32} color={identity.color} />
          <Animated.View style={[styles.scanLine, { backgroundColor: identity.color }, lineStyle]} />
        </View>

        <Text style={[styles.title, { color: identity.color }]}>Appuyez pour scanner</Text>
        <Text style={styles.subtitle}>Ou recherchez manuellement ci-dessous</Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(ScanZone);

const styles = StyleSheet.create({
  scanBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    overflow: 'hidden',
  },
  scanInner: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    width: 48,
    height: 2,
    borderRadius: 2,
    opacity: 0.65,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 13,
  },
});
