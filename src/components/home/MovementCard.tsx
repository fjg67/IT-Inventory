import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

export type MovementKind = 'entree' | 'sortie' | 'ajustement' | 'transfert';

interface MovementCardProps {
  index: number;
  articleNom: string;
  type: MovementKind;
  stockSite?: string;
  delta: number;
  dateText: string;
}

const typeMeta: Record<MovementKind, { label: string; color: string; subtle: string }> = {
  entree: { label: 'Entree', color: OBSIDIAN_COLORS.green_light, subtle: OBSIDIAN_COLORS.green_subtle },
  sortie: { label: 'Sortie', color: OBSIDIAN_COLORS.danger, subtle: OBSIDIAN_COLORS.danger_subtle },
  ajustement: { label: 'Ajustement', color: OBSIDIAN_COLORS.warning, subtle: OBSIDIAN_COLORS.warning_subtle },
  transfert: { label: 'Transfert', color: OBSIDIAN_COLORS.purple, subtle: OBSIDIAN_COLORS.purple_subtle },
};

const MovementCardComponent: React.FC<MovementCardProps> = ({
  index,
  articleNom,
  type,
  stockSite,
  delta,
  dateText,
}) => {
  const meta = typeMeta[type];
  const deltaPrefix = delta > 0 ? '+' : '';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
      <View style={[styles.card, { borderLeftColor: meta.color }]}> 
        <View style={styles.rowTop}>
          <Text style={styles.articleName} numberOfLines={1}>
            {articleNom}
          </Text>
          <Text style={styles.dateText}>{dateText}</Text>
        </View>

        <View style={styles.rowBottom}>
          <View style={[styles.typePill, { backgroundColor: meta.subtle }]}> 
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text style={[styles.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          <Text style={styles.siteText} numberOfLines={1}>
            {stockSite ?? 'Site inconnu'}
          </Text>

          <Text style={[styles.delta, { color: delta >= 0 ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.danger }]}>
            {`${deltaPrefix}${delta}`}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const MovementCard = React.memo(MovementCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderLeftWidth: 3,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleName: {
    color: OBSIDIAN_COLORS.text_primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  dateText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
  },
  rowBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  typePill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  siteText: {
    color: OBSIDIAN_COLORS.text_muted,
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    marginRight: 8,
  },
  delta: {
    fontSize: 14,
    fontWeight: '700',
  },
});
