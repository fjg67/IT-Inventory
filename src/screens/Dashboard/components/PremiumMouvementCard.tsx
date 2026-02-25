import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
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
    gradient: ['#6366F1', '#4338CA'] as [string, string],
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
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle, shadowColor: accentColor },
          tablet && { padding: premiumSpacing.lg },
        ]}>
          {/* Left accent strip */}
          <LinearGradient
            colors={typeConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentStrip}
          />

          {/* Gradient icon pill */}
          <View style={[styles.iconShadow, { shadowColor: accentColor }]}>
            <LinearGradient
              colors={typeConfig.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconPill, tablet && { width: 46, height: 46, borderRadius: 14 }]}
            >
              <Icon name={typeConfig.icon} size={tablet ? 22 : 19} color="#FFF" />
            </LinearGradient>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={[styles.articleName, { color: colors.textPrimary }, tablet && { fontSize: 16 }]} numberOfLines={1}>
                {mouvement.articleNom ?? 'Article'}
              </Text>
              <Text style={[styles.quantity, { color: accentColor }, tablet && { fontSize: 14 }]}>
                {typeConfig.sign}{Math.abs(mouvement.quantite)}
              </Text>
            </View>

            <View style={styles.bottomRow}>
              <View style={[styles.typeBadge, { backgroundColor: isDark ? `${accentColor}20` : `${accentColor}12` }]}>
                <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.typeBadgeText, { color: accentColor }, tablet && { fontSize: 12 }]}>
                  {typeConfig.label}
                </Text>
              </View>
              <Text style={[styles.info, { color: colors.textMuted }, tablet && { fontSize: 12 }]}>
                {relativeTime}
                {mouvement.technicienNom ? ` • ${mouvement.technicienNom}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 18,
    marginBottom: premiumSpacing.sm,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  articleName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  quantity: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    gap: 4,
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  info: {
    fontSize: 11,
    fontWeight: '400',
    flex: 1,
  },
});

export default PremiumMouvementCard;
