import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { CA_THEME } from '@/constants/caTheme';

export const CAMovementItem = ({ movement }: { movement: any }) => {
  const typeConfig: Record<string, any> = {
    entree:      { color: CA_THEME.green,   label: 'Entrée',     icon: 'arrow-down-circle' },
    sortie:      { color: CA_THEME.danger,  label: 'Sortie',     icon: 'arrow-up-circle'   },
    ajustement:  { color: CA_THEME.warning, label: 'Ajustement', icon: 'tune-vertical'       },
    transfert:   { color: CA_THEME.purple,  label: 'Transfert',  icon: 'swap-horizontal' },
  };
  const conf = typeConfig[movement.type] || typeConfig.entree;

  const createdAt = new Date(movement.createdAt);
  const isRecent = (Date.now() - createdAt.getTime()) < 60 * 60 * 1000; // < 1 heure

  const pulse = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRecent) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = 1;
      opacity.value = 1;
    }
  }, [isRecent, pulse, opacity]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: opacity.value,
  }));

  const formatRelativeDate = (dateString: string | Date) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.item, { borderLeftColor: conf.color }]}>
      <View style={styles.dotContainer}>
        {isRecent && (
          <Animated.View style={[styles.glow, { backgroundColor: conf.color }, animatedDotStyle]} />
        )}
        <View style={[styles.dot, { backgroundColor: conf.color }]} />
      </View>
      
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{movement.articleLabel || movement.articleNom}</Text>
          {isRecent && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>Nouveau</Text>
            </View>
          )}
        </View>
        <Text style={styles.sub}>{movement.site || movement.siteNom} · {formatRelativeDate(movement.createdAt)}</Text>
      </View>
      <View style={[styles.tag, { backgroundColor: `${conf.color}15` }]}>
        <Text style={[styles.tagText, { color: conf.color }]}>{conf.label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: CA_THEME.white,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    marginBottom:    8,
  },
  dotContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4, position: 'absolute' },
  glow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: { fontSize: 13, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.textPrimary, flexShrink: 1 },
  newBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  newBadgeText: {
    fontSize: 9,
    fontFamily: CA_THEME.fontFamilyBold,
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  sub:  { fontSize: 11, color: CA_THEME.textSecondary, marginTop: 2 },
  tag:  { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
