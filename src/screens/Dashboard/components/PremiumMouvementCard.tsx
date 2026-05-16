import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  premiumSpacing,
  premiumAnimation,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

interface MouvementData {
  id: string;
  articleNom?: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'transfert';
  quantite: number;
  siteNom?: string;
  createdAt: string | Date;
  technicienNom?: string;
}

interface PremiumMouvementCardProps {
  mouvement: MouvementData;
  onPress?: () => void;
}

const TYPE_CONFIGS = {
  entree: {
    icon: 'arrow-up-bold',
    gradient: ['#10B981', '#059669'] as [string, string],
    label: 'Entrée',
    sign: '+',
  },
  sortie: {
    icon: 'arrow-down-bold',
    gradient: ['#EF4444', '#DC2626'] as [string, string],
    label: 'Sortie',
    sign: '-',
  },
  ajustement: {
    icon: 'swap-vertical',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
    label: 'Ajustement',
    sign: '',
  },
  transfert: {
    icon: 'swap-horizontal',
    gradient: ['#007A39', '#005C2B'] as [string, string],
    label: 'Transfert',
    sign: '',
  },
};

const PremiumMouvementCard: React.FC<PremiumMouvementCardProps> = ({
  mouvement,
  onPress,
}) => {
  const pressScale = useSharedValue(1);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(premiumAnimation.pressScale, {
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
    onPress?.();
  }, [onPress]);

  const typeConfig = useMemo(() => {
    return TYPE_CONFIGS[mouvement.type] || {
      icon: 'circle',
      gradient: ['#94A3B8', '#64748B'] as [string, string],
      label: mouvement.type,
      sign: '',
    };
  }, [mouvement.type]);

  const relativeTime = useMemo(() => {
    const now = new Date();
    const date = new Date(mouvement.createdAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return new Date(mouvement.createdAt).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' });
  }, [mouvement.createdAt]);

  const accentColor = typeConfig.gradient[0];

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: `${accentColor}30`, borderless: false }}
      >
        <View style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.borderSubtle : colors.borderMedium,
          },
          tablet && { padding: premiumSpacing.lg },
        ]}>
          {/* Left gradient accent bar */}
          <LinearGradient
            colors={typeConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentBar}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Top row: article name bold + relative date */}
            <View style={styles.topRow}>
              <Text style={[styles.articleName, { color: colors.textPrimary }, tablet && { fontSize: 16 }]} numberOfLines={1}>
                {mouvement.articleNom ?? 'Article'}
              </Text>
              <Text style={[styles.dateText, { color: colors.textMuted }, tablet && { fontSize: 12 }]}>
                {relativeTime}
              </Text>
            </View>

            {/* Bottom row: type badge + big quantity */}
            <View style={styles.bottomRow}>
              <View style={[styles.typeBadge, { backgroundColor: isDark ? `${accentColor}15` : `${accentColor}0A` }]}>
                <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.typeBadgeText, { color: accentColor }, tablet && { fontSize: 12 }]} numberOfLines={1}>
                  {typeConfig.label}{mouvement.technicienNom ? ` · ${mouvement.technicienNom.split(' ').map(w => w[0]).join('.').toUpperCase()}.` : ''}
                </Text>
              </View>
              <Text style={[styles.bigQuantity, { color: accentColor }, tablet && { fontSize: 32 }]}>
                {typeConfig.sign}{Math.abs(mouvement.quantite)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 20,
    marginBottom: premiumSpacing.sm + 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    flexShrink: 0,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  bigQuantity: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 30,
    flexShrink: 0,
  },
});

export default PremiumMouvementCard;
