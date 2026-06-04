import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Article } from '@/types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { formatPCDate, getPCStateFromArticle, isPCArticle } from '@/constants/pcStates';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { PCSwipeActions } from './PCSwipeActions';

interface PCCardCompactProps {
  article: Article;
  index: number;
  onPress: (articleId: number) => void;
  onMarkHot?: (articleId: number) => void;
  onMarkAvailable?: (articleId: number) => void;
  onMarkProcessing?: (articleId: number) => void;
  onMarkSent?: (articleId: number) => void;
  onMarkBreakdown?: (articleId: number) => void;
  onDelete?: (articleId: number) => void;
}

export const PCCardCompact: React.FC<PCCardCompactProps> = ({ article, index, onPress, onMarkHot, onMarkAvailable, onMarkProcessing, onMarkSent, onMarkBreakdown, onDelete }) => {
  if (!isPCArticle(article)) return null;
  const state = getPCStateFromArticle(article);
  const actionVariant = state.key === 'a_chaud' ? 'available' : state.key === 'a_reusiner' ? 'processing' : 'hot';
  const swipe = useSwipeGesture({ maxSwipe: -240, openThreshold: -80 });
  const hostname = article.nom || article.reference;
  const allocation = article.sousType || article.typeArticle || article.famille || 'PC';
  const model = article.modele || '';

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 24).duration(220)} style={styles.outer}>
      <View style={styles.shell}>
        <PCSwipeActions
          height={64}
          onHot={() => onMarkHot?.(Number(article.id))}
          onAvailable={() => onMarkAvailable?.(Number(article.id))}
          onProcessing={() => onMarkProcessing?.(Number(article.id))}
          actionVariant={actionVariant}
          onSent={() => onMarkSent?.(Number(article.id))}
          onBreakdown={() => onMarkBreakdown?.(Number(article.id))}
          onDelete={() => onDelete?.(Number(article.id))}
        />
        <GestureDetector gesture={swipe.gesture}>
          <Animated.View style={[styles.card, { borderColor: state.border, backgroundColor: state.bg }, swipe.cardStyle]}>
            <Pressable onPress={() => onPress(Number(article.id))} style={styles.row}>
              <View style={styles.leftIcon}>
                <Icon name="laptop" size={18} color={OBSIDIAN_COLORS.green_light} />
              </View>
              <View style={styles.center}>
                <View style={styles.inlineTop}>
                  <Text style={styles.hostname} numberOfLines={1}>{hostname}</Text>
                  <View style={[styles.stateDot, { backgroundColor: state.bg, borderColor: state.border }]}>
                    <Icon name={state.icon} size={12} color={state.text} />
                  </View>
                </View>
                <Text style={styles.meta} numberOfLines={1}>{allocation} · {model || `Modifié le ${formatPCDate(article.dateModification)}`}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={OBSIDIAN_COLORS.text_muted} />
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outer: {
    marginBottom: 10,
  },
  shell: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  center: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  inlineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostname: {
    flex: 1,
    minWidth: 0,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stateDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
