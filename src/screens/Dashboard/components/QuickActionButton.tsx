import React, { useCallback } from 'react';
import { Text, Pressable, View, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
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
  const pressLift = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();
  const tablet = checkIsTablet(screenWidth);
  const { colors, isDark } = useTheme();

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(0.94, { duration: premiumAnimation.pressDuration });
    pressLift.value = withTiming(1, { duration: premiumAnimation.pressDuration });
  }, [pressScale, pressLift]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    pressLift.value = withTiming(0, { duration: 200 });
  }, [pressScale, pressLift]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    shadowOpacity: interpolate(pressLift.value, [0, 1], [0.06, 0.22]),
    shadowRadius: interpolate(pressLift.value, [0, 1], [6, 16]),
  }));


  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress();
  }, [onPress]);

  const accentColor = iconGradient[0] as string;
  const accentEnd = (iconGradient[1] ?? iconGradient[0]) as string;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          shadowColor: accentColor,
        },
        pressStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: accentColor + '28', borderless: false }}
        style={styles.touchable}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? accentColor + '22' : accentColor + '18',
            },
            tablet && styles.containerTablet,
          ]}
        >
          {/* Subtle tinted top glow */}
          <View
            style={[
              styles.topGlow,
              { backgroundColor: accentColor + (isDark ? '18' : '10') },
            ]}
          />

          {/* Thin gradient top border strip */}
          <LinearGradient
            colors={[accentColor, accentEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topStrip}
          />

          {/* Icon pill */}
          <View style={[styles.iconShadow, { shadowColor: accentColor }]}>
            <LinearGradient
              colors={[accentColor, accentEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconPill, tablet && styles.iconPillTablet]}
            >
              <View style={styles.iconInner}>
                <Icon name={icon} size={tablet ? 22 : 19} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </View>

          {/* Label */}
          <Text
            style={[
              styles.label,
              { color: colors.textPrimary },
              tablet && styles.labelTablet,
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 70,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 20,
  },
  touchable: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 6,
    minHeight: 90,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  containerTablet: {
    paddingTop: 20,
    paddingBottom: 18,
    borderRadius: 24,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 16,
    marginBottom: 8,
    marginTop: 1,
  },
  iconPill: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillTablet: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 14,
  },
  labelTablet: {
    fontSize: 13.5,
  },
});

export default QuickActionButton;
