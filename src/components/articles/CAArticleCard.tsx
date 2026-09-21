import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { CA_THEME } from '@/constants/caTheme';
import { Article } from '@/types';
import { CAStockBadge } from './CAStockBadge';
import { CAConditionBadge } from './CAConditionBadge';

interface CAArticleCardProps {
  article: Article;
  index: number;
  query?: string;
  onPress: (articleId: number) => void;
}

const getArticleBorderColor = (article: Article): string => {
  const quantity = article.quantiteActuelle ?? 0;
  if (article.condition === 'defectueux' || article.condition === 'broken') return CA_THEME.danger;
  if (quantity <= 0) return CA_THEME.danger;
  if (quantity <= article.stockMini) return CA_THEME.warning;
  return CA_THEME.green;
};

const formatDate = (date?: string | Date): string => {
  if (!date) return 'récemment';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const renderNameWithHighlight = (name: string, query?: string) => {
  const search = (query ?? '').trim();
  if (!search) return <Text style={styles.name} numberOfLines={1}>{name}</Text>;

  const lowerName = name.toLowerCase();
  const lowerSearch = search.toLowerCase();
  const first = lowerName.indexOf(lowerSearch);
  if (first === -1) return <Text style={styles.name} numberOfLines={1}>{name}</Text>;

  const before = name.slice(0, first);
  const match = name.slice(first, first + search.length);
  const after = name.slice(first + search.length);

  return (
    <Text style={styles.name} numberOfLines={1}>
      {before}
      <Text style={styles.highlightText}>{match}</Text>
      {after}
    </Text>
  );
};

const CAArticleCardComponent = ({
  article,
  index,
  query,
  onPress,
}: CAArticleCardProps) => {
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.98]) }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40).duration(280)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => onPress(article.id)}
          onPressIn={() => { press.value = withSpring(1); }}
          onPressOut={() => { press.value = withSpring(0); }}
          style={[styles.card, { borderLeftColor: getArticleBorderColor(article) }]}
          accessibilityRole="button"
          accessibilityLabel={`${article.nom}, ${article.quantiteActuelle} unités`}
        >
          <View style={styles.inner}>

            {/* Image ou icône article */}
            <View style={styles.imageWrap} aria-hidden>
              {article.photoUrl ? (
                <Image
                  source={{ uri: article.photoUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon name="cube-outline" size={26} color={CA_THEME.textMuted} />
              )}
            </View>

            {/* Infos */}
            <View style={styles.info}>
              {/* Nom */}
              {renderNameWithHighlight(article.nom, query)}
              
              {/* Sous-catégorie */}
              <Text style={styles.subcat} numberOfLines={1}>
                {article.famille ?? article.marque ?? 'Sans catégorie'}
              </Text>

              {/* Tags : référence + type + catégorie */}
              <View style={styles.tagsRow}>
                {article.reference ? (
                  <View style={styles.tagRef}>
                    <Icon name="barcode" size={10} color={CA_THEME.textMuted} />
                    <Text style={styles.tagRefText}>{article.reference}</Text>
                  </View>
                ) : null}
                {article.typeArticle ? (
                  <View style={styles.tagType}>
                    <Text style={styles.tagTypeText}>{article.typeArticle}</Text>
                  </View>
                ) : null}
              </View>

              {/* Condition */}
              <CAConditionBadge
                condition={article.condition ?? 'bon_etat'}
                defectiveCount={article.defectiveCount}
              />

              {/* Date modification */}
              <View style={styles.dateRow}>
                <Icon name="clock-outline" size={10} color={CA_THEME.textMuted} />
                <Text style={styles.dateText}>
                  Modifié le {formatDate(article.dateModification)}
                </Text>
              </View>
            </View>

            {/* Stock badge + chevron */}
            <View style={styles.rightCol}>
              <CAStockBadge
                stock={article.quantiteActuelle ?? 0}
                seuil={article.stockMini}
              />
              <Icon name="chevron-right" size={16} color={CA_THEME.textMuted} style={styles.chev} />
            </View>

          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const areEqual = (prev: CAArticleCardProps, next: CAArticleCardProps) => {
  return (
    prev.article.id === next.article.id &&
    prev.article.quantiteActuelle === next.article.quantiteActuelle &&
    prev.article.stockMini === next.article.stockMini &&
    prev.article.nom === next.article.nom &&
    prev.article.reference === next.article.reference &&
    prev.article.condition === next.article.condition &&
    prev.article.defectiveCount === next.article.defectiveCount &&
    prev.query === next.query
  );
};

export const CAArticleCard = React.memo(CAArticleCardComponent, areEqual);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    overflow:        'hidden',
    marginBottom:    12,
  },
  inner: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    padding:       12,
    gap:           10,
  },
  imageWrap: {
    width:           54,
    height:          54,
    borderRadius:    8,
    backgroundColor: CA_THEME.lightGray,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    overflow:        'hidden',
  },
  image:    { width: '100%', height: '100%' },
  info:     { flex: 1, minWidth: 0 },
  name: {
    fontSize:   14,
    fontFamily: CA_THEME.fontFamilyBold,
    fontWeight: '700',
    color:      CA_THEME.textPrimary,
    marginBottom: 2,
  },
  highlightText: {
    color: CA_THEME.green,
  },
  subcat: {
    fontSize:   11,
    fontFamily: CA_THEME.fontFamilyMedium,
    color:      CA_THEME.textSecondary,
    marginBottom: 6,
  },
  tagsRow:  { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 6 },
  tagRef: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
  },
  tagRefText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textSecondary },
  tagType: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
  },
  tagTypeText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.greenText },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textMuted },
  rightCol: { flexShrink: 0, alignItems: 'flex-end', gap: 6 },
  chev:     { marginTop: 6 },
});
