import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ONBOARDING_COLORS, ONBOARDING_VERSION } from './tokens';

type OnboardingFooterProps = {
  version?: string;
};

export const OnboardingFooter: React.FC<OnboardingFooterProps> = ({ version = ONBOARDING_VERSION }) => {
  return (
    <Animated.View entering={FadeIn.delay(600).duration(260)} style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name="shield-lock-outline" size={13} color={ONBOARDING_COLORS.text_dim} />
        <Text style={styles.text}>Donnees protegees et chiffrees</Text>
      </View>
      <Text style={styles.version}>Version {version}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 2,
    gap: 6,
  },
  badge: {
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border_subtle,
    backgroundColor: ONBOARDING_COLORS.bg_card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: {
    color: ONBOARDING_COLORS.text_dim,
    fontSize: 12,
    fontWeight: '500',
  },
  version: {
    color: ONBOARDING_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '500',
  },
});
