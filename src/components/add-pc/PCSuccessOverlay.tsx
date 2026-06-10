// components/add-pc/PCSuccessOverlay.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { PC_STATUS_UI } from '@/constants/pcStatusColors';
import { PCSuccessCheck } from './PCSuccessCheck';
import { PCSuccessRings } from './PCSuccessRings';
import { PCSuccessParticles } from './PCSuccessParticles';
import { PCSuccessCard } from './PCSuccessCard';
import { PCSuccessActions } from './PCSuccessActions';
import { PCSuccessData } from '@/hooks/usePCSuccessAnimation';

interface PCSuccessOverlayProps {
  visible: boolean;
  triggered: boolean;
  pcData: PCSuccessData | null;
  onAddAnother: () => void;
  onViewParc: () => void;
}

export const PCSuccessOverlay: React.FC<PCSuccessOverlayProps> = ({
  visible,
  triggered,
  pcData,
  onAddAnother,
  onViewParc,
}) => {
  const config = pcData ? PC_STATUS_UI[pcData.status] : PC_STATUS_UI.a_chaud;

  // Fond overlay
  const overlayOpacity = useSharedValue(0);
  useEffect(() => {
    overlayOpacity.value = visible
      ? withTiming(1, { duration: 280 })
      : withTiming(0, { duration: 250 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Texte principal
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(18);
  useEffect(() => {
    if (!triggered) return;
    textOpacity.value = 0;
    textTranslateY.value = 18;
    textOpacity.value = withDelay(380, withTiming(1, { duration: 350 }));
    textTranslateY.value = withDelay(380, withSpring(0, { damping: 14 }));
    return () => {
      cancelAnimation(textOpacity);
      cancelAnimation(textTranslateY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggered]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  // Badge statut
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.75);
  useEffect(() => {
    if (!triggered) return;
    badgeOpacity.value = 0;
    badgeScale.value = 0.75;
    badgeOpacity.value = withDelay(520, withTiming(1, { duration: 250 }));
    badgeScale.value = withDelay(520, withSpring(1.0, { damping: 12, stiffness: 200 }));
    return () => {
      cancelAnimation(badgeOpacity);
      cancelAnimation(badgeScale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggered]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      accessibilityRole="alert"
      accessibilityLabel="PC enregistré avec succès"
    >
      {/* Particules — derrière tout */}
      <PCSuccessParticles color={config.color} trigger={triggered} />

      {/* Anneaux concentriques */}
      <PCSuccessRings color={config.color} trigger={triggered} />

      {/* Check circle */}
      <PCSuccessCheck
        color={config.color}
        subtle={config.subtle}
        border={config.border}
        icon={config.icon}
        trigger={triggered}
      />

      {/* Texte */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.bigTitle}>PC enregistré !</Text>
        <Text style={styles.subtitle}>
          Le portable a été ajouté au parc avec succès.
        </Text>
      </Animated.View>

      {/* Badge statut */}
      <Animated.View
        style={[
          styles.badge,
          badgeStyle,
          { backgroundColor: config.subtle, borderColor: config.border },
        ]}
      >
        <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
        <Icon name={config.icon} size={13} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </Animated.View>

      {/* Mini-carte PC */}
      {pcData ? (
        <PCSuccessCard
          hostname={pcData.hostname}
          model={pcData.model}
          asset={pcData.asset}
          category={pcData.category}
          status={pcData.status}
          trigger={triggered}
        />
      ) : null}

      {/* Actions */}
      <PCSuccessActions
        statusColor={config.color}
        trigger={triggered}
        onAddAnother={onAddAnother}
        onViewParc={onViewParc}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: 'rgba(10,15,13,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
  },
  bigTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F0FDF4',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
