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
  variant?: 'list' | 'grid';
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

import Swipeable from 'react-native-gesture-handler/Swipeable';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const CAArticleCardComponent = ({
  article,
  index,
  query,
  variant = 'list',
  onPress,
}: CAArticleCardProps) => {
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.96]) }],
  }));

  const renderLeftActions = () => {
    return (
      <View style={[styles.swipeAction, { backgroundColor: CA_THEME.green }]}>
        <Icon name="plus" size={24} color="#FFF" />
        <Text style={styles.swipeText}>Entrée</Text>
      </View>
    );
  };

  const renderRightActions = () => {
    return (
      <View style={[styles.swipeAction, { backgroundColor: CA_THEME.danger, alignItems: 'flex-end' }]}>
        <Icon name="minus" size={24} color="#FFF" />
        <Text style={styles.swipeText}>Sortie</Text>
      </View>
    );
  };

  const handleSwipeWillOpen = () => {
    ReactNativeHapticFeedback.trigger('impactHeavy');
  };

  const isGrid = variant === 'grid';
  const isDefective = article.condition === 'defectueux' || article.condition === 'broken';

  const cardContent = (
    <Pressable
      onPress={() => onPress(article.id)}
      onPressIn={() => { press.value = withSpring(1); }}
      onPressOut={() => { press.value = withSpring(0); }}
      style={[
        styles.card, 
        isGrid ? styles.cardGrid : styles.cardList,
        { [isGrid ? 'borderTopColor' : 'borderLeftColor']: getArticleBorderColor(article) }
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${article.nom}, ${article.quantiteActuelle} unités`}
    >
      <View style={isGrid ? styles.innerGrid : styles.inner}>

        {/* Image ou icône article */}
        <View style={[styles.imageWrapContainer, isGrid && styles.imageWrapContainerGrid]}>
          <View style={[styles.imageWrap, isGrid && styles.imageWrapGrid]} aria-hidden>
            {article.photoUrl ? (
              <Image
                source={{ uri: article.photoUrl }}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Icon name="cube-outline" size={isGrid ? 40 : 26} color={CA_THEME.textMuted} />
            )}
          </View>
          {/* Badge 3D Condition (Chevauchant) */}
          <View style={[
            styles.badge3D,
            isGrid ? styles.badge3DGrid : styles.badge3DList,
            { backgroundColor: isDefective ? CA_THEME.danger : CA_THEME.green }
          ]}>
            <Icon
              name={isDefective ? 'alert' : 'check'}
              size={12}
              color="#FFF"
            />
          </View>
        </View>

        {/* Infos */}
        <View style={styles.info}>
          {/* Nom */}
          {renderNameWithHighlight(article.nom, query)}
          
          {/* Sous-catégorie */}
          {!isGrid && (
            <Text style={styles.subcat} numberOfLines={1}>
              {article.famille ?? article.marque ?? 'Sans catégorie'}
            </Text>
          )}

          {/* Tags : référence + type + catégorie */}
          <View style={styles.tagsRow}>
            {article.reference ? (
              <View style={styles.tagRef}>
                <Icon name="barcode" size={10} color={CA_THEME.textMuted} />
                <Text style={styles.tagRefText}>{article.reference}</Text>
              </View>
            ) : null}
            {!isGrid && article.typeArticle ? (
              <View style={styles.tagType}>
                <Text style={styles.tagTypeText}>{article.typeArticle}</Text>
              </View>
            ) : null}
          </View>

          {/* Date modification */}
          {!isGrid && (
            <View style={styles.dateRow}>
              <Icon name="clock-outline" size={10} color={CA_THEME.textMuted} />
              <Text style={styles.dateText}>
                Modifié le {formatDate(article.dateModification)}
              </Text>
            </View>
          )}
        </View>

        {/* Stock badge + chevron */}
        <View style={[styles.rightCol, isGrid && styles.rightColGrid]}>
          <CAStockBadge
            stock={article.quantiteActuelle ?? 0}
            seuil={article.stockMini}
          />
          {!isGrid && <Icon name="chevron-right" size={16} color={CA_THEME.textMuted} style={styles.chev} />}
        </View>

      </View>
    </Pressable>
  );

  return (
    <Animated.View style={[animatedStyle, isGrid && { flex: 1, marginHorizontal: 6 }]}>
      {isGrid ? cardContent : (
        <Swipeable
          renderLeftActions={renderLeftActions}
          renderRightActions={renderRightActions}
          onSwipeableWillOpen={handleSwipeWillOpen}
          friction={2}
          leftThreshold={40}
          rightThreshold={40}
        >
          {cardContent}
        </Swipeable>
      )}
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
  swipeAction: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    width: 100,
  },
  swipeText: {
    color: '#FFF',
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    overflow:        'hidden',
    marginBottom:    12,
  },
  cardGrid: {
    borderLeftWidth: 1,
    borderTopWidth: 4,
  },
  cardList: {
    borderLeftWidth: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    padding:       12,
    gap:           10,
  },
  innerGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  imageWrapContainer: {
    position: 'relative',
  },
  imageWrapContainerGrid: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
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
  imageWrapGrid: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  badge3D: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CA_THEME.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  badge3DList: {
    bottom: -4,
    right: -4,
  },
  badge3DGrid: {
    bottom: 0,
    right: '25%',
  },
  image:    { width: '100%', height: '100%' },
  info:     { flex: 1, minWidth: 0, alignItems: 'flex-start' },
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
  rightColGrid: {
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  chev:     { marginTop: 6 },
});
