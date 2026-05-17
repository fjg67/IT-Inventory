// ============================================
// FormDropdown — Tap → BottomSheet — Obsidian Grid
// IT-Inventory Application
// ============================================
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

interface Props {
  label: string;
  required?: boolean;
  value: string | null;
  placeholder: string;
  leftIcon?: string;
  sectionBorderColor?: string;
  onPress: () => void;
  disabled?: boolean;
  disabledHint?: string;
  error?: string;
}

const AnimTouch = Animated.createAnimatedComponent(TouchableOpacity);

export const FormDropdown: React.FC<Props> = ({
  label,
  required,
  value,
  placeholder,
  leftIcon,
  sectionBorderColor = CAC.border_focus,
  onPress,
  disabled,
  disabledHint,
  error,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const hasValue = value !== null && value !== '';

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onPress();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}> *</Text>}
      </View>

      <AnimTouch
        style={[
          styles.box,
          {
            borderColor: error
              ? CAC.danger
              : hasValue
                ? sectionBorderColor
                : CAC.border_subtle,
            opacity: disabled ? 0.5 : 1,
          },
          animStyle,
        ]}
        onPress={handlePress}
        activeOpacity={1}
        disabled={disabled}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={18}
            color={hasValue ? sectionBorderColor : CAC.text_muted}
            style={styles.leftIcon}
          />
        )}
        <Text
          style={[
            styles.valueText,
            { color: hasValue ? CAC.text_primary : CAC.text_dim },
          ]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <Icon
          name="chevron-down"
          size={18}
          color={hasValue ? CAC.green_light : CAC.text_muted}
        />
      </AnimTouch>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {disabled && disabledHint ? (
        <Text style={styles.hintText}>{disabledHint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: CAC.text_primary },
  required: { fontSize: 12, fontWeight: '600', color: CAC.danger },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: 14,
    gap: 8,
  },
  leftIcon: {},
  valueText: { flex: 1, fontSize: 14, paddingVertical: 0 },
  errorText: { fontSize: 11, color: CAC.danger, marginTop: 2 },
  hintText: { fontSize: 11, color: CAC.text_muted, marginTop: 2 },
});
