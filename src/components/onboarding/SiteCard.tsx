import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ONBOARDING_COLORS } from './tokens';

type SiteCardProps = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  delay?: number;
  onPress: () => void;
};

export const SiteCard: React.FC<SiteCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  bg,
  delay = 0,
  onPress,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(240)}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: ONBOARDING_COLORS.green_subtle }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={[styles.bar, { backgroundColor: color }]} />

        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <Icon name={icon} size={22} color={color} />
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={[styles.chevWrap, { backgroundColor: bg }]}>
          <Icon name="chevron-right" size={15} color={color} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: ONBOARDING_COLORS.bg_card_elevated,
    borderColor: ONBOARDING_COLORS.border_accent,
  },
  bar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  title: {
    color: ONBOARDING_COLORS.text_primary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: ONBOARDING_COLORS.text_muted,
    fontSize: 12,
    marginTop: 2,
  },
  chevWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
