import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface CAAboutCardProps {
  version:     string;
  authorName:  string;
  authorRole:  string;
  initials:    string;
  copyright:   string;
  onInfoPress: () => void;
}

export const CAAboutCard = ({
  version, authorName, authorRole, initials, copyright, onInfoPress,
}: CAAboutCardProps) => (
  <View style={styles.card}>

    {/* Version */}
    <View style={styles.versionRow}>
      <View>
        <Text style={styles.versionLabel}>VERSION</Text>
        <Text style={styles.versionNum} accessibilityLabel={`Version ${version}`}>
          {version}
        </Text>
      </View>
      <Pressable onPress={onInfoPress} style={styles.infoBtn}
        accessibilityRole="button" accessibilityLabel="Plus d'informations">
        <Icon name="information" size={18} color={CA_THEME.info} />
      </Pressable>
    </View>

    {/* Séparateur */}
    <View style={styles.divider} />

    {/* Auteur */}
    <View style={styles.devRow}>
      <View style={styles.devAvatar} accessibilityLabel={`Avatar ${initials}`}>
        <Text style={styles.devAvatarText}>{initials}</Text>
      </View>
      <View>
        <Text style={styles.devName}>{authorName}</Text>
        <Text style={styles.devRole}>{authorRole}</Text>
      </View>
    </View>

    {/* Copyright */}
    <View style={styles.copyrightRow}>
      <Text style={styles.copyrightText}>{copyright}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: CA_THEME.white,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    padding:         14,
  },
  versionRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  versionLabel: {
    fontSize: 9, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    color: CA_THEME.textMuted, marginBottom: 3,
  },
  versionNum:  { fontSize: 32, fontWeight: '800', color: CA_THEME.green },
  infoBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: CA_THEME.infoBg,
    borderWidth: 1, borderColor: 'rgba(21,101,192,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  divider:  { height: 1, backgroundColor: CA_THEME.borderGray, marginBottom: 12 },
  devRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  devAvatar: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: CA_THEME.green,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  devAvatarText: { fontSize: 13, fontWeight: '700', color: CA_THEME.white },
  devName:  { fontSize: 13, fontWeight: '600', color: CA_THEME.textPrimary },
  devRole:  { fontSize: 11, color: CA_THEME.textMuted, marginTop: 1 },
  copyrightRow: {
    borderTopWidth: 1, borderTopColor: CA_THEME.borderGray,
    paddingTop: 10, alignItems: 'center',
  },
  copyrightText: { fontSize: 11, color: CA_THEME.textMuted },
});
