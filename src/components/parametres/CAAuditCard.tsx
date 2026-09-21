import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export type AuditLevel = 'ok' | 'warning' | 'critique';

interface CAAuditCardProps {
  daysSince:    number | string;
  lastDate:     string;
  level:        AuditLevel;
  site:         string;
  onExplore:    () => void;
  onRelaunch:   () => void;
}

const AUDIT_LEVEL_CONFIG = {
  ok: {
    leftBorder:  CA_THEME.green,
    numColor:    CA_THEME.green,
    badgeBg:     CA_THEME.greenBg,
    badgeBorder: CA_THEME.greenBg2,
    badgeColor:  CA_THEME.greenText,
    badgeLabel:  'Conforme',
    conformBg:   CA_THEME.greenBg,
    conformBorder:'rgba(27,138,62,0.18)',
    conformText: CA_THEME.green,
  },
  warning: {
    leftBorder:  CA_THEME.warning,
    numColor:    CA_THEME.warning,
    badgeBg:     CA_THEME.warningBg,
    badgeBorder: 'rgba(230,81,0,0.25)',
    badgeColor:  CA_THEME.warningText,
    badgeLabel:  'À surveiller',
    conformBg:   CA_THEME.warningBg,
    conformBorder:'rgba(230,81,0,0.18)',
    conformText: CA_THEME.warning,
  },
  critique: {
    leftBorder:  CA_THEME.danger,
    numColor:    CA_THEME.danger,
    badgeBg:     CA_THEME.dangerBg,
    badgeBorder: 'rgba(211,47,47,0.25)',
    badgeColor:  CA_THEME.dangerText,
    badgeLabel:  'Critique',
    conformBg:   CA_THEME.dangerBg,
    conformBorder:'rgba(211,47,47,0.18)',
    conformText: CA_THEME.danger,
  },
};

export const CAAuditCard = ({
  daysSince, lastDate, level, site,
  onExplore, onRelaunch,
}: CAAuditCardProps) => {
  const conf = AUDIT_LEVEL_CONFIG[level];

  return (
    <View style={[styles.card, { borderLeftColor: conf.leftBorder }]}>

      {/* En-tête : label + badge niveau */}
      <View style={styles.headerRow}>
        <View style={styles.eyebrow}>
          <Icon name="shield-check" size={12} color={CA_THEME.textMuted} />
          <Text style={styles.eyebrowText}>Audit inventaire</Text>
        </View>
        <View style={[styles.levelBadge, {
          backgroundColor: conf.badgeBg,
          borderColor:     conf.badgeBorder,
        }]}>
          <Icon name="circle" size={7} color={conf.conformText} />
          <Text style={[styles.levelText, { color: conf.badgeColor }]}>
            {conf.badgeLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>Pulse du stock</Text>

      {/* Grand nombre de jours */}
      <Text style={[styles.bigNum, { color: conf.numColor }]}
        accessibilityLabel={`${daysSince} jours depuis le dernier contrôle`}>
        {daysSince} {typeof daysSince === 'number' || (typeof daysSince === 'string' && daysSince !== '--') ? 'j' : ''}
      </Text>
      <Text style={styles.bigNumSub}>depuis le dernier contrôle</Text>

      {/* Site actuel */}
      <View style={styles.sitePill}>
        <Icon name="map-marker" size={11} color={CA_THEME.textMuted} />
        <Text style={styles.sitePillText}>{site}</Text>
      </View>

      {/* Mini grid infos */}
      <View style={styles.miniGrid}>
        <View style={styles.miniCard}>
          <Icon name="calendar" size={14} color={CA_THEME.info} />
          <Text style={styles.miniLabel}>Dernier inventaire</Text>
          <Text style={styles.miniValue}>{lastDate}</Text>
        </View>
        <View style={styles.miniCard}>
          <Icon name="timer-sand" size={14} color={CA_THEME.info} />
          <Text style={styles.miniLabel}>Jours écoulés</Text>
          <Text style={styles.miniValue}>{daysSince}{typeof daysSince === 'number' || (typeof daysSince === 'string' && daysSince !== '--') ? 'j' : ''}</Text>
        </View>
      </View>

      {/* Niveau de conformité */}
      <View style={[styles.conformRow, {
        backgroundColor: conf.conformBg,
        borderColor:     conf.conformBorder,
      }]}>
        <View style={styles.conformLeft}>
          <Icon name="target" size={13} color={CA_THEME.textMuted} />
          <Text style={styles.conformLabel}>Niveau de conformité</Text>
        </View>
        <Text style={[styles.conformValue, { color: conf.conformText }]}>
          {conf.badgeLabel}
        </Text>
      </View>

      {/* Boutons d'action */}
      <View style={styles.buttonsRow}>
        <Pressable onPress={onExplore} style={styles.btnSecondary}
          accessibilityRole="button" accessibilityLabel="Explorer l'audit">
          <Icon name="chart-bar" size={14} color={CA_THEME.green} />
          <Text style={styles.btnSecondaryText}>Explorer</Text>
        </Pressable>
        <Pressable onPress={onRelaunch} style={styles.btnPrimary}
          accessibilityRole="button" accessibilityLabel="Relancer le contrôle">
          <Icon name="refresh" size={14} color={CA_THEME.white} />
          <Text style={styles.btnPrimaryText}>Relancer le contrôle</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    padding:         14,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eyebrowText: {
    fontSize: 9, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.0,
    color: CA_THEME.textMuted,
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  levelText: { fontSize: 10, fontWeight: '700' },
  title:     { fontSize: 16, fontWeight: '700', color: CA_THEME.textPrimary, marginBottom: 10 },
  bigNum: {
    fontSize: 44, fontWeight: '800',
    textAlign: 'center', lineHeight: 48, marginBottom: 4,
  },
  bigNumSub: { fontSize: 12, color: CA_THEME.textMuted, textAlign: 'center', marginBottom: 10 },
  sitePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignSelf: 'center', marginBottom: 12,
  },
  sitePillText: { fontSize: 11, color: CA_THEME.textSecondary },
  miniGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  miniCard: {
    flex: 1,
    backgroundColor: CA_THEME.lightGray,
    borderRadius: 8, borderWidth: 1, borderColor: CA_THEME.borderGray,
    padding: 10, gap: 3,
  },
  miniLabel: { fontSize: 9, color: CA_THEME.textMuted, marginTop: 3 },
  miniValue: { fontSize: 13, fontWeight: '700', color: CA_THEME.textPrimary },
  conformRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9, borderRadius: 8, borderWidth: 1,
    marginBottom: 12,
  },
  conformLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  conformLabel: { fontSize: 12, color: CA_THEME.textSecondary },
  conformValue: { fontSize: 12, fontWeight: '700' },
  buttonsRow: { flexDirection: 'row', gap: 8 },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1.5, borderColor: CA_THEME.borderGray,
  },
  btnSecondaryText: { fontSize: 12, fontWeight: '600', color: CA_THEME.green },
  btnPrimary: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
    backgroundColor: CA_THEME.green,
  },
  btnPrimaryText: { fontSize: 12, fontWeight: '700', color: CA_THEME.white },
});
