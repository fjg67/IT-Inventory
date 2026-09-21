import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

export const CAMovementItem = ({ movement }: { movement: any }) => {
  const typeConfig: Record<string, any> = {
    entree:      { color: CA_THEME.green,   label: 'Entrée',     icon: 'arrow-down-circle' },
    sortie:      { color: CA_THEME.danger,  label: 'Sortie',     icon: 'arrow-up-circle'   },
    ajustement:  { color: CA_THEME.warning, label: 'Ajustement', icon: 'tune-vertical'       },
    transfert:   { color: CA_THEME.purple,  label: 'Transfert',  icon: 'swap-horizontal' },
  };
  const conf = typeConfig[movement.type] || typeConfig.entree;

  const formatRelativeDate = (dateString: string | Date) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.item, { borderLeftColor: conf.color }]}>
      <View style={[styles.dot, { backgroundColor: conf.color }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{movement.articleLabel || movement.articleNom}</Text>
        <Text style={styles.sub}>{movement.site || movement.siteNom} · {formatRelativeDate(movement.createdAt)}</Text>
      </View>
      <View style={[styles.tag, { backgroundColor: `${conf.color}15` }]}>
        <Text style={[styles.tagText, { color: conf.color }]}>{conf.label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: CA_THEME.white,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    marginBottom:    8,
  },
  dot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.textPrimary },
  sub:  { fontSize: 11, color: CA_THEME.textSecondary, marginTop: 2 },
  tag:  { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
