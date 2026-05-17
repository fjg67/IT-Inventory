import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { formatPCDate, getPCStateFromArticle } from '@/constants/pcStates';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { PARC_PC_COLORS, SWIPE_ACTIONS } from './tokens';
import { PCSwipeButton } from './PCSwipeButton';

const BUTTON_WIDTH = 80;
const MAX_TRANSLATE = -(BUTTON_WIDTH * 3);

interface PCCardProps {
  article: Article;
  index: number;
  onPress: (articleId: number) => void;
  onMarkSent?: (articleId: number | string) => void;
  onMarkHot?: (articleId: number | string) => void;
  onDelete?: (articleId: number | string) => void;
}

const PCCardComponent: React.FC<PCCardProps> = ({ article, index, onPress, onMarkSent, onMarkHot, onDelete }) => {
  const state = useMemo(() => getPCStateFromArticle(article), [article]);
  const swipe = useSwipeGesture({ maxSwipe: MAX_TRANSLATE, openThreshold: -BUTTON_WIDTH });
  const isSent = state.key === 'envoye' || String(article.id).startsWith('sent-');

  const hostname = article.nom || article.reference || 'Poste sans nom';
  const asset = article.reference || article.barcode || 'Sans asset';
  const subType = article.sousType || article.famille || 'PC portable';
  const model = [article.marque, article.modele].filter(Boolean).join(' ');
  const lastUpdated = formatPCDate(article.dateModification);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 35).duration(250)} style={styles.outer}>
      <View style={styles.swipeShell}>
        {!isSent ? (
          <Animated.View style={[styles.actions, swipe.actionsStyle]} pointerEvents="box-none">
            <PCSwipeButton {...SWIPE_ACTIONS.sent} onPress={() => onMarkSent?.(article.id)} />
            <PCSwipeButton {...SWIPE_ACTIONS.hot} onPress={() => onMarkHot?.(article.id)} />
            <PCSwipeButton {...SWIPE_ACTIONS.delete} onPress={() => onDelete?.(article.id)} />
          </Animated.View>
        ) : null}

        <GestureDetector gesture={swipe.gesture}>
          <Animated.View style={[styles.card, { borderColor: PARC_PC_COLORS.border_subtle, borderLeftColor: state.color }, swipe.cardStyle]}>
            <Pressable onPress={() => onPress(Number(article.id))} style={styles.pressable}>
              <View style={[styles.stateWash, { backgroundColor: state.subtle }]} />
              <View style={styles.iconWrap}>
                <Icon name="laptop" size={22} color={PARC_PC_COLORS.green_light} />
              </View>

              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={styles.hostname} numberOfLines={1}>{hostname}</Text>
                  <View style={[styles.stateBadge, { backgroundColor: state.subtle, borderColor: state.border }]}>
                    <Icon name={state.icon} size={12} color={state.color} />
                    <Text style={[styles.stateText, { color: state.color }]} numberOfLines={1}>{state.label}</Text>
                  </View>
                </View>

                <View style={styles.middleRow}>
                  <View style={styles.metaTag}>
                    <Icon name="barcode" size={11} color={PARC_PC_COLORS.text_muted} />
                    <Text style={styles.metaText} numberOfLines={1}>{asset}</Text>
                  </View>
                  <View style={styles.metaTag}>
                    <Icon name="laptop" size={11} color={PARC_PC_COLORS.text_muted} />
                    <Text style={styles.metaText} numberOfLines={1}>{subType}</Text>
                  </View>
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.metaInline}>
                    <Icon name="clock-outline" size={11} color={PARC_PC_COLORS.text_dim} />
                    <Text style={styles.bottomText}>Maj le {lastUpdated}</Text>
                  </View>
                  {model ? <Text style={styles.bottomText} numberOfLines={1}>{model}</Text> : null}
                </View>
              </View>
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
  swipeShell: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 240,
    flexDirection: 'row',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    backgroundColor: PARC_PC_COLORS.bg_card,
    overflow: 'hidden',
  },
  pressable: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  stateWash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderColor: PARC_PC_COLORS.border_subtle,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hostname: {
    flex: 1,
    color: PARC_PC_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '800',
  },
  stateBadge: {
    minHeight: 28,
    maxWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  stateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  middleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
  },
  metaText: {
    color: PARC_PC_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 130,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomText: {
    flexShrink: 1,
    color: PARC_PC_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '600',
  },
});

export const PCCard = memo(PCCardComponent);
