import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ADC } from './articleDetailColors';

interface QuickActionCardProps {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  disabled?: boolean;
  hint?: string;
  delay?: number;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon, label, color, bg, onPress, disabled, hint, delay = 0,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSpring(0.93, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    Vibration.vibrate(12);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(280)}
      style={[animStyle, styles.wrap, { opacity: disabled ? 0.4 : 1 }]}
    >
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color }]}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled}
      >
        <View style={[styles.iconCircle, { backgroundColor: bg }]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    backgroundColor: ADC.bg_card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    borderLeftWidth: 4,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    minHeight: 100,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    fontSize: 10,
    color: ADC.text_muted,
    fontWeight: '500',
  },
});
