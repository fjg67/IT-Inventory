import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { CA_THEME } from '@/constants/caTheme';
import { formatTimeParis, parseDateTime } from '@/utils/dateUtils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const CAMovementItem = ({ movement }: { movement: any }) => {
  const typeConfig: Record<string, any> = {
    entree:      { color: CA_THEME.green,   label: 'Entrée',     icon: 'arrow-down-circle' },
    sortie:      { color: CA_THEME.danger,  label: 'Sortie',     icon: 'arrow-up-circle'   },
    ajustement:  { color: CA_THEME.warning, label: 'Ajustement', icon: 'tune-vertical'       },
    transfert:   { color: CA_THEME.purple,  label: 'Transfert',  icon: 'swap-horizontal' },
  };
  const conf = typeConfig[movement.type] || typeConfig.entree;
  const signedQuantity = movement.quantite == null ? null : `${movement.type === 'sortie' ? '-' : '+'}${Math.abs(movement.quantite)}`;

  const createdAt = parseDateTime(movement.createdAt);
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
    const d = parseDateTime(dateString);
    const dateLabel = d.toLocaleDateString('fr-FR', {
      timeZone: 'Europe/Paris',
      day: 'numeric',
      month: 'short',
    });
    return `${dateLabel}, ${formatTimeParis(d)}`;
  };

  return (
    <View style={[styles.item, { borderLeftColor: conf.color }]}>
      <View style={[styles.iconBox, { backgroundColor: `${conf.color}16` }]}>
        <Icon name={conf.icon} size={19} color={conf.color} />
      </View>
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
        <View style={styles.metaRow}>
          <Text style={styles.sub} numberOfLines={1}>{movement.site || movement.siteNom || 'Site non défini'}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.time}>{formatRelativeDate(movement.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.trailing}>
        {signedQuantity && <Text style={[styles.quantity, { color: conf.color }]}>{signedQuantity}</Text>}
        <View style={[styles.tag, { backgroundColor: `${conf.color}16`, borderColor: `${conf.color}35` }]}>
          <Text style={[styles.tagText, { color: conf.color }]}>{conf.label}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: CA_THEME.white,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             9,
    marginBottom:    7,
    shadowColor: '#145540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  info: { flex: 1, minWidth: 0, gap: 3 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 5 },
  sub:  { flexShrink: 1, fontSize: 10, color: CA_THEME.textSecondary },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: CA_THEME.greenBg2 },
  time: { flexShrink: 0, fontSize: 10, color: CA_THEME.textMuted, fontFamily: CA_THEME.fontFamilyMedium },
  trailing: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  quantity: { fontSize: 13, fontFamily: CA_THEME.fontFamilyBold },
  tag:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1 },
  tagText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
