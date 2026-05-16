import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LOGIN_COLORS } from './loginTheme';

interface LoginBackgroundProps {
  children: React.ReactNode;
}

const LoginBackground: React.FC<LoginBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LOGIN_COLORS.bg_primary,
  },
  glowTopRight: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(27, 138, 62, 0.07)',
    top: -100,
    right: -100,
  },
  glowBottomLeft: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    bottom: 100,
    left: -70,
  },
});

export default LoginBackground;
