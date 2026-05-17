// ============================================
// StockLevelCard — Stepper numérique — Obsidian Grid
// IT-Inventory Application
// ============================================
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

interface StockStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  plusColor?: string;
  minusColor?: string;
}

const StockStepper: React.FC<StockStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 9999,
  plusColor = CAC.green_light,
  minusColor = CAC.danger,
}) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleP = useSharedValue(1);
  const scaleM = useSharedValue(1);
  const styleP = useAnimatedStyle(() => ({ transform: [{ scale: scaleP.value }] }));
  const styleM = useAnimatedStyle(() => ({ transform: [{ scale: scaleM.value }] }));

  const tap = (delta: number, scaleRef: typeof scaleP) => {
    scaleRef.value = withSpring(0.85, { damping: 15, stiffness: 300 }, () => {
      scaleRef.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onChange(Math.min(max, Math.max(min, value + delta)));
  };

  const startLongPress = (delta: number) => {
    intervalRef.current = setInterval(() => {
      onChange(prev => Math.min(max, Math.max(min, (prev as unknown as number) + delta)));
    }, 150);
  };
  const stopLongPress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <View style={styles.stepper}>
      <Animated.View style={styleM}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => tap(-1, scaleM)}
          onLongPress={() => startLongPress(-1)}
          onPressOut={stopLongPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.stepBtnText, { color: value > min ? minusColor : CAC.text_dim }]}>−</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.valueBox}>
        <Text style={styles.valueText}>{value}</Text>
      </View>

      <Animated.View style={styleP}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => tap(1, scaleP)}
          onLongPress={() => startLongPress(1)}
          onPressOut={stopLongPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.stepBtnText, { color: plusColor }]}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

interface StockLevelCardProps {
  label: string;
  iconName: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  value: number;
  onChange: (v: number) => void;
  plusColor?: string;
  minusColor?: string;
}

export const StockLevelCard: React.FC<StockLevelCardProps> = ({
  label,
  iconName,
  iconColor,
  iconBg,
  borderColor,
  value,
  onChange,
  plusColor,
  minusColor,
}) => (
  <View style={[styles.card, { borderColor }]}>
    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
      <Icon name={iconName} size={20} color={iconColor} />
    </View>
    <Text style={styles.cardLabel}>{label}</Text>
    <StockStepper
      value={value}
      onChange={onChange}
      plusColor={plusColor}
      minusColor={minusColor}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: CAC.text_muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CAC.bg_card,
    borderWidth: 1,
    borderColor: CAC.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  valueBox: {
    backgroundColor: CAC.bg_card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    color: CAC.text_primary,
  },
});
