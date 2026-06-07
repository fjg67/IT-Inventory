import React, { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Article } from '@/types';
import { formatPCDate, getPCStateFromArticle } from '@/constants/pcStates';
import { PANNE_TYPE_CONFIG, PanneType } from '@/types/pc.types';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { cleanModelName, getPCAsset, getPCDisplayName, getPCHostname, hasPCDisplayName } from '@/utils/pcHelpers';
import { PCSwipeButton } from './PCSwipeButton';
import { PARC_PC_COLORS } from './tokens';

interface PCCardProps {
  article: Article;
  index: number;
  onRename?: (article: Article) => void;
  onMarkSent?: (articleId: number | string) => void;
  onMarkHot?: (articleId: number | string) => void;
  onMarkAvailable?: (articleId: number | string) => void;
  onMarkBreakdown?: (articleId: number | string) => void;
  onResolveBreakdown?: (articleId: number | string) => void;
  onDelete?: (articleId: number | string) => void;
}

const PCCardComponent: React.FC<PCCardProps> = ({
  article,
  index,
  onRename,
  onMarkSent,
  onMarkHot,
  onMarkAvailable,
  onMarkBreakdown,
  onResolveBreakdown,
  onDelete,
}) => {
  const state = useMemo(() => getPCStateFromArticle(article), [article]);
  const isBreakdown = state.key === 'en_panne';
  const swipe = useSwipeGesture({ maxSwipe: -240, openThreshold: -80 });

  const displayName = getPCDisplayName(article);
  const hostname = getPCHostname(article);
  const customName = hasPCDisplayName(article);
  const model = cleanModelName([article.marque, article.modele].filter(Boolean).join(' '));
  const asset = getPCAsset(article);
  const categoryLabel = article.sousType || article.typeArticle || article.famille || 'PC portable';
  const isSiegePC = categoryLabel.toLowerCase().includes('siege') || categoryLabel.toLowerCase().includes('siège');
  const lastUpdated = formatPCDate(article.dateModification);

  const parsedPanneType = useMemo<PanneType | null>(() => {
    const match = article.description?.match(/type\s*:\s*(materielle|logicielle|batterie|reseau|autre)/i);
    return (match?.[1]?.toLowerCase() as PanneType) ?? null;
  }, [article.description]);
  const panneType = article.panneType ?? parsedPanneType;
  const panneLabel = panneType ? PANNE_TYPE_CONFIG[panneType]?.label : null;

  const handleRename = () => {
    if (!isSiegePC) return;
    onRename?.(article);
  };

  const handleMainAction = () => {
    if (isBreakdown) {
      onResolveBreakdown?.(article.id);
      return;
    }
    onMarkBreakdown?.(article.id);
  };

  const handleMarkSent = () => {
    onMarkSent?.(article.id);
    swipe.closeFromJS();
  };

  const handleMarkHot = () => {
    onMarkHot?.(article.id);
    swipe.closeFromJS();
  };

  const handleMarkAvailable = () => {
    onMarkAvailable?.(article.id);
    swipe.closeFromJS();
  };

  const handleDelete = () => {
    onDelete?.(article.id);
    swipe.closeFromJS();
  };

  const isHotPoste = state.key === 'a_chaud';

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 35).duration(240)} style={styles.outer}>
      <View style={styles.swipeShell}>
        <Animated.View style={[styles.swipeActionWrap, swipe.actionsStyle]}>
          <PCSwipeButton
            label="Envoye"
            sub="SORTIE"
            icon="send"
            color="#A78BFA"
            border="rgba(167,139,250,0.35)"
            backgroundColor="rgba(109,40,217,0.20)"
            onPress={handleMarkSent}
          />
          <PCSwipeButton
            label={isHotPoste ? 'Disponible' : 'A chaud'}
            sub={isHotPoste ? 'STOCK' : 'REMISE'}
            icon={isHotPoste ? 'check-circle-outline' : 'flash-outline'}
            color={isHotPoste ? '#60A5FA' : '#34D399'}
            border={isHotPoste ? 'rgba(96,165,250,0.35)' : 'rgba(52,211,153,0.35)'}
            backgroundColor={isHotPoste ? 'rgba(59,130,246,0.16)' : 'rgba(16,185,129,0.16)'}
            onPress={isHotPoste ? handleMarkAvailable : handleMarkHot}
          />
          <PCSwipeButton
            label="Supprimer"
            sub="RETIRER"
            icon="trash-can-outline"
            color="#F87171"
            border="rgba(248,113,113,0.35)"
            backgroundColor="rgba(239,68,68,0.16)"
            onPress={handleDelete}
          />
        </Animated.View>

        <GestureDetector gesture={swipe.gesture}>
          <Animated.View
            style={[
              styles.card,
              {
                borderColor: state.border,
                borderLeftColor: state.color,
                backgroundColor: isBreakdown ? 'rgba(127, 29, 29, 0.16)' : '#111A14',
              },
              swipe.cardStyle,
            ]}
          >
            <View style={[styles.glow, { backgroundColor: state.subtle }]} />

            <View style={styles.topRow}>
              <View style={[styles.avatar, { borderColor: state.border, backgroundColor: state.subtle }]}> 
                <Icon name={isBreakdown ? 'laptop-off' : 'laptop'} size={20} color={state.color} />
              </View>

              <View style={styles.pcInfo}>
                <Text style={styles.hostname} numberOfLines={1}>{displayName}</Text>
                {customName ? <Text style={styles.hostnameSecondary} numberOfLines={1}>{hostname}</Text> : null}
                {model ? <Text style={styles.model} numberOfLines={1}>{model}</Text> : null}
              </View>

              <View style={[styles.stateBadge, { backgroundColor: state.bg, borderColor: state.border }]}>
                <Icon name={state.icon} size={11} color={state.text} />
                <Text style={[styles.stateBadgeText, { color: state.text }]} numberOfLines={1}>{state.label}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Icon name="barcode" size={10} color={PARC_PC_COLORS.text_muted} />
                <Text style={styles.metaText} numberOfLines={1}>{asset}</Text>
              </View>
              <View style={styles.metaPill}>
                <Icon name="office-building-outline" size={10} color={PARC_PC_COLORS.text_muted} />
                <Text style={styles.metaText} numberOfLines={1}>{categoryLabel}</Text>
              </View>
              {isBreakdown && panneLabel ? (
                <View style={[styles.metaPill, styles.metaPillDanger]}>
                  <Icon name="alert-circle-outline" size={10} color="#FCA5A5" />
                  <Text style={[styles.metaText, styles.metaTextDanger]} numberOfLines={1}>{panneLabel}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.footer}>
              <View style={styles.dateRow}>
                <Icon name="clock-outline" size={11} color={PARC_PC_COLORS.text_dim} />
                <Text style={styles.date}>Maj {lastUpdated}</Text>
              </View>

              <View style={styles.actionsRow}>
                {isSiegePC ? (
                  <Pressable onPress={handleRename} style={styles.btnRename} hitSlop={8}>
                    <Icon name="pencil-outline" size={11} color="#86EFAC" />
                    <Text style={styles.btnRenameText}>Renommer</Text>
                  </Pressable>
                ) : null}

                <Pressable onPress={handleMainAction} style={isBreakdown ? styles.btnResolve : styles.btnPanne} hitSlop={8}>
                  <Icon
                    name={isBreakdown ? 'check-circle-outline' : 'alert-octagon-outline'}
                    size={11}
                    color={isBreakdown ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={isBreakdown ? styles.btnResolveText : styles.btnPanneText}>
                    {isBreakdown ? 'Resoudre' : 'En panne'}
                  </Text>
                </Pressable>
              </View>
            </View>
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
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeActionWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: 240,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -22,
    right: -22,
    width: 88,
    height: 88,
    borderRadius: 44,
    opacity: 0.46,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  pcInfo: {
    flex: 1,
    minWidth: 0,
  },
  hostname: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0FDF4',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  hostnameSecondary: {
    fontSize: 10,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  model: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: 140,
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaPill: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
  },
  metaPillDanger: {
    backgroundColor: 'rgba(127,29,29,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  metaText: {
    maxWidth: 160,
    color: PARC_PC_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '600',
  },
  metaTextDanger: {
    color: '#FCA5A5',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34,197,94,0.05)',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 10,
    color: '#4B5563',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btnRename: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
  },
  btnRenameText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#86EFAC',
  },
  btnPanne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.20)',
  },
  btnPanneText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  btnResolve: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.22)',
  },
  btnResolveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22C55E',
  },
});

export const PCCard = memo(PCCardComponent);
