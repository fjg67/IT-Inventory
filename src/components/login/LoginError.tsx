import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LOGIN_COLORS } from './loginTheme';

interface LoginErrorProps {
  message: string | null;
}

const LoginError: React.FC<LoginErrorProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(180)} style={styles.container}>
      <Icon name="alert-circle-outline" size={12} color={LOGIN_COLORS.danger} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: LOGIN_COLORS.danger_subtle,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: LOGIN_COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});

export default LoginError;
