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
  premiumColors,
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

interface QuickActionButtonProps {
  /** Nom de l'icône MaterialCommunityIcons */
  icon: string;
  /** Couleur(s) dégradé de l'icône */
  iconGradient: readonly string[];
  /** Texte sous l'icône */
  label: string;
  /** Callback au press */
  onPress: () => void;
}

/**
 * Bouton d'action rapide avec glassmorphism simulé et icône dégradée
 */
const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  iconGradient,
  label,
  onPress,
}) => {
  const pressScale = useSharedValue(1);
  const { width: screenWidth } = useWindowDimensions();
  const tablet = checkIsTablet(screenWidth);

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

  return (
    <Animated.View style={[styles.wrapper, pressStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={[styles.container, tablet && styles.containerTablet]}>
          {/* Cercle icône avec dégradé */}
          <LinearGradient
            colors={[...(iconGradient as string[])]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconCircle, tablet && styles.iconCircleTablet]}
          >
            <Icon name={icon} size={tablet ? 28 : 24} color={premiumColors.text.inverse} />
          </LinearGradient>

          {/* Label */}
          <Text style={[styles.label, tablet && styles.labelTablet]} numberOfLines={1}>
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
  },
  container: {
    alignItems: 'center',
    backgroundColor: premiumColors.glass.white,
    borderRadius: premiumBorderRadius.xl,
    borderWidth: 1,
    borderColor: premiumColors.glass.border,
    paddingVertical: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.sm,
    width: 78,
    ...premiumShadows.xs,
  },
  containerTablet: {
    width: 110,
    paddingVertical: premiumSpacing.lg,
    paddingHorizontal: premiumSpacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: premiumSpacing.sm,
  },
  iconCircleTablet: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  label: {
    ...premiumTypography.smallMedium,
    color: premiumColors.text.secondary,
    textAlign: 'center',
  },
  labelTablet: {
    fontSize: 14,
  },
});

export default QuickActionButton;
