import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const SplashBrand: React.FC = () => {
  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInDown.delay(600).duration(260)} style={styles.title}>
        IT-Inventory
      </Animated.Text>

      <Animated.Text entering={FadeInDown.delay(700).duration(240)} style={styles.subtitle}>
        GESTION DE STOCK IT
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F0FDF4',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(134,239,172,0.5)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});
