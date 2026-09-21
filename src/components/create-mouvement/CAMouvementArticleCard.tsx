import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CAMouvementArticleCardProps {
  article: {
    reference:     string;
    label:         string;
    stockActuel:   number;
    site:          string;
    imageUrl?:     string | null;
  };
  onDeselect: () => void;
}

export const CAMouvementArticleCard = ({
  article, onDeselect
}: CAMouvementArticleCardProps) => (
  <View style={styles.card}>
    <View style={styles.inner}>
      {/* Image ou icône */}
      <View style={styles.imgWrap} aria-hidden>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.img} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <Icon name="package-variant-closed" size={24} color={CA_THEME.textMuted} />
        )}
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <Text style={styles.ref}>{article.reference}</Text>
        <Text style={styles.name}>{article.label}</Text>
        <View style={styles.stockPill} accessibilityLabel={`Stock actuel : ${article.stockActuel} pièces`}>
          <Text style={styles.stockText}>Stock actuel : </Text>
          <Text style={styles.stockNum}>{article.stockActuel} Pcs</Text>
        </View>
        <View style={styles.siteRow}>
          <Icon name="map-marker" size={11} color={CA_THEME.textMuted} />
          <Text style={styles.siteText}>{article.site}</Text>
        </View>
      </View>

      {/* Bouton déselectionner */}
      <Pressable onPress={onDeselect} style={styles.closeBtn}
        accessibilityRole="button" accessibilityLabel="Changer d'article" hitSlop={8}>
        <Icon name="close" size={14} color={CA_THEME.textMuted} />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    borderLeftColor: CA_THEME.green,
  },
  inner: { flexDirection: 'row', alignItems: 'flex-start', padding: 11, gap: 10 },
  imgWrap: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  img:      { width: '100%', height: '100%' },
  info:     { flex: 1, minWidth: 0 },
  ref:      { fontSize: 10, fontWeight: '600', color: CA_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 2 },
  name:     { fontSize: 14, fontWeight: '700', color: CA_THEME.textPrimary, marginBottom: 5 },
  stockPill: {
    flexDirection: 'row',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
    alignSelf: 'flex-start', marginBottom: 4,
  },
  stockText: { fontSize: 11, color: CA_THEME.greenText },
  stockNum:  { fontSize: 11, fontWeight: '700', color: CA_THEME.green },
  siteRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  siteText:  { fontSize: 10, color: CA_THEME.textMuted },
  closeBtn:  {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
