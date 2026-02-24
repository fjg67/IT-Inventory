// ============================================
// MOUVEMENT CARD COMPONENT - IT-Inventory Application
// ============================================

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Card, Badge } from '../common';
import { Mouvement, MouvementType } from '@/types';
import { formatDateTimeParis } from '@/utils/dateUtils';
import { colors, spacing, typography } from '@/constants/theme';
import { MOUVEMENT_LABELS } from '@/constants/config';
import { isTablet as checkIsTablet } from '../../utils/responsive';

interface MouvementCardProps {
  mouvement: Mouvement;
  onPress?: () => void;
  compact?: boolean;
}

const getMouvementColor = (type: MouvementType): string => {
  switch (type) {
    case MouvementType.ENTREE:
    case MouvementType.TRANSFERT_ARRIVEE:
      return colors.success;
    case MouvementType.SORTIE:
    case MouvementType.TRANSFERT_DEPART:
      return colors.error;
    case MouvementType.AJUSTEMENT:
      return colors.warning;
    default:
      return colors.secondary;
  }
};

const getMouvementBadgeVariant = (type: MouvementType): 'success' | 'error' | 'warning' => {
  switch (type) {
    case MouvementType.ENTREE:
    case MouvementType.TRANSFERT_ARRIVEE:
      return 'success';
    case MouvementType.SORTIE:
    case MouvementType.TRANSFERT_DEPART:
      return 'error';
    case MouvementType.AJUSTEMENT:
      return 'warning';
    default:
      return 'warning';
  }
};

const formatDate = (date: Date | string): string => formatDateTimeParis(date);

const formatQuantite = (quantite: number): string => {
  return quantite > 0 ? `+${quantite}` : `${quantite}`;
};

export const MouvementCard: React.FC<MouvementCardProps> = ({
  mouvement,
  onPress,
  compact = false,
}) => {
  const color = getMouvementColor(mouvement.type);
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.indicator, { backgroundColor: color }]} />
        <View style={styles.compactContent}>
          <Text style={styles.compactDate}>
            {formatDate(mouvement.dateMouvement)}
          </Text>
          <Text style={[styles.compactQuantite, { color }]}>
            {formatQuantite(mouvement.quantite)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <Badge
          label={MOUVEMENT_LABELS[mouvement.type]}
          variant={getMouvementBadgeVariant(mouvement.type)}
        />
        <Text style={[styles.date, tablet && { fontSize: 13 }]}>{formatDate(mouvement.dateMouvement)}</Text>
      </View>

      <View style={styles.content}>
        {mouvement.article && (
          <View style={styles.articleInfo}>
            <Text style={[styles.articleRef, tablet && { fontSize: 13 }]}>{mouvement.article.reference}</Text>
            <Text style={[styles.articleNom, tablet && { fontSize: 17 }]} numberOfLines={1}>
              {mouvement.article.nom}
            </Text>
          </View>
        )}

        <View style={styles.quantiteContainer}>
          <Text style={[styles.quantite, { color }, tablet && { fontSize: 22 }]}>
            {formatQuantite(mouvement.quantite)}
          </Text>
          <Text style={[styles.stockApres, tablet && { fontSize: 13 }]}>
            Stock: {mouvement.stockApres}
          </Text>
        </View>
      </View>

      {mouvement.technicien && (
        <Text style={[styles.technicien, tablet && { fontSize: 13 }]}>
          Par {mouvement.technicien.prenom} {mouvement.technicien.nom}
        </Text>
      )}

      {mouvement.commentaire && (
        <Text style={styles.commentaire} numberOfLines={2}>
          {mouvement.commentaire}
        </Text>
      )}

      {mouvement.referenceExterne && (
        <Text style={styles.refExterne}>
          Réf: {mouvement.referenceExterne}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: {
    ...typography.small,
    color: colors.text.secondary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleInfo: {
    flex: 1,
  },
  articleRef: {
    ...typography.small,
    color: colors.text.secondary,
  },
  articleNom: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  quantiteContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  quantite: {
    ...typography.h3,
    fontWeight: '700',
  },
  stockApres: {
    ...typography.small,
    color: colors.text.secondary,
  },
  technicien: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  commentaire: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  refExterne: {
    ...typography.small,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  indicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  compactQuantite: {
    ...typography.bodyBold,
  },
});

export default MouvementCard;
