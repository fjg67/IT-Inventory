import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MOVEMENT_COLORS, MOVEMENT_STEP_LABELS, STEP_ICONS, MovementIdentity } from './movementTheme';

interface Props {
  currentStep: number;
  identity: MovementIdentity;
}

export const MovementStepper: React.FC<Props> = ({ currentStep, identity }) => {
  const lineProgress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    lineProgress.value = withSpring(currentStep / 2, { damping: 16, stiffness: 120 });
  }, [currentStep, lineProgress]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true,
    );
  }, [pulse]);

  const lineStyle = useAnimatedStyle(() => ({
    width: `${lineProgress.value * 100}%` as const,
    backgroundColor: identity.color,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.lineTrack}>
        <Animated.View style={[styles.lineFill, lineStyle]} />
      </View>
      <View style={styles.row}>
        {MOVEMENT_STEP_LABELS.map((label, index) => {
          const done = index < currentStep;
          const active = index === currentStep;

          return (
            <View key={label} style={styles.item}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: done ? identity.colorDark : active ? identity.color : MOVEMENT_COLORS.bg_card_elevated,
                    borderColor: done || active ? identity.color : MOVEMENT_COLORS.border_subtle,
                  },
                  active ? pulseStyle : undefined,
                ]}
              >
                {done ? (
                  <Icon name="check" size={12} color="#FFF" />
                ) : active ? (
                  <Icon name={STEP_ICONS[index]} size={13} color="#FFF" />
                ) : (
                  <Text style={styles.indexText}>{index + 1}</Text>
                )}
              </Animated.View>
              <Text
                style={[
                  styles.label,
                  { color: done || active ? identity.color : MOVEMENT_COLORS.text_dim },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default memo(MovementStepper);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(17,26,20,0.5)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  lineTrack: {
    position: 'absolute',
    left: 38,
    right: 38,
    top: 22,
    height: 2,
    borderRadius: 2,
    backgroundColor: MOVEMENT_COLORS.border_card,
  },
  lineFill: {
    height: 2,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    width: 84,
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: MOVEMENT_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
  },
});
