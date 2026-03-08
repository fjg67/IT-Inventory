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

// ===== Single-select mode (used for sort) =====
interface SingleSelectProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedValue: string | number | null;
  onSelect: (value: string | number | null) => void;
  onClose: () => void;
  multiSelect?: false;
  selectedValues?: never;
  onSelectMulti?: never;
}

// ===== Multi-select mode (used for filters) =====
interface MultiSelectProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  onClose: () => void;
  multiSelect: true;
  selectedValues: string[];
  onSelectMulti: (values: string[]) => void;
  selectedValue?: never;
  onSelect?: never;
}

type FilterModalProps = SingleSelectProps | MultiSelectProps;

const FilterModal: React.FC<FilterModalProps> = (props) => {
  const {
    visible,
    title,
    options,
    onClose,
    multiSelect,
  } = props;

  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const { colors } = useTheme();

  // Local state for multi-select pending selections
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);

  // Sync local state when modal becomes visible
  React.useEffect(() => {
    if (visible && multiSelect) {
      setPendingSelection(props.selectedValues ?? []);
    }
  }, [visible]);

  const handleSingleSelect = useCallback(
    (value: string | number | null) => {
      Vibration.vibrate(10);
      if (!multiSelect && props.onSelect) {
        props.onSelect(value);
      }
      onClose();
    },
    [multiSelect, props, onClose],
  );

  const handleMultiToggle = useCallback(
    (value: string) => {
      Vibration.vibrate(10);
      setPendingSelection((prev) => {
        if (prev.includes(value)) {
          return prev.filter((v) => v !== value);
        }
        return [...prev, value];
      });
    },
    [],
  );

  const handleSelectAll = useCallback(() => {
    Vibration.vibrate(10);
    setPendingSelection([]);
  }, []);

  const handleValidate = useCallback(() => {
    Vibration.vibrate(10);
    if (multiSelect && props.onSelectMulti) {
      props.onSelectMulti(pendingSelection);
    }
    onClose();
  }, [multiSelect, props, pendingSelection, onClose]);

  const renderOption = ({ item }: { item: FilterOption }) => {
    if (multiSelect) {
      // "Tous" item => select all (clear selection)
      if (item.id === null) {
        const isAllSelected = pendingSelection.length === 0;
        return (
          <TouchableOpacity
            style={[styles.option, isAllSelected && { backgroundColor: colors.primary + '08' }]}
            onPress={handleSelectAll}
            activeOpacity={0.7}
          >
            <Icon
              name={isAllSelected ? 'radiobox-marked' : 'radiobox-blank'}
              size={22}
              color={isAllSelected ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.optionLabel,
                { color: colors.textPrimary },
                isAllSelected && { color: colors.primary, fontWeight: '600' },
              ]}
            >
              {item.label}
            </Text>
            {isAllSelected && (
              <Icon name="check" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        );
      }
      const isSelected = pendingSelection.includes(item.id as string);
      return (
        <TouchableOpacity
          style={[styles.option, isSelected && { backgroundColor: colors.primary + '08' }]}
          onPress={() => handleMultiToggle(item.id as string)}
          activeOpacity={0.7}
        >
          <Icon
            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
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
    }

    // Single-select mode (radio)
    const isSelected = item.id === (props as SingleSelectProps).selectedValue;
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && { backgroundColor: colors.primary + '08' }]}
        onPress={() => handleSingleSelect(item.id)}
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

          {/* Selection count for multi-select */}
          {multiSelect && pendingSelection.length > 0 && (
            <Text style={[styles.selectionCount, { color: colors.primary }]}>
              {pendingSelection.length} sélectionné{pendingSelection.length > 1 ? 's' : ''}
            </Text>
          )}

          {/* Options list */}
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.id ?? 'all')}
            renderItem={renderOption}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />

          {/* Bouton valider / fermer */}
          {multiSelect ? (
            <TouchableOpacity
              style={[styles.validateButton, { backgroundColor: colors.primary }]}
              onPress={handleValidate}
              activeOpacity={0.7}
            >
              <Text style={[styles.validateText, { color: '#FFFFFF' }]}>Valider</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.borderSubtle }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>Fermer</Text>
            </TouchableOpacity>
          )}
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
  validateButton: {
    marginTop: premiumSpacing.lg,
    marginHorizontal: premiumSpacing.xl,
    paddingVertical: premiumSpacing.md,
    alignItems: 'center',
    borderRadius: premiumBorderRadius.md,
  },
  validateText: {
    ...premiumTypography.bodyMedium,
    fontWeight: '600',
  },
  selectionCount: {
    ...premiumTypography.small,
    fontWeight: '600',
    paddingHorizontal: premiumSpacing.xl,
    marginBottom: premiumSpacing.sm,
  },
});

export default FilterModal;
