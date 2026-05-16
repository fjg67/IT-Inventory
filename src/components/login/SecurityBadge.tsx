import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LOGIN_COLORS } from './loginTheme';

const SecurityBadge: React.FC = () => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name="shield-check" size={16} color={LOGIN_COLORS.green_light} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>Connexion securisee</Text>
        <Text style={styles.subtitle}>Chiffrement E2E</Text>
      </View>

      <View style={styles.onlineWrap}>
        <Animated.View style={[styles.onlineDot, pulseStyle]} />
        <Text style={styles.onlineText}>EN LIGNE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LOGIN_COLORS.bg_card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LOGIN_COLORS.border_card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LOGIN_COLORS.green_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: LOGIN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: LOGIN_COLORS.text_muted,
    fontSize: 11,
    marginTop: 1,
  },
  onlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LOGIN_COLORS.green_light,
    marginRight: 6,
  },
  onlineText: {
    color: LOGIN_COLORS.text_secondary,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default SecurityBadge;
