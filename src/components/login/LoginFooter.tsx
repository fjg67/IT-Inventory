import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LOGIN_COLORS } from './loginTheme';

interface LoginFooterProps {
  version: string;
}

const LoginFooter: React.FC<LoginFooterProps> = ({ version }) => {
  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeIn.duration(400).delay(600)} style={styles.badge}>
        <Icon name="lock-outline" size={12} color={LOGIN_COLORS.text_muted} />
        <Text style={styles.badgeText}>Donnees protegees et chiffrees</Text>
      </Animated.View>

      <Animated.Text entering={FadeIn.duration(400).delay(700)} style={styles.version}>
        v{version}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 22,
    gap: 8,
  },
  badge: {
    backgroundColor: LOGIN_COLORS.bg_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LOGIN_COLORS.border_subtle,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: LOGIN_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '500',
  },
  version: {
    color: LOGIN_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default LoginFooter;
