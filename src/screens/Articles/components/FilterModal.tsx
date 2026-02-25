import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  premiumTypography,
  premiumShadows,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

export interface FilterOption {
  id: string | number | null;
  label: string;
}

interface FilterModalProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedValue: string | number | null;
  onSelect: (value: string | number | null) => void;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors } = useTheme();

  const handleSelect = useCallback(
    (value: string | number | null) => {
      Vibration.vibrate(10);
      onSelect(value);
      onClose();
    },
    [onSelect, onClose],
  );

  const renderOption = ({ item }: { item: FilterOption }) => {
    const isSelected = item.id === selectedValue;
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && { backgroundColor: colors.primary + '08' }]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        <Icon
          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
          size={22}
          color={isSelected ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.optionLabel,
            { color: colors.textPrimary },
            isSelected && { color: colors.primary, fontWeight: '600' },
          ]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <Icon name="check" size={18} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, tablet && { alignItems: 'center' as const }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface }, tablet && { maxWidth: 540, width: '100%' }]} onStartShouldSetResponder={() => true}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

          {/* Options list */}
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.id ?? 'all')}
            renderItem={renderOption}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />

          {/* Bouton fermer */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.borderSubtle }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: premiumBorderRadius.xxl,
    borderTopRightRadius: premiumBorderRadius.xxl,
    paddingTop: premiumSpacing.md,
    paddingBottom: premiumSpacing.xxxl,
    maxHeight: '60%',
    ...premiumShadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: premiumSpacing.lg,
  },
  title: {
    ...premiumTypography.h3,
    paddingHorizontal: premiumSpacing.xl,
    marginBottom: premiumSpacing.lg,
  },
  list: {
    paddingHorizontal: premiumSpacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.md,
    borderRadius: premiumBorderRadius.md,
    gap: premiumSpacing.md,
  },
  optionLabel: {
    ...premiumTypography.body,
    flex: 1,
  },
  closeButton: {
    marginTop: premiumSpacing.lg,
    marginHorizontal: premiumSpacing.xl,
    paddingVertical: premiumSpacing.md,
    alignItems: 'center',
    borderRadius: premiumBorderRadius.md,
  },
  closeText: {
    ...premiumTypography.bodyMedium,
  },
});

export default FilterModal;
