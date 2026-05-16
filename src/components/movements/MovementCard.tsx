import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInRight, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Mouvement } from '@/types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { formatMovementDelta, getMovementTypeMeta } from '@/constants/movementTypes';
import { formatDateTimeParis } from '@/utils/dateUtils';
import { toAbbreviation } from '@/utils/abbreviation';
import { MovementTypePill } from './MovementTypePill';
import { MovementQTEBadge } from './MovementQTEBadge';

interface MovementCardProps {
  item: Mouvement;
  index: number;
  onPress: (movement: Mouvement) => void;
}

export const MovementCard: React.FC<MovementCardProps> = ({ item, index, onPress }) => {
  const meta = getMovementTypeMeta(item.type);
  const press = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 30).duration(240)} style={animatedStyle}>
      <Pressable
        onPress={() => onPress(item)}
        onPressIn={() => { press.value = withSpring(0.97, { damping: 16, stiffness: 260 }); }}
        onPressOut={() => { press.value = withSpring(1, { damping: 16, stiffness: 260 }); }}
        style={[styles.card, { borderLeftColor: meta.text, borderColor: meta.border, backgroundColor: meta.bg }]}
      >
        <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={22} color={meta.text} />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.articleName} numberOfLines={1}>{item.article?.nom || 'Article inconnu'}</Text>
            <MovementQTEBadge meta={meta} value={formatMovementDelta(item.type, item.quantite)} />
          </View>

          <View style={styles.refRow}>
            <View style={styles.refBadge}>
              <Icon name="barcode" size={11} color={OBSIDIAN_COLORS.text_secondary} />
              <Text style={styles.refText} numberOfLines={1}>{item.article?.reference || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MovementTypePill meta={meta} />
            <View style={styles.timeWrap}>
              <Icon name="clock-outline" size={11} color={OBSIDIAN_COLORS.text_dim} />
              <Text style={styles.timeText} numberOfLines={1}>{formatDateTimeParis(item.dateMouvement)}</Text>
            </View>
            <Text style={styles.operatorText} numberOfLines={1}>
              {item.technicien ? toAbbreviation(`${item.technicien.prenom || ''} ${item.technicien.nom || ''}`, 3, 'N/A') : 'N/A'}
            </Text>
          </View>
        </View>

        <Icon name="chevron-right" size={16} color={OBSIDIAN_COLORS.text_dim} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  articleName: {
    flex: 1,
    minWidth: 0,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
  },
  refRow: {
    flexDirection: 'row',
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  refText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
  operatorText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
  },
});
