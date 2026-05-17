import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { withSequence, withSpring } from 'react-native-reanimated';
import { Article } from '@/types';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  article: Article;
  siteName?: string;
  stock: number;
  identity: MovementIdentity;
  onClear: () => void;
}

export const SelectedArticleCard: React.FC<Props> = ({ article, siteName, stock, identity, onClear }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.dot, { backgroundColor: identity.color }]} />
        <Text style={[styles.headerText, { color: identity.color }]}>Article selectionne</Text>
      </View>

      <View style={[styles.card, { borderColor: identity.border }]}>
        <View style={styles.row}>
          <View style={styles.thumb}>
            {article.photoUrl ? (
              <Image source={{ uri: article.photoUrl }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <Icon name="package-variant-closed" size={20} color={identity.color} />
            )}
          </View>

          <View style={styles.main}>
            <Text style={styles.ref}>{article.reference}</Text>
            <Text style={styles.name} numberOfLines={2}>{article.nom}</Text>
            <View style={styles.stockPill}>
              <Text style={styles.stockLabel}>Stock actuel :</Text>
              <Text style={[styles.stockValue, { color: identity.color }]}> {stock} {article.unite}</Text>
            </View>
            <View style={styles.siteRow}>
              <Icon name="map-marker-outline" size={12} color={MOVEMENT_COLORS.text_muted} />
              <Text style={styles.siteText}>{siteName ?? 'Site inconnu'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              onClear();
            }}
          >
            <Animated.View entering={undefined}>
              <Icon name="close" size={14} color={MOVEMENT_COLORS.text_muted} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: MOVEMENT_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    fontWeight: '700',
  },
  name: {
    marginTop: 2,
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 15,
    fontWeight: '700',
  },
  stockPill: {
    marginTop: 6,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockLabel: {
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '600',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  siteRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteText: {
    color: MOVEMENT_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
