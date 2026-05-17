import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Mouvement } from '@/types';
import { ADC } from './articleDetailColors';
import { formatTimeParis, formatRelativeDateParis } from '@/utils/dateUtils';

const TYPE_CFG: Record<string, { icon: string; color: string; label: string; prefix: string }> = {
  entree:            { icon: 'arrow-up-bold',    color: ADC.green_light, label: 'Entrée',        prefix: '+' },
  sortie:            { icon: 'arrow-down-bold',  color: ADC.danger,      label: 'Sortie',         prefix: '-' },
  ajustement:        { icon: 'tune-vertical',    color: ADC.warning,     label: 'Ajustement',     prefix: '' },
  transfert_depart:  { icon: 'arrow-right-bold', color: ADC.purple,      label: 'Transfert ↗',   prefix: '-' },
  transfert_arrivee: { icon: 'arrow-left-bold',  color: ADC.purple,      label: 'Transfert ↙',   prefix: '+' },
};

interface HistoryCardProps {
  movement: Mouvement;
}

export const HistoryCard: React.FC<HistoryCardProps> = React.memo(({ movement: m }) => {
  const cfg = TYPE_CFG[m.type] ?? TYPE_CFG.entree;
  const badgeBg = cfg.color + '1A';

  return (
    <View style={[styles.card, { borderLeftColor: cfg.color }]}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Icon name={cfg.icon} size={10} color={cfg.color} />
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={styles.time}>{formatTimeParis(new Date(m.dateMouvement))}</Text>
      </View>
      <Text style={[styles.delta, { color: cfg.color }]}>
        {cfg.prefix}{Math.abs(m.quantite)} unité{Math.abs(m.quantite) > 1 ? 's' : ''}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.date}>{formatRelativeDateParis(new Date(m.dateMouvement))}</Text>
        {m.technicien && (
          <>
            <Text style={styles.sep}>·</Text>
            <Text style={styles.operator}>
              {m.technicien.prenom} {m.technicien.nom?.charAt(0)}.
            </Text>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADC.bg_card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    borderLeftWidth: 3,
    padding: 12,
    paddingLeft: 14,
    gap: 4,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: ADC.text_muted,
  },
  delta: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
    color: ADC.text_dim,
  },
  sep: {
    fontSize: 11,
    color: ADC.text_dim,
  },
  operator: {
    fontSize: 11,
    fontWeight: '500',
    color: ADC.text_secondary,
  },
});
