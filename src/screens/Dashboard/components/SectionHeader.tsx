import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import {
  premiumSpacing,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  accentColor?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
  accentColor,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors, isDark } = useTheme();

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onActionPress?.();
  }, [onActionPress]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={[styles.accentBar, { backgroundColor: accentColor || colors.primary }]} />
        <Text style={[styles.title, { color: colors.textPrimary }, tablet && { fontSize: 20 }]}>{title}</Text>
      </View>
      {actionLabel && onActionPress && (
        <TouchableOpacity
          onPress={handlePress}
          style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionLabel, { color: colors.primary }, tablet && { fontSize: 14 }]}>{actionLabel}</Text>
          <Icon
            name="chevron-right"
            size={tablet ? 18 : 15}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});

export default SectionHeader;
