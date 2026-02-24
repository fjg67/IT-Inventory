import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShineEffect from './effects/ShineEffect';
import FloatingParticles from './effects/FloatingParticles';
import {
  premiumColors,
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { isTablet as isTabletDevice } from '../../../utils/responsive';

interface ScanButtonXXLProps {
  onPress: () => void;
}

/**
 * Bouton Scanner XXL avec effets premium :
 * - Dégradé bleu 45°
 * - Icône avec pulse en boucle
 * - Particules flottantes
 * - Effet shine traversant
 * - Haptic feedback au press
 */
const ScanButtonXXL: React.FC<ScanButtonXXLProps> = ({ onPress }) => {
  const { width: screenWidth } = useWindowDimensions();
  const tablet = isTabletDevice(screenWidth);
  const buttonWidth = tablet ? Math.min(screenWidth - premiumSpacing.lg * 2, 600) : screenWidth - premiumSpacing.lg * 2;
  const buttonHeight = tablet ? 200 : 180;
  const iconSize = tablet ? 56 : 48;
  const iconCircleSize = tablet ? 92 : 80;

  // Animation pulse de l'icône
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: premiumAnimation.pulseDuration / 2 }),
        withTiming(1, { duration: premiumAnimation.pulseDuration / 2 }),
      ),
      -1,
      true,
    );
  }, [iconScale]);

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Press animation
  const pressScale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(0.97, { duration: premiumAnimation.pressDuration });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withTiming(1, { duration: premiumAnimation.pressDuration });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = useCallback(() => {
    Vibration.vibrate(15);
    onPress();
  }, [onPress]);

  return (
    <Animated.View
      entering={FadeInUp.delay(premiumAnimation.staggerDelay).duration(500)}
      style={pressStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={[...premiumColors.gradients.scanButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, { width: buttonWidth, height: buttonHeight }]}
        >
          {/* Particules flottantes en arrière-plan */}
          <FloatingParticles
            count={6}
            width={buttonWidth}
            height={buttonHeight}
          />

          {/* Icône scanner avec glow */}
          <Animated.View style={[styles.iconContainer, iconPulseStyle]}>
            <View style={[styles.iconCircle, { width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 }]}>
              <Icon
                name="barcode-scan"
                size={iconSize}
                color={premiumColors.text.inverse}
              />
            </View>
          </Animated.View>

          {/* Textes */}
          <Text style={styles.title}>Scanner un article</Text>
          <Text style={styles.subtitle}>
            Entrée  •  Sortie  •  Consultation
          </Text>

          {/* Effet shine */}
          <ShineEffect width={buttonWidth} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: premiumBorderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: premiumSpacing.xl,
    ...premiumShadows.glowBlue,
  },
  iconContainer: {
    marginBottom: premiumSpacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    ...premiumTypography.h2,
    color: premiumColors.text.inverse,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    ...premiumTypography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});

export default ScanButtonXXL;
