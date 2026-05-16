import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface ArticleTagRowProps {
  reference: string;
  famille?: string | null;
  marque?: string | null;
  typeArticle?: string | null;
}

const familyPalette = (famille?: string | null) => {
  const value = (famille ?? '').toLowerCase();
  if (value.includes('cable') || value.includes('câble')) {
    return { bg: OBSIDIAN_COLORS.info_subtle, color: OBSIDIAN_COLORS.info, icon: 'cable-data' };
  }
  if (value.includes('audio')) {
    return { bg: OBSIDIAN_COLORS.purple_subtle, color: OBSIDIAN_COLORS.purple, icon: 'headphones' };
  }
  if (value.includes('ergonomie')) {
    return { bg: OBSIDIAN_COLORS.warning_subtle, color: OBSIDIAN_COLORS.warning, icon: 'human-handsup' };
  }
  if (value.includes('charge')) {
    return { bg: OBSIDIAN_COLORS.green_subtle, color: OBSIDIAN_COLORS.green_light, icon: 'battery-charging' };
  }
  return { bg: OBSIDIAN_COLORS.bg_card_elevated, color: OBSIDIAN_COLORS.text_secondary, icon: 'tag-outline' };
};

const ArticleTagRowComponent: React.FC<ArticleTagRowProps> = ({ reference, famille, marque, typeArticle }) => {
  const familleStyle = useMemo(() => familyPalette(famille), [famille]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.tag, styles.refTag]}>
        <Icon name="barcode" size={12} color={OBSIDIAN_COLORS.text_secondary} />
        <Text style={styles.refText}>{reference}</Text>
      </View>

      {famille ? (
        <View style={[styles.tag, { backgroundColor: familleStyle.bg }]}> 
          <Icon name={familleStyle.icon} size={11} color={familleStyle.color} />
          <Text style={[styles.tagText, { color: familleStyle.color }]}>{famille}</Text>
        </View>
      ) : null}

      {marque ? (
        <View style={[styles.tag, styles.genericTag]}>
          <Text style={styles.tagText}>{marque}</Text>
        </View>
      ) : null}

      {typeArticle ? (
        <View style={[styles.tag, styles.genericTag]}>
          <Text style={styles.tagText}>{typeArticle}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const ArticleTagRow = React.memo(ArticleTagRowComponent);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  tag: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  refTag: {
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    borderWidth: 1,
  },
  genericTag: {
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
  },
  refText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tagText: {
    color: OBSIDIAN_COLORS.text_secondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
