import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInLeft, FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Mouvement } from '@/types';
import { ADC } from './articleDetailColors';
import { HistoryTimelineDot } from './HistoryTimelineDot';
import { HistoryCard } from './HistoryCard';

interface ArticleHistoryProps {
  movements: Mouvement[];
  onSeeAll?: () => void;
}

const INITIAL_COUNT = 5;

export const ArticleHistory: React.FC<ArticleHistoryProps> = ({ movements, onSeeAll }) => {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? movements : movements.slice(0, INITIAL_COUNT);
  const remaining = movements.length - INITIAL_COUNT;

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(300)}>
      <View style={styles.sectionHeader}>
        <View style={styles.accentBar} />
        <Text style={styles.sectionTitle}>Historique</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{movements.length}</Text>
        </View>
        {onSeeAll && movements.length > INITIAL_COUNT && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Voir tout ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {movements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="chart-timeline-variant" size={32} color={ADC.text_dim} />
          <Text style={styles.emptyTitle}>Aucun mouvement</Text>
          <Text style={styles.emptySub}>L'historique apparaîtra ici</Text>
        </View>
      ) : (
        <>
          <View style={styles.timeline}>
            {displayItems.map((m, idx) => (
              <Animated.View
                key={m.id}
                entering={FadeInLeft.delay(idx * 50).duration(250)}
                style={styles.tlItem}
              >
                <HistoryTimelineDot
                  type={m.type}
                  showLine={idx < displayItems.length - 1}
                />
                <View style={styles.cardWrap}>
                  <HistoryCard movement={m} />
                </View>
              </Animated.View>
            ))}
          </View>

          {!showAll && remaining > 0 && (
            <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(true)}>
              <Icon name="chevron-down" size={16} color={ADC.green_light} />
              <Text style={styles.moreText}>Voir les {remaining} autre{remaining > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  accentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: ADC.green_primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ADC.text_primary,
  },
  countBadge: {
    backgroundColor: ADC.bg_card_elevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADC.text_secondary,
  },
  seeAllBtn: { marginLeft: 'auto' },
  seeAllText: {
    fontSize: 13,
    color: ADC.green_light,
    fontWeight: '500',
  },
  timeline: {
    gap: 0,
  },
  tlItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardWrap: {
    flex: 1,
    paddingTop: 2,
  },
  emptyCard: {
    backgroundColor: ADC.bg_card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ADC.text_primary,
  },
  emptySub: {
    fontSize: 13,
    color: ADC.text_muted,
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: ADC.bg_card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    marginTop: 4,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    color: ADC.green_light,
  },
});
