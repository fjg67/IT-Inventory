import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumSpacing,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

interface QuickActionButtonProps {
  icon: string;
  iconGradient: readonly string[];
  label: string;
  onPress: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  iconGradient,
  label,
  onPress,
}) => {
  const pressScale = useSharedValue(1);
  const { width: screenWidth } = useWindowDimensions();
  const tablet = checkIsTablet(screenWidth);
  const { colors } = useTheme();

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(premiumAnimation.pressScaleSmall, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withTiming(1, {
      duration: premiumAnimation.pressDuration,
    });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress();
  }, [onPress]);

  const accentColor = iconGradient[0] as string;

  return (
    <Animated.View style={[styles.wrapper, pressStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
          tablet && styles.containerTablet,
        ]}>
          {/* Top accent line */}
          <LinearGradient
            colors={[...(iconGradient as string[])]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />

          {/* Gradient icon pill */}
          <View style={[styles.iconShadow, { shadowColor: accentColor }]}>
            <LinearGradient
              colors={[...(iconGradient as string[])]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconPill, tablet && styles.iconPillTablet]}
            >
              <Icon name={icon} size={tablet ? 24 : 20} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Label */}
          <Text style={[styles.label, { color: colors.textSecondary }, tablet && styles.labelTablet]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  touchable: {
    alignItems: 'center',
    width: '100%',
  },
  container: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  containerTablet: {
    paddingVertical: premiumSpacing.lg,
    paddingHorizontal: premiumSpacing.md,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  iconPill: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillTablet: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  labelTablet: {
    fontSize: 14,
  },
});

export default QuickActionButton;
