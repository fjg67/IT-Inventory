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

const MovementsSectionComponent: React.FC<MovementsSectionProps> = ({
  movements,
  onSeeAll,
}) => {
  const dayPill = useMemo(() => {
    if (movements.length === 0) {
      return null;
    }

    return formatDayPill(movements[0].createdAt);
  }, [movements]);

  const renderItem = ({ item, index }: ListRenderItemInfo<MovementItem>) => (
    <MovementCard
      index={index}
      articleNom={item.articleNom}
      type={item.type}
      stockSite={item.siteNom}
      delta={item.type === 'sortie' ? -Math.abs(item.quantite) : Math.abs(item.quantite)}
      dateText={formatTime(item.createdAt)}
    />
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="DERNIERS MOUVEMENTS" actionLabel="Voir tout" onActionPress={onSeeAll} />

      {dayPill ? (
        <View style={styles.dayPillWrap}>
          <Text style={styles.dayPill}>{dayPill}</Text>
        </View>
      ) : null}

      <FlatList
        data={movements}
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
