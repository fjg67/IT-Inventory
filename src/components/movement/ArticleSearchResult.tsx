import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { MOVEMENT_COLORS } from './movementTheme';

interface Props {
  article: Article;
  onPress: (article: Article) => void;
  isLast?: boolean;
}

const Component: React.FC<Props> = ({ article, onPress, isLast }) => {
  const qty = article.quantiteActuelle ?? 0;

  return (
    <TouchableOpacity style={[styles.row, !isLast && styles.separator]} onPress={() => onPress(article)}>
      <View style={styles.thumb}>
        {article.photoUrl ? (
          <Image source={{ uri: article.photoUrl }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <Icon name="package-variant-closed" size={18} color={MOVEMENT_COLORS.text_secondary} />
        )}
      </View>
      <View style={styles.main}>
        <Text style={styles.ref}>{article.reference}</Text>
        <Text style={styles.name} numberOfLines={1}>{article.nom}</Text>
      </View>
      <View style={styles.stockBadge}>
        <Text style={styles.stockText}>{qty} {article.unite}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const ArticleSearchResult = memo(Component);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: MOVEMENT_COLORS.border_subtle,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  main: {
    flex: 1,
  },
  ref: {
    color: MOVEMENT_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  stockBadge: {
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
