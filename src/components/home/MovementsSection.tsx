import React, { useMemo } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { SectionHeader } from './SectionHeader';
import { MovementCard, MovementKind } from './MovementCard';

export interface MovementItem {
  id: string;
  articleNom: string;
  type: MovementKind;
  quantite: number;
  siteNom?: string;
  createdAt: string;
}

interface MovementsSectionProps {
  movements: MovementItem[];
  onSeeAll: () => void;
}

const ITEM_HEIGHT = 92;

const formatDayPill = (dateIso: string): string => {
  const date = new Date(dateIso);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const formatTime = (dateIso: string): string => {
  const date = new Date(dateIso);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

type MovementListItem =
  | { kind: 'day'; id: string; dateIso: string }
  | { kind: 'movement'; id: string; movement: MovementItem };

const getDayKey = (dateIso: string): string => {
  const date = new Date(dateIso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const MovementsSectionComponent: React.FC<MovementsSectionProps> = ({
  movements,
  onSeeAll,
}) => {
  const listItems = useMemo<MovementListItem[]>(() => {
    const items: MovementListItem[] = [];
    let previousDayKey = '';

    for (const movement of movements) {
      const dayKey = getDayKey(movement.createdAt);
      if (dayKey !== previousDayKey) {
        items.push({ kind: 'day', id: `day-${dayKey}`, dateIso: movement.createdAt });
        previousDayKey = dayKey;
      }

      items.push({ kind: 'movement', id: `movement-${movement.id}`, movement });
    }

    return items;
  }, [movements]);

  const renderItem = ({ item, index }: ListRenderItemInfo<MovementListItem>) => {
    if (item.kind === 'day') {
      return (
        <View style={styles.dayPillWrap}>
          <Text style={styles.dayPill}>{formatDayPill(item.dateIso)}</Text>
        </View>
      );
    }

    const movement = item.movement;
    return (
      <MovementCard
        index={index}
        articleNom={movement.articleNom}
        type={movement.type}
        stockSite={movement.siteNom}
        delta={movement.type === 'sortie' ? -Math.abs(movement.quantite) : Math.abs(movement.quantite)}
        dateText={formatTime(movement.createdAt)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="DERNIERS MOUVEMENTS" actionLabel="Voir tout" onActionPress={onSeeAll} />

      <FlatList
        data={listItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Aucun mouvement recent</Text>
            <TouchableOpacity onPress={onSeeAll} activeOpacity={0.8}>
              <Text style={styles.emptyAction}>Ouvrir les mouvements</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export const MovementsSection = React.memo(MovementsSectionComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  dayPillWrap: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  dayPill: {
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderRadius: 999,
    borderWidth: 1,
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'capitalize',
  },
  emptyWrap: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyAction: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 13,
    marginTop: 8,
  },
});
