import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME, PC_STATUS_CA } from '@/constants/caTheme';
import { cleanModelName, getPCAsset, getPCDisplayName, getPCHostname, hasPCDisplayName } from '@/utils/pcHelpers';
import { formatPCDate, getPCStateFromArticle } from '@/constants/pcStates';
import { CAPCStatusBadge } from './CAPCStatusBadge';
import type { Article } from '@/types';
import type { PCStatus } from './CAParcPCHeroCard';

interface CAPCCardProps {
  article:     Article;
  onRename:    (article: Article) => void;
  onBreakdown: (article: Article) => void;
  onResolve:   (article: Article) => void;
  onPress?:    () => void;
}

export const CAPCCard = ({
  article,
  onRename,
  onBreakdown,
  onResolve,
  onPress,
}: CAPCCardProps) => {
  const stateMeta = getPCStateFromArticle(article);
  const status = stateMeta.key as PCStatus;
  const conf   = PC_STATUS_CA[status] || PC_STATUS_CA.en_usinage;
  
  const displayName = getPCDisplayName(article);
  const hostname = getPCHostname(article);
  const hasCustomName = hasPCDisplayName(article);
  const model = cleanModelName([article.marque, article.modele].filter(Boolean).join(' '));
  const asset = getPCAsset(article);
  const categoryLabel = article.sousType || article.typeArticle || article.famille || 'PC portable';
  const isSiegePC = categoryLabel.toLowerCase().includes('siege') || categoryLabel.toLowerCase().includes('siège');
  const lastUpdated = formatPCDate(article.dateModification);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderLeftColor: conf.color }]}
      accessibilityRole="button"
      accessibilityLabel={`PC ${displayName}, statut ${conf.label}`}
    >
      {/* Chevron discret */}
      <Icon name="chevron-right" size={14}
        color={CA_THEME.textMuted} style={styles.chevron} />

      {/* ── TOP ROW ── */}
      <View style={styles.topRow}>

        {/* Avatar icône */}
        <View style={[styles.avatar, { backgroundColor: conf.subtle, borderColor: conf.border }]}>
          <Icon
            name={status === 'en_panne' ? 'laptop-off' : 'laptop'}
            size={18} color={conf.color}
          />
        </View>

        {/* Infos PC */}
        <View style={styles.info}>
          <Text style={styles.hostname} numberOfLines={1}>{displayName}</Text>
          {hasCustomName && (
            <Text style={styles.hostnameSecondary} numberOfLines={1}>{hostname}</Text>
          )}
          <Text style={styles.model} numberOfLines={1}>{model}</Text>
        </View>

        {/* Badge statut */}
        <CAPCStatusBadge status={status} />
      </View>

      {/* ── TAGS : asset + catégorie ── */}
      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <Icon name="barcode" size={10} color={CA_THEME.textMuted} />
          <Text style={styles.tagText}>{asset}</Text>
        </View>
        <View style={styles.tag}>
          <Icon
            name={isSiegePC ? 'office-building' : 'store'}
            size={10} color={CA_THEME.textMuted}
          />
          <Text style={styles.tagText}>
            {isSiegePC ? 'Portable siège' : 'Portable agence'}
          </Text>
        </View>
      </View>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <View style={styles.dateRow}>
          <Icon name="clock-outline" size={11} color={CA_THEME.textMuted} />
          <Text style={styles.dateText}>Maj {lastUpdated}</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Bouton Renommer — toujours présent */}
          <Pressable onPress={() => onRename(article)} style={styles.btnRename}
            accessibilityRole="button" accessibilityLabel="Renommer ce PC" hitSlop={6}>
            <Icon name="pencil" size={11} color={CA_THEME.green} />
            <Text style={styles.btnRenameText}>Renommer</Text>
          </Pressable>

          {/* Action principale selon statut */}
          {status !== 'en_panne' ? (
            <Pressable onPress={() => onBreakdown(article)} style={styles.btnPanne}
              accessibilityRole="button" accessibilityLabel="Déclarer en panne" hitSlop={6}>
              <Icon name="alert" size={11} color={CA_THEME.danger} />
              <Text style={styles.btnPanneText}>En panne</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => onResolve(article)} style={styles.btnResolve}
              accessibilityRole="button" accessibilityLabel="Résoudre la panne" hitSlop={6}>
              <Icon name="check-circle" size={11} color={CA_THEME.green} />
              <Text style={styles.btnResolveText}>Résoudre</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    padding:         12,
    marginBottom:    8,
    position:        'relative',
  },
  chevron: { position: 'absolute', top: 12, right: 10 },

  // TOP ROW
  topRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  avatar: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  info:    { flex: 1, minWidth: 0 },
  hostname: {
    fontSize: 14, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700',
    color: CA_THEME.textPrimary,
    marginBottom: 2,
  },
  hostnameSecondary: {
    fontSize: 10, color: CA_THEME.textMuted, fontFamily: CA_THEME.fontFamilyMedium,
  },
  model: { fontSize: 11, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textSecondary },

  // TAGS
  tagsRow: { flexDirection: 'row', gap: 7, marginBottom: 8, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
  },
  tagText: { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '500', color: CA_THEME.textSecondary },

  // FOOTER
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: CA_THEME.borderGray },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:   { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, color: CA_THEME.textMuted },
  actionsRow: { flexDirection: 'row', gap: 6 },

  btnRename: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
  },
  btnRenameText: { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.greenText },

  btnPanne: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    backgroundColor: CA_THEME.dangerBg,
    borderWidth: 1, borderColor: 'rgba(211,47,47,0.25)',
  },
  btnPanneText: { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.dangerText },

  btnResolve: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
  },
  btnResolveText: { fontSize: 10, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.greenText },
});
