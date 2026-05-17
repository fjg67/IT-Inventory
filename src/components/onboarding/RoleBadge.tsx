import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ONBOARDING_COLORS } from './tokens';

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
          bg: ONBOARDING_COLORS.warning_subtle,
          color: ONBOARDING_COLORS.warning,
          icon: 'shield-crown-outline',
          label: 'Admin',
        }
      : resolved === 'viewer'
        ? {
            bg: ONBOARDING_COLORS.info_subtle,
            color: ONBOARDING_COLORS.info,
            icon: 'eye-outline',
            label: 'Viewer',
          }
        : {
            bg: ONBOARDING_COLORS.green_subtle,
            color: ONBOARDING_COLORS.green_light,
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
