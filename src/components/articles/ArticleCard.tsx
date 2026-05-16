import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { Article } from '@/types';
import { ArticleBadge } from './ArticleBadge';
import { ArticleTagRow } from './ArticleTagRow';

interface ArticleCardProps {
  article: Article;
  index: number;
  query?: string;
  onPress: (articleId: number) => void;
}

const getAccentColor = (article: Article): string => {
  const quantity = article.quantiteActuelle ?? 0;
  if (quantity <= 0) {
    return OBSIDIAN_COLORS.danger;
  }
  if (quantity <= article.stockMini) {
    return OBSIDIAN_COLORS.warning;
  }
  return OBSIDIAN_COLORS.green_primary;
};

const formatDate = (date?: string | Date): string => {
  if (!date) {
    return 'Modifie recemment';
  }

  const d = new Date(date);
  return `Modifie le ${d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })}`;
};

const renderNameWithHighlight = (name: string, query?: string) => {
  const search = (query ?? '').trim();
  if (!search) {
    return <Text style={styles.nameText}>{name}</Text>;
  }

  const lowerName = name.toLowerCase();
  const lowerSearch = search.toLowerCase();
  const first = lowerName.indexOf(lowerSearch);
  if (first === -1) {
    return <Text style={styles.nameText}>{name}</Text>;
  }

  const before = name.slice(0, first);
  const match = name.slice(first, first + search.length);
  const after = name.slice(first + search.length);

  return (
    <Text style={styles.nameText}>
      {before}
      <Text style={styles.highlightText}>{match}</Text>
      {after}
    </Text>
  );
};

const ArticleCardComponent: React.FC<ArticleCardProps> = ({ article, index, query, onPress }) => {
  const press = useSharedValue(0);
  const accent = useMemo(() => getAccentColor(article), [article]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.98]) }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).duration(280)}>
      <Animated.View style={[styles.cardWrap, animatedStyle]}>
        <Pressable
          onPress={() => onPress(article.id)}
          onPressIn={() => {
            press.value = withSpring(1);
          }}
          onPressOut={() => {
            press.value = withSpring(0);
          }}
          style={[styles.card, { borderLeftColor: accent }]}
        >
          <View style={styles.thumbWrap}>
            {article.photoUrl ? (
              <Image source={{ uri: article.photoUrl }} resizeMode="contain" style={styles.thumb} />
            ) : (
              <Icon name="cube-outline" size={24} color={OBSIDIAN_COLORS.text_muted} />
            )}
          </View>

          <View style={styles.content}>
            {renderNameWithHighlight(article.nom, query)}
            <Text style={styles.descText} numberOfLines={1}>{article.description || 'Sans description'}</Text>
            <ArticleTagRow
              reference={article.reference}
              famille={article.famille}
              marque={article.marque}
              typeArticle={article.typeArticle}
            />
            <View style={styles.dateRow}>
              <Icon name="clock-outline" size={11} color={OBSIDIAN_COLORS.text_dim} />
              <Text style={styles.dateText}>{formatDate(article.dateModification)}</Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <ArticleBadge quantity={article.quantiteActuelle ?? 0} minStock={article.stockMini} />
            <Icon name="chevron-right" size={16} color={OBSIDIAN_COLORS.text_muted} style={styles.chevron} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const areEqual = (prev: ArticleCardProps, next: ArticleCardProps) => {
  return (
    prev.article.id === next.article.id &&
    prev.article.quantiteActuelle === next.article.quantiteActuelle &&
    prev.article.stockMini === next.article.stockMini &&
    prev.article.nom === next.article.nom &&
    prev.article.reference === next.article.reference &&
    prev.query === next.query
  );
};

export const ArticleCard = React.memo(ArticleCardComponent, areEqual);

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 12,
  },
  card: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderLeftWidth: 4,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 108,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 14,
  },
  thumbWrap: {
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    marginRight: 10,
    width: 56,
  },
  thumb: {
    height: 52,
    width: 52,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
  },
  highlightText: {
    color: OBSIDIAN_COLORS.green_light,
    fontWeight: '700',
  },
  descText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    marginTop: 2,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  dateText: {
    color: OBSIDIAN_COLORS.text_dim,
    fontSize: 11,
    marginLeft: 4,
  },
  rightCol: {
    alignItems: 'center',
    marginLeft: 8,
  },
  chevron: {
    marginTop: 6,
  },
});
