import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SETTINGS_COLORS } from '@/constants/settingsColors';
import { SettingsRow, SettingsRowProps } from './SettingsRow';

interface ActionButton {
  label: string;
  icon?: string;
  color: 'green' | 'danger' | 'outline';
  onPress: () => void;
  disabled?: boolean;
}

interface SettingsRowActionProps extends SettingsRowProps {
  actionButton: ActionButton;
}

export const SettingsRowAction: React.FC<SettingsRowActionProps> = ({ actionButton, ...rowProps }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const visual = actionButton.color === 'green'
    ? {
      bg: SETTINGS_COLORS.green_primary,
      border: SETTINGS_COLORS.green_primary,
      text: '#FFFFFF',
    }
    : actionButton.color === 'danger'
      ? {
        bg: SETTINGS_COLORS.danger_subtle,
        border: 'rgba(239,68,68,0.45)',
        text: SETTINGS_COLORS.danger,
      }
      : {
        bg: SETTINGS_COLORS.bg_card_elevated,
        border: SETTINGS_COLORS.border_accent,
        text: SETTINGS_COLORS.green_light,
      };

  return (
    <View style={styles.wrap}>
      <SettingsRow {...rowProps} />
      <Animated.View style={[styles.actionWrap, style]}>
        <Pressable
          onPress={actionButton.onPress}
          disabled={actionButton.disabled}
          onPressIn={() => {
            scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 16, stiffness: 280 });
          }}
          style={[
            styles.button,
            {
              backgroundColor: visual.bg,
              borderColor: visual.border,
            },
            actionButton.disabled && styles.disabled,
          ]}
        >
          {actionButton.icon ? <Icon name={actionButton.icon} size={15} color={visual.text} /> : null}
          <Text style={[styles.buttonText, { color: visual.text }]}>{actionButton.label}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  actionWrap: {
    width: '100%',
  },
  button: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
