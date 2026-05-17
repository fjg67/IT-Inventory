import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { ONBOARDING_COLORS } from './tokens';

type WorkspaceCardProps = {
  title: string;
  subtitle: string;
  info: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  delay?: number;
  disabled?: boolean;
  onPress: () => void;
};

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  title,
  subtitle,
  info,
  icon,
  iconColor,
  iconBg,
  delay = 0,
  disabled = false,
  onPress,
}) => {
  return (
    <Animated.View entering={FadeInLeft.delay(delay).duration(260)}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: ONBOARDING_COLORS.green_subtle }}
        style={({ pressed }) => [
          styles.card,
          disabled && styles.cardDisabled,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={24} color={iconColor} />
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.infoPill}>
            <Icon name="map-marker-outline" size={11} color={ONBOARDING_COLORS.text_muted} />
            <Text style={styles.infoText}>{info}</Text>
          </View>
        </View>

        <View style={[styles.chevWrap, disabled && styles.chevWrapDisabled]}>
          <Icon
            name={disabled ? 'lock-outline' : 'chevron-right'}
            size={16}
            color={disabled ? ONBOARDING_COLORS.text_dim : ONBOARDING_COLORS.green_light}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardPressed: {
    backgroundColor: ONBOARDING_COLORS.bg_card_elevated,
    borderColor: ONBOARDING_COLORS.border_accent,
    transform: [{ scale: 0.98 }],
  },
  cardDisabled: {
    opacity: 0.62,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  title: {
    color: ONBOARDING_COLORS.text_primary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: ONBOARDING_COLORS.text_muted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 7,
  },
  infoPill: {
    alignSelf: 'flex-start',
    minHeight: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card_elevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  infoText: {
    color: ONBOARDING_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
  },
  chevWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: ONBOARDING_COLORS.green_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevWrapDisabled: {
    backgroundColor: ONBOARDING_COLORS.bg_card_elevated,
  },
});
