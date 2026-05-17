import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Article } from '@/types';
import { ADC, INFO_BADGE } from './articleDetailColors';
import { ArticleInfoRow } from './ArticleInfoRow';
import { InfoBadge } from './InfoBadge';

interface ArticleInfoSectionProps {
  article: Article;
  siteName?: string;
  inventoryStatus?: string | null;
  isTabletArticle?: boolean;
}

export const ArticleInfoSection: React.FC<ArticleInfoSectionProps> = ({
  article,
  siteName,
  inventoryStatus,
  isTabletArticle,
}) => {
  const getStatusBadge = () => {
    if (!inventoryStatus) return null;
    const map: Record<string, typeof INFO_BADGE[keyof typeof INFO_BADGE]> = {
      'À chaud': INFO_BADGE.statut_chaud,
      'Disponible': INFO_BADGE.statut_disponible,
      'En usinage': INFO_BADGE.statut_usinage,
      'À reusiner': INFO_BADGE.statut_reusiner,
    };
    return map[inventoryStatus] ?? null;
  };
  const statusBadge = getStatusBadge();

  const rows: Array<{ key: string; label: string; value?: string | null; badge?: typeof INFO_BADGE[keyof typeof INFO_BADGE] }> = [
    { key: 'ref', label: 'Référence', value: article.reference },
    ...(article.codeFamille ? [{ key: 'cf', label: 'Code famille', value: article.codeFamille, badge: INFO_BADGE.code_famille }] : []),
    ...(article.famille ? [{ key: 'fam', label: 'Famille', value: article.famille, badge: INFO_BADGE.famille }] : []),
    ...(article.typeArticle ? [{ key: 'type', label: 'Type', value: article.typeArticle, badge: INFO_BADGE.type }] : []),
    ...(article.sousType ? [{ key: 'st', label: 'Sous-type', value: article.sousType, badge: INFO_BADGE.sous_type }] : []),
    ...(article.marque ? [{ key: 'mar', label: 'Marque', value: article.marque, badge: INFO_BADGE.marque }] : []),
    ...(article.modele ? [{ key: 'mod', label: 'Modèle', value: article.modele, badge: INFO_BADGE.modele }] : []),
    ...(article.barcode ? [{ key: 'bc', label: 'Asset', value: article.barcode, badge: INFO_BADGE.barcode }] : []),
    ...(inventoryStatus && statusBadge ? [{ key: 'stat', label: 'Statut', value: inventoryStatus, badge: statusBadge }] : []),
    ...(article.emplacement ? [{ key: 'emp', label: 'Emplacement', value: article.emplacement, badge: INFO_BADGE.emplacement }] : []),
    { key: 'site', label: 'Site', value: siteName ?? '—' },
    ...(article.description ? [{ key: 'desc', label: 'Description', value: article.description }] : []),
  ];

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(300)}>
      <View style={styles.sectionHeader}>
        <View style={styles.accentBar} />
        <Text style={styles.sectionTitle}>{isTabletArticle ? 'Fiche article' : 'Informations'}</Text>
      </View>
      <View style={styles.card}>
        {rows.map((row, idx) => (
          <ArticleInfoRow key={row.key} label={row.label} isLast={idx === rows.length - 1}>
            {row.badge && row.value ? (
              <InfoBadge label={row.value} icon={row.badge.icon} color={row.badge.color} bg={row.badge.bg} />
            ) : (
              <Text
                style={[
                  styles.textValue,
                  row.key === 'ref' && styles.refMono,
                  row.key === 'desc' && styles.descItalic,
                ]}
                numberOfLines={row.key === 'desc' ? 3 : 1}
              >
                {row.value ?? '—'}
              </Text>
            )}
          </ArticleInfoRow>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  accentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: ADC.green_primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ADC.text_primary,
  },
  card: {
    backgroundColor: ADC.bg_card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    overflow: 'hidden',
  },
  textValue: {
    fontSize: 13,
    fontWeight: '600',
    color: ADC.text_primary,
    textAlign: 'right',
  },
  refMono: {
    color: ADC.text_secondary,
    fontFamily: 'monospace',
  },
  descItalic: {
    color: ADC.text_secondary,
    fontStyle: 'italic',
    fontSize: 12,
  },
});
