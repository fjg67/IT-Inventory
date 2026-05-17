// ============================================
// FormField — Animated text input — Obsidian Grid
// IT-Inventory Application
// ============================================
import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  interpolateColor, ZoomIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

interface Props extends TextInputProps {
  label: string;
  required?: boolean;
  sectionBorderColor?: string;
  leftIcon?: string;
  /** Show scan button (for reference field) */
  onScan?: () => void;
  /** Show green check when field is valid */
  isValid?: boolean;
  error?: string;
}

const AnimInput = Animated.createAnimatedComponent(View);

export const FormField: React.FC<Props> = ({
  label,
  required,
  sectionBorderColor = CAC.border_focus,
  leftIcon,
  onScan,
  isValid,
  error,
  ...inputProps
}) => {
  const focus = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [error ? CAC.danger : CAC.border_subtle, error ? CAC.danger : sectionBorderColor],
    ),
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}> *</Text>}
      </View>

      <AnimInput
        style={[styles.inputBox, animStyle]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={18}
            color={focus.value ? sectionBorderColor : CAC.text_muted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={styles.inputText}
          placeholderTextColor={CAC.text_dim}
          onFocus={() => { focus.value = withTiming(1, { duration: 200 }); }}
          onBlur={() => { focus.value = withTiming(0, { duration: 200 }); }}
          {...inputProps}
        />
        <View style={styles.rightArea}>
          {isValid && (
            <Animated.View entering={ZoomIn.duration(200)}>
              <Icon name="check-circle" size={18} color={CAC.green_light} />
            </Animated.View>
          )}
          {onScan && (
            <>
              <View style={styles.scanSep} />
              <TouchableOpacity style={styles.scanBtn} onPress={onScan} activeOpacity={0.7}>
                <Icon name="barcode-scan" size={20} color={CAC.green_light} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </AnimInput>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: CAC.text_primary },
  required: { fontSize: 12, fontWeight: '600', color: CAC.danger },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CAC.border_subtle,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  leftIcon: { marginRight: 8 },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: CAC.text_primary,
    paddingVertical: 0,
  },
  rightArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scanSep: { width: 1, height: 24, backgroundColor: CAC.border_subtle },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: CAC.green_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CAC.border_accent,
  },
  errorText: { fontSize: 11, color: CAC.danger, marginTop: 2 },
});
