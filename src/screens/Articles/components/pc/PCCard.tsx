import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Article } from '@/types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { formatPCDate, getPCStateFromArticle, isPCArticle } from '@/constants/pcStates';
import { PANNE_TYPE_CONFIG, PanneType } from '@/types/pc.types';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { PCSwipeActions } from './PCSwipeActions';

interface PCCardProps {
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

interface TagProps {
  icon: string;
  label: string;
  backgroundColor: string;
  color?: string;
}

const Tag: React.FC<TagProps> = ({ icon, label, backgroundColor, color = OBSIDIAN_COLORS.text_primary }) => (
  <View style={[styles.tag, { backgroundColor }]}>
    <Icon name={icon} size={10} color={color} />
    <Text style={[styles.tagText, { color }]} numberOfLines={1}>{label}</Text>
  </View>
);

export const PCCard: React.FC<PCCardProps> = ({ article, index, onPress, onMarkHot, onMarkAvailable, onMarkProcessing, onMarkSent, onMarkBreakdown, onDelete }) => {
  const state = useMemo(() => getPCStateFromArticle(article), [article]);
  const swipe = useSwipeGesture({ maxSwipe: -240, openThreshold: -80 });

  if (!isPCArticle(article)) {
    return null;
  }

  const hostname = article.nom || article.reference || 'Poste sans nom';
  const brandModel = [article.marque, article.modele].filter(Boolean).join(' ');
  const allocation = article.sousType || article.typeArticle || article.famille || 'PC';
  const identifier = article.barcode || article.reference || '';
  const lastUpdated = formatPCDate(article.dateModification);
  const parsedPanneType = useMemo<PanneType | null>(() => {
    const match = article.description?.match(/type\s*:\s*(materielle|logicielle|batterie|reseau|autre)/i);
    return (match?.[1]?.toLowerCase() as PanneType) ?? null;
  }, [article.description]);
  const panneType = article.panneType ?? parsedPanneType;
  const panneLabel = panneType ? PANNE_TYPE_CONFIG[panneType]?.label : 'Non renseignée';

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).duration(260)} style={styles.outer}>
      <View style={styles.swipeShell}>
        <PCSwipeActions
          height={116}
          onHot={() => onMarkHot?.(Number(article.id))}
          onAvailable={() => onMarkAvailable?.(Number(article.id))}
          onProcessing={() => onMarkProcessing?.(Number(article.id))}
          onSent={() => onMarkSent?.(Number(article.id))}
          onBreakdown={() => onMarkBreakdown?.(Number(article.id))}
          onDelete={() => onDelete?.(Number(article.id))}
        />

        <GestureDetector gesture={swipe.gesture}>
          <Animated.View
            style={[
              styles.card,
              {
                borderColor: OBSIDIAN_COLORS.border_subtle,
                borderLeftColor: state.border,
                backgroundColor: OBSIDIAN_COLORS.bg_card,
              },
              swipe.cardStyle,
              styles.cardShadow,
            ]}
          >
            <Pressable onPress={() => onPress(Number(article.id))} style={styles.pressable}>
              <View style={[styles.laptopBox, { backgroundColor: OBSIDIAN_COLORS.bg_card_elevated }]}>
                <Icon name="laptop" size={22} color={OBSIDIAN_COLORS.green_light} />
              </View>

              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={styles.hostname} numberOfLines={1}>{hostname}</Text>
                  <View style={[styles.stateBadge, { backgroundColor: state.bg, borderColor: state.border }]}>
                    <Icon name={state.icon} size={12} color={state.text} />
                    <Text style={[styles.stateBadgeText, { color: state.text }]} numberOfLines={1}>{state.label}</Text>
                  </View>
                </View>

                <View style={styles.tagsRow}>
                  {identifier ? (
                    <Tag
                      icon="barcode"
                      label={identifier}
                      backgroundColor={OBSIDIAN_COLORS.bg_card_elevated}
                      color={OBSIDIAN_COLORS.text_secondary}
                    />
                  ) : null}
                  <Tag
                    icon="laptop"
                    label={allocation}
                    backgroundColor={OBSIDIAN_COLORS.blue_dark}
                    color="#ffffff"
                  />
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.dateWrap}>
                    <Icon name="clock-outline" size={10} color={OBSIDIAN_COLORS.text_secondary} />
                    <Text style={styles.dateText}>Maj le {lastUpdated}</Text>
                  </View>
                  {brandModel ? <Text style={styles.modelText} numberOfLines={1}>{brandModel}</Text> : null}
                </View>

                {state.key === 'en_panne' ? (
                  <View style={styles.panneRow}>
                    <Icon name="alert-circle-outline" size={11} color="#FCA5A5" />
                    <Text style={styles.panneText} numberOfLines={1}>Nature: {panneLabel}</Text>
                  </View>
                ) : null}
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
    marginBottom: 12,
  },
  swipeShell: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    minHeight: 116,
  },
  cardShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  laptopBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
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
    minWidth: 0,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 150,
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'space-between',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    flexShrink: 1,
  },
  dateText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  modelText: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    maxWidth: '52%',
  },
  panneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  panneText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
});
