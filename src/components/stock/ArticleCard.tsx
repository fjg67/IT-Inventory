// ============================================
// ARTICLE CARD COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { Card, Badge } from '../common';
import { Article } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { isTablet as checkIsTablet } from '../../utils/responsive';

interface ArticleCardProps {
  article: Article;
  onPress?: () => void;
  showStock?: boolean;
  alerteStock?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onPress,
  showStock = true,
  alerteStock = false,
}) => {
  const stockVariant = alerteStock ? 'warning' : 'success';
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  
  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        {/* Image */}
        {article.photoUrl ? (
          <Image source={{ uri: article.photoUrl }} style={[styles.image, tablet && { width: 68, height: 68 }]} />
        ) : (
          <View style={[styles.imagePlaceholder, tablet && { width: 68, height: 68 }]}>
            <Text style={[styles.imagePlaceholderText, tablet && { fontSize: 18 }]}>
              {article.nom.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Infos */}
        <View style={styles.info}>
          <Text style={[styles.reference, tablet && { fontSize: 13 }]}>{article.reference}</Text>
          <Text style={[styles.nom, tablet && { fontSize: 17 }]} numberOfLines={2}>
            {article.nom}
          </Text>
          {article.categorieNom && (
            <Text style={[styles.categorie, tablet && { fontSize: 13 }]}>{article.categorieNom}</Text>
          )}
        </View>

        {/* Stock */}
        {showStock && (
          <View style={styles.stockContainer}>
            <Badge
              label={`${article.quantiteActuelle ?? 0}`}
              variant={stockVariant}
              size="lg"
            />
            <Text style={styles.unite}>{article.unite}</Text>
            {alerteStock && (
              <Text style={styles.stockMini}>Min: {article.stockMini}</Text>
            )}
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    ...typography.h4,
    color: colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  reference: {
    ...typography.small,
    color: colors.text.secondary,
  },
  nom: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginTop: 2,
  },
  categorie: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stockContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  unite: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  stockMini: {
    ...typography.small,
    color: colors.warning,
    marginTop: 2,
  },
});

export default ArticleCard;
