import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
  premiumShadows,
} from '../../../constants/premiumTheme';

interface FABMultiActionProps {
  onScan: () => void;
  onAdd: () => void;
  onKit?: () => void;
}

const FABMultiAction: React.FC<FABMultiActionProps> = ({ onScan, onAdd, onKit }) => {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 45 : 0, { duration: 200 });
  }, [expanded, rotation]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleFAB = useCallback(() => {
    Vibration.vibrate(15);
    setExpanded(prev => !prev);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    Vibration.vibrate(10);
    setExpanded(false);
    // Petit délai pour l'animation de fermeture
    setTimeout(action, 150);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
        >
          <TouchableWithoutFeedback onPress={toggleFAB}>
            <View style={styles.backdropFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      {/* Actions secondaires */}
      {expanded && (
        <View style={[styles.actionsContainer, tablet && { bottom: 116, right: 32, gap: premiumSpacing.lg }]}>
          {onKit && (
            <Animated.View entering={ZoomIn.delay(100).springify()} exiting={ZoomOut.duration(150)}>
              <TouchableOpacity
                style={[styles.secondaryAction, tablet && { paddingHorizontal: premiumSpacing.xl, paddingVertical: premiumSpacing.lg }]}
                onPress={() => handleAction(onKit)}
                activeOpacity={0.8}
              >
                <Icon name="toolbox-outline" size={tablet ? 24 : 20} color="#EF4444" />
                <Text style={[styles.secondaryLabel, tablet && { fontSize: 15 }]}>Kit</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View entering={ZoomIn.delay(50).springify()} exiting={ZoomOut.duration(150)}>
            <TouchableOpacity
              style={[styles.secondaryAction, tablet && { paddingHorizontal: premiumSpacing.xl, paddingVertical: premiumSpacing.lg }]}
              onPress={() => handleAction(onScan)}
              activeOpacity={0.8}
            >
              <Icon name="barcode-scan" size={tablet ? 24 : 20} color={premiumColors.primary.base} />
              <Text style={[styles.secondaryLabel, tablet && { fontSize: 15 }]}>Scanner</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(0).springify()} exiting={ZoomOut.duration(100)}>
            <TouchableOpacity
              style={[styles.secondaryAction, tablet && { paddingHorizontal: premiumSpacing.xl, paddingVertical: premiumSpacing.lg }]}
              onPress={() => handleAction(onAdd)}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={tablet ? 24 : 20} color={premiumColors.primary.base} />
              <Text style={[styles.secondaryLabel, tablet && { fontSize: 15 }]}>Ajouter</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* FAB principal */}
      <Animated.View style={[styles.fabContainer, rotationStyle, tablet && { bottom: 32, right: 32 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleFAB}
        >
          <LinearGradient
            colors={[...premiumColors.gradients.scanButton]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fab, tablet && { width: 72, height: 72, borderRadius: 36 }]}
          >
            <Icon name="plus" size={tablet ? 34 : 28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    zIndex: 95,
    gap: premiumSpacing.md,
    alignItems: 'flex-end',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: premiumColors.surface,
    borderRadius: premiumBorderRadius.full,
    paddingHorizontal: premiumSpacing.lg,
    paddingVertical: premiumSpacing.md,
    gap: premiumSpacing.sm,
    ...premiumShadows.lg,
  },
  secondaryLabel: {
    ...premiumTypography.captionMedium,
    color: premiumColors.text.primary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...premiumShadows.glowBlue,
  },
});

export default FABMultiAction;
