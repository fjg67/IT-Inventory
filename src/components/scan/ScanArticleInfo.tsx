import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { SCAN_COLORS } from './tokens';

type ScanArticleInfoProps = {
  article: Article;
  onClose: () => void;
};

export const ScanArticleInfo: React.FC<ScanArticleInfoProps> = ({ article, onClose }) => {
  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.handle} />
      </View>

      <View style={styles.headerRow}>
        {article.photoUrl ? (
          <Image source={{ uri: article.photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.iconWrap}>
            <Icon name="package-variant-closed" size={20} color={SCAN_COLORS.green_light} />
          </View>
        )}

        <View style={styles.main}>
          <View style={styles.rowStart}>
            <View style={styles.refBadge}>
              <Icon name="barcode" size={11} color={SCAN_COLORS.text_muted} />
              <Text style={styles.refText}>{article.reference}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Icon name="close" size={14} color={SCAN_COLORS.text_muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name} numberOfLines={2}>{article.nom}</Text>

          <View style={styles.tags}>
            {article.marque ? (
              <View style={styles.tag}>
                <Icon name="domain" size={11} color={SCAN_COLORS.text_muted} />
                <Text style={styles.tagText}>{article.marque}</Text>
              </View>
            ) : null}
            {article.famille ? (
              <View style={styles.tag}>
                <Icon name="shape-outline" size={11} color={SCAN_COLORS.text_muted} />
                <Text style={styles.tagText}>{article.famille}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: SCAN_COLORS.bg_card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: SCAN_COLORS.green_subtle,
    borderWidth: 1,
    borderColor: SCAN_COLORS.border_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: SCAN_COLORS.bg_card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refText: {
    color: SCAN_COLORS.text_secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: SCAN_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: SCAN_COLORS.text_primary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SCAN_COLORS.bg_card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    color: SCAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
