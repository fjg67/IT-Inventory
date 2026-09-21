import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CAProfileCardProps {
  user: {
    initials:     string;
    fullName:     string;
    role:         string;
    site:         string;
    sessionCount: number | string;
    lastLogin:    string;
    movementsCount: number | string;
  };
  onMenuPress: () => void;
}

export const CAProfileCard = ({ user, onMenuPress }: CAProfileCardProps) => (
  <View style={styles.card}>

    {/* Ligne principale profil */}
    <View style={styles.topRow}>
      {/* Avatar circulaire CA */}
      <View style={styles.avatar} accessibilityLabel={`Avatar ${user.initials}`}>
        <Text style={styles.avatarText}>{user.initials}</Text>
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <Text style={styles.name}>{user.fullName}</Text>
        <View style={styles.roleBadge} accessibilityLabel={`Rôle : ${user.role}`}>
          <Icon name="wrench" size={11} color={CA_THEME.green} />
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
        <View style={styles.siteRow}>
          <Icon name="map-marker" size={12} color={CA_THEME.textMuted} />
          <Text style={styles.siteText}>{user.site}</Text>
        </View>
      </View>

      {/* Menu options */}
      <Pressable onPress={onMenuPress} style={styles.menuBtn}
        accessibilityRole="button" accessibilityLabel="Options du profil" hitSlop={8}>
        <Icon name="dots-vertical" size={18} color={CA_THEME.textMuted} />
      </Pressable>
    </View>

    {/* Séparateur */}
    <View style={styles.divider} />

    {/* Stats 3 colonnes */}
    <View style={styles.statsRow} accessibilityLabel="Statistiques du compte">
      <View style={styles.statCol}>
        <Text style={styles.statNum}>{user.sessionCount}</Text>
        <Text style={styles.statLabel}>Session</Text>
      </View>
      <View style={[styles.statCol, styles.statColCenter]}>
        <Text style={styles.statVal} numberOfLines={1}>{user.lastLogin}</Text>
        <Text style={styles.statLabel}>Connexion</Text>
      </View>
      <View style={styles.statCol}>
        <Text style={styles.statNum}>{user.movementsCount}</Text>
        <Text style={styles.statLabel}>Mouvements</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    borderLeftWidth: 4,
    borderLeftColor: CA_THEME.green,
    padding:         14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: CA_THEME.green,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: CA_THEME.white },
  info:  { flex: 1, minWidth: 0 },
  name:  { fontSize: 16, fontWeight: '700', color: CA_THEME.textPrimary, marginBottom: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    backgroundColor: CA_THEME.greenBg,
    borderWidth: 1, borderColor: CA_THEME.greenBg2,
    alignSelf: 'flex-start', marginBottom: 4,
  },
  roleText: { fontSize: 11, fontWeight: '600', color: CA_THEME.greenText },
  siteRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  siteText: { fontSize: 11, color: CA_THEME.textSecondary },
  menuBtn:  {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  divider:  { height: 1, backgroundColor: CA_THEME.borderGray, marginBottom: 12 },
  statsRow: { flexDirection: 'row' },
  statCol:  { flex: 1, alignItems: 'center' },
  statColCenter: {
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: CA_THEME.borderGray,
    paddingHorizontal: 8,
  },
  statNum:   { fontSize: 18, fontWeight: '700', color: CA_THEME.green, marginBottom: 2 },
  statVal:   { fontSize: 12, fontWeight: '600', color: CA_THEME.textPrimary, marginBottom: 2 },
  statLabel: {
    fontSize: 8, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: CA_THEME.textMuted,
  },
});
