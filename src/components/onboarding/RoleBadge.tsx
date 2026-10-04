import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

type RoleKind = 'technicien' | 'admin' | 'viewer';

type RoleBadgeProps = {
  role: string;
};

const resolveRole = (role: string): RoleKind => {
  const normalized = role.toLowerCase();
  if (normalized.includes('admin') || normalized.includes('superviseur')) return 'admin';
  if (normalized.includes('view')) return 'viewer';
  return 'technicien';
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const resolved = resolveRole(role);

  const ui =
    resolved === 'admin'
      ? {
          bg: CA_THEME.warningBg,
          color: CA_THEME.warningText,
          icon: 'shield-crown-outline',
          label: 'Admin',
        }
      : resolved === 'viewer'
        ? {
            bg: CA_THEME.infoBg,
            color: CA_THEME.infoText,
            icon: 'eye-outline',
            label: 'Viewer',
          }
        : {
            bg: CA_THEME.greenBg,
            color: CA_THEME.greenText,
            icon: 'wrench-outline',
            label: 'Technicien',
          };

  return (
    <View style={[styles.wrap, { backgroundColor: ui.bg }]}>
      <Icon name={ui.icon} size={11} color={ui.color} />
      <Text style={[styles.text, { color: ui.color }]}>{ui.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 22,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
