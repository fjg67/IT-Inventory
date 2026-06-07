import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SETTINGS_COLORS } from '@/constants/settingsColors';
import { ProfileStatsRow } from './ProfileStatsRow';

interface ProfileCardProps {
  initials: string;
  fullName: string;
  roleLabel: string;
  roleIcon: string;
  roleColor: string;
  roleBg: string;
  siteName: string;
  sessionCount: string;
  connectionLabel: string;
  movementCount: string;
  onMenuPress: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  initials,
  fullName,
  roleLabel,
  roleIcon,
  roleColor,
  roleBg,
  siteName,
  sessionCount,
  connectionLabel,
  movementCount,
  onMenuPress,
}) => (
  <View style={styles.card}>
    <View style={styles.glow} />

    <View style={styles.topRow}>
      <View style={styles.leftWrap}>
        <View style={styles.avatarRing}>
          <LinearGradient colors={[SETTINGS_COLORS.green_primary, '#0F5228']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>{fullName}</Text>

          <View style={[styles.roleBadge, { backgroundColor: roleBg }]}> 
            <Icon name={roleIcon} size={12} color={roleColor} />
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>

          <View style={styles.siteRow}>
            <Icon name="map-marker-outline" size={12} color={SETTINGS_COLORS.text_muted} />
            <Text style={styles.siteText} numberOfLines={1}>{siteName}</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.menuBtn} onPress={onMenuPress}>
        <Icon name="dots-horizontal" size={18} color={SETTINGS_COLORS.text_secondary} />
      </Pressable>
    </View>

    <View style={styles.divider} />

    <ProfileStatsRow
      sessionCount={sessionCount}
      connectionLabel={connectionLabel}
      movementCount={movementCount}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: SETTINGS_COLORS.bg_card_elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_card,
    padding: 20,
    marginBottom: 16,
  },
  glow: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: SETTINGS_COLORS.green_glow,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftWrap: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: SETTINGS_COLORS.green_light,
    borderRadius: 20,
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: SETTINGS_COLORS.bg_card_elevated,
    backgroundColor: SETTINGS_COLORS.green_light,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingTop: 2,
  },
  name: {
    color: SETTINGS_COLORS.text_primary,
    fontSize: 16,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteText: {
    color: SETTINGS_COLORS.text_secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border_subtle,
    backgroundColor: SETTINGS_COLORS.bg_card,
  },
  divider: {
    marginVertical: 14,
    height: 1,
    backgroundColor: SETTINGS_COLORS.border_subtle,
  },
});
