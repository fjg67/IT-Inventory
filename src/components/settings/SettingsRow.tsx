import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SETTINGS_COLORS } from '@/constants/settingsColors';
import { StatusBadge, StatusKind } from './StatusBadge';

export type SettingsRowVariant = 'navigate' | 'info' | 'danger';

export interface SettingsRowProps {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  variant?: SettingsRowVariant;
  badgeStatus?: StatusKind;
  rightValue?: string;
  onPress?: () => void;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  variant = 'navigate',
  badgeStatus,
  rightValue,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const titleColor = variant === 'danger' ? SETTINGS_COLORS.danger : SETTINGS_COLORS.text_primary;
  const subtitleColor = variant === 'danger' ? SETTINGS_COLORS.danger : SETTINGS_COLORS.text_muted;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (onPress) scale.value = withSpring(0.98, { damping: 16, stiffness: 280 });
        }}
        onPressOut={() => {
          if (onPress) scale.value = withSpring(1, { damping: 16, stiffness: 280 });
        }}
        style={[
          styles.row,
          variant === 'danger' && styles.rowDanger,
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg ?? SETTINGS_COLORS.bg_card_elevated }]}>
          <Icon name={icon} size={20} color={iconColor ?? SETTINGS_COLORS.green_light} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>

        <View style={styles.rightWrap}>
          {badgeStatus ? <StatusBadge status={badgeStatus} /> : null}
          {rightValue ? <Text style={styles.rightValue}>{rightValue}</Text> : null}
          {variant === 'navigate' ? <Icon name="chevron-right" size={18} color={SETTINGS_COLORS.text_muted} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rowDanger: {
    borderColor: 'rgba(239,68,68,0.2)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  rightWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  rightValue: {
    fontSize: 12,
    fontWeight: '600',
    color: SETTINGS_COLORS.text_secondary,
  },
});
