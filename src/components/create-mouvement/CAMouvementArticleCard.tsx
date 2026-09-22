import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
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
    <LinearGradient
      colors={[CA_THEME.white, '#F3FAF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.inner}
    >
      <View style={styles.accentRail} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.imgWrap} accessibilityElementsHidden>
            {article.imageUrl ? (
              <Image source={{ uri: article.imageUrl }} style={styles.img} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : (
              <Icon name="package-variant-closed" size={24} color={CA_THEME.green} />
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.refRow}>
              <Icon name="barcode" size={13} color={CA_THEME.green} />
              <Text style={styles.ref}>{article.reference}</Text>
            </View>
            <Text style={styles.name} numberOfLines={2}>{article.label}</Text>
          </View>

          <Pressable onPress={onDeselect} style={styles.closeBtn}
            accessibilityRole="button" accessibilityLabel="Changer d'article" hitSlop={8}>
            <Icon name="close" size={16} color={CA_THEME.greenText} />
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.stockPanel} accessibilityLabel={`Stock actuel : ${article.stockActuel} pièces`}>
            <View>
              <Text style={styles.stockCaption}>STOCK ACTUEL</Text>
              <Text style={styles.stockNum}>{article.stockActuel} <Text style={styles.stockUnit}>Pcs</Text></Text>
            </View>
            <View style={styles.stockIcon}>
              <Icon name="check" size={14} color={CA_THEME.green} />
            </View>
          </View>

          <View style={styles.siteRow}>
            <View style={styles.siteIcon}>
              <Icon name="map-marker" size={13} color={CA_THEME.green} />
            </View>
            <View>
              <Text style={styles.siteCaption}>EMPLACEMENT</Text>
              <Text style={styles.siteText} numberOfLines={1}>{article.site}</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFE5D9',
    overflow: 'hidden',
    shadowColor: '#145540',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  inner: { minHeight: 138, flexDirection: 'row' },
  accentRail: { width: 5, backgroundColor: CA_THEME.green },
  content: { flex: 1, padding: 13, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  imgWrap: {
    width: 58, height: 58, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D9EAE0',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  img:      { width: '100%', height: '100%' },
  info:     { flex: 1, minWidth: 0 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  ref:      { fontSize: 11, fontWeight: '700', color: CA_THEME.greenText, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.3 },
  name:     { fontSize: 15, lineHeight: 20, fontWeight: '700', color: CA_THEME.textPrimary },
  closeBtn:  {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#E8F5EF',
    borderWidth: 1, borderColor: '#B5D9C6',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockPanel: { flex: 1, minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: '#E8F5EF', borderWidth: 1, borderColor: '#B5D9C6' },
  stockCaption: { color: CA_THEME.greenText, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  stockNum: { color: CA_THEME.green, fontSize: 19, fontWeight: '800', lineHeight: 22 },
  stockUnit: { fontSize: 10, fontWeight: '700' },
  stockIcon: { width: 25, height: 25, borderRadius: 13, backgroundColor: CA_THEME.white, alignItems: 'center', justifyContent: 'center' },
  siteRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  siteIcon: { width: 25, height: 25, borderRadius: 8, backgroundColor: '#F0F5F2', alignItems: 'center', justifyContent: 'center' },
  siteCaption: { color: CA_THEME.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.7, marginBottom: 2 },
  siteText: { color: CA_THEME.textSecondary, fontSize: 11, fontWeight: '700', maxWidth: 100 },
});
