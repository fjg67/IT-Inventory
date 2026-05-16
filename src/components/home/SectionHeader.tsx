import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { DASHBOARD_TYPOGRAPHY } from '@/constants/typography';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const SectionHeaderComponent: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <View style={styles.accentBar} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {actionLabel && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.8}>
          <Text style={styles.action}>{actionLabel}{' ->'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const SectionHeader = React.memo(SectionHeaderComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  accentBar: {
    backgroundColor: OBSIDIAN_COLORS.green_primary,
    borderRadius: 2,
    height: 14,
    width: 3,
  },
  title: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 11,
    ...DASHBOARD_TYPOGRAPHY.sectionTitle,
  },
  action: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 13,
    ...DASHBOARD_TYPOGRAPHY.label,
  },
});
