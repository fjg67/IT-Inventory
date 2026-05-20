import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCInputFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  value: string;
  icon: string;
  error?: string | null;
  onScan?: () => void;
  isFocused: boolean;
  showValidCheck?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const PCInputField: React.FC<PCInputFieldProps> = ({
  label,
  required = false,
  value,
  icon,
  error,
  onScan,
  isFocused,
  showValidCheck = true,
  ...inputProps
}) => {
  const focusAnim = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, focusAnim]);

  const animatedRowStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? OBSIDIAN_COLORS.danger
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          ['rgba(34, 197, 94, 0.06)', 'rgba(34, 197, 94, 0.30)'],
        ),
  }));

  const iconColor = error
    ? OBSIDIAN_COLORS.danger
    : isFocused
      ? OBSIDIAN_COLORS.green_light
      : OBSIDIAN_COLORS.text_dim;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <AnimatedView style={[styles.inputRow, animatedRowStyle]}>
        <Icon name={icon} size={18} color={iconColor} />
        <TextInput
          value={value}
          style={styles.input}
          placeholderTextColor={OBSIDIAN_COLORS.text_dim}
          selectionColor={OBSIDIAN_COLORS.green_light}
          {...inputProps}
        />

        {showValidCheck && value.trim().length > 0 ? (
          <Icon name="check-circle" size={16} color={OBSIDIAN_COLORS.green_light} style={styles.validIcon} />
        ) : null}

        {onScan ? (
          <Pressable style={styles.scanButton} onPress={onScan}>
            <Icon name="barcode-scan" size={18} color={OBSIDIAN_COLORS.green_light} />
          </Pressable>
        ) : null}
      </AnimatedView>

      {error ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={12} color={OBSIDIAN_COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
  },
  required: {
    color: OBSIDIAN_COLORS.danger,
  },
  inputRow: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  validIcon: {
    marginRight: 2,
  },
  scanButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: OBSIDIAN_COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default PCInputField;
