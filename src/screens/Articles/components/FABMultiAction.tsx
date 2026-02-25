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
  SlideInRight,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumSpacing,
  premiumBorderRadius,
  premiumShadows,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

interface FABAction {
  icon: string;
  label: string;
  color: string;
  gradient: readonly [string, string];
  onPress: () => void;
}

interface FABMultiActionProps {
  onScan: () => void;
  onAdd: () => void;
  onKit?: () => void;
}

const FABMultiAction: React.FC<FABMultiActionProps> = ({ onScan, onAdd, onKit }) => {
  const { colors, isDark, theme: { gradients } } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 45 : 0, { duration: 200 });
    ringScale.value = withSpring(expanded ? 1.2 : 1, { damping: 15 });
  }, [expanded, rotation, ringScale]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: expanded ? 0.3 : 0,
  }));

  const toggleFAB = useCallback(() => {
    Vibration.vibrate(15);
    setExpanded(prev => !prev);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    Vibration.vibrate(10);
    setExpanded(false);
    setTimeout(action, 150);
  }, []);

  const actions: FABAction[] = [
    ...(onKit ? [{
      icon: 'toolbox-outline',
      label: 'Kit',
      color: '#EF4444',
      gradient: ['#EF4444', '#DC2626'] as const,
      onPress: onKit,
    }] : []),
    {
      icon: 'barcode-scan',
      label: 'Scanner',
      color: colors.primary,
      gradient: ['#6366F1', '#4F46E5'] as const,
      onPress: onScan,
    },
    {
      icon: 'plus',
      label: 'Ajouter',
      color: '#10B981',
      gradient: ['#10B981', '#059669'] as const,
      onPress: onAdd,
    },
  ];

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
            <View style={[
              styles.backdropFill,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)' },
            ]} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      {/* Secondary actions */}
      {expanded && (
        <View style={[
          styles.actionsContainer,
          tablet && { bottom: 116, right: 32, gap: premiumSpacing.lg },
        ]}>
          {actions.map((action, index) => (
            <Animated.View
              key={action.label}
              entering={ZoomIn.delay(index * 60)
                .springify()
                .damping(14)}
              exiting={ZoomOut.duration(120)}
            >
              <TouchableOpacity
                style={[
                  styles.secondaryAction,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : '#FFFFFF',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.04)',
                  },
                  tablet && {
                    paddingHorizontal: premiumSpacing.xl,
                    paddingVertical: premiumSpacing.md,
                  },
                ]}
                onPress={() => handleAction(action.onPress)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[...action.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIconCircle}
                >
                  <Icon name={action.icon} size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text
                  style={[
                    styles.secondaryLabel,
                    { color: colors.textPrimary },
                    tablet && { fontSize: 15 },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Glow ring */}
      <Animated.View style={[styles.fabGlowRing, ringStyle, tablet && { bottom: 22, right: 22 }]} />

      {/* Main FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          rotationStyle,
          tablet && { bottom: 32, right: 32 },
        ]}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={toggleFAB}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.fab,
              tablet && { width: 72, height: 72, borderRadius: 22 },
            ]}
          >
            <Icon name="plus" size={tablet ? 34 : 26} color="#FFF" />
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
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    zIndex: 95,
    gap: 10,
    alignItems: 'flex-end',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fabGlowRing: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    zIndex: 99,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});

export default FABMultiAction;
