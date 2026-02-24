import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Vibration,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { isTablet as checkIsTablet } from '../../../utils/responsive';

export type ArticleFilterKey =
  | 'codeFamille'
  | 'famille'
  | 'typeArticle'
  | 'sousType'
  | 'marque'
  | 'emplacement';

interface FilterRowConfig {
  key: ArticleFilterKey;
  label: string;
  icon: string;
  iconColor: string;
}

const ROWS: FilterRowConfig[] = [
  { key: 'codeFamille', label: 'Code famille', icon: 'tag-outline', iconColor: '#6366F1' },
  { key: 'famille', label: 'Famille', icon: 'shape-outline', iconColor: '#8B5CF6' },
  { key: 'typeArticle', label: 'Type', icon: 'format-list-bulleted-type', iconColor: '#06B6D4' },
  { key: 'sousType', label: 'Sous-type', icon: 'tag-text-outline', iconColor: '#F59E0B' },
  { key: 'marque', label: 'Marque', icon: 'domain', iconColor: '#2563EB' },
  { key: 'emplacement', label: 'Emplacement', icon: 'map-marker', iconColor: '#10B981' },
];

interface ArticlesFilterSheetProps {
  visible: boolean;
  filterValues: Partial<Record<ArticleFilterKey, string | null>>;
  onClose: () => void;
  onSelectRow: (key: ArticleFilterKey) => void;
}

const ArticlesFilterSheet: React.FC<ArticlesFilterSheetProps> = ({
  visible,
  filterValues,
  onClose,
  onSelectRow,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  const handleRowPress = (key: ArticleFilterKey) => {
    Vibration.vibrate(10);
    onSelectRow(key);
    onClose();
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
        <View style={[styles.sheet, tablet && { maxWidth: 540, width: '100%' }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Icon name="filter-variant" size={24} color={premiumColors.primary.base} />
            <Text style={styles.title}>Filtrer par</Text>
          </View>
          <Text style={styles.subtitle}>
            Code famille, famille, type, sous-type, marque, emplacement
          </Text>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {ROWS.map((row) => {
              const value = filterValues[row.key];
              const displayValue = value && value.trim() ? value : 'Tous';
              const isSet = !!(value && value.trim());
              return (
                <TouchableOpacity
                  key={row.key}
                  style={[styles.row, isSet && styles.rowActive]}
                  onPress={() => handleRowPress(row.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIcon, { backgroundColor: row.iconColor + '15' }]}>
                    <Icon name={row.icon as any} size={20} color={row.iconColor} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text
                      style={[styles.rowValue, isSet && styles.rowValueSet]}
                      numberOfLines={1}
                    >
                      {displayValue}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={premiumColors.text.tertiary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => { Vibration.vibrate(10); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>Fermer</Text>
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
    backgroundColor: premiumColors.surface,
    borderTopLeftRadius: premiumBorderRadius.xxl,
    borderTopRightRadius: premiumBorderRadius.xxl,
    paddingTop: premiumSpacing.md,
    paddingBottom: premiumSpacing.xxxl,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: premiumColors.border,
    alignSelf: 'center',
    marginBottom: premiumSpacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: premiumSpacing.sm,
    paddingHorizontal: premiumSpacing.xl,
    marginBottom: premiumSpacing.xs,
  },
  title: {
    ...premiumTypography.h3,
    color: premiumColors.text.primary,
  },
  subtitle: {
    ...premiumTypography.small,
    color: premiumColors.text.secondary,
    paddingHorizontal: premiumSpacing.xl,
    marginBottom: premiumSpacing.lg,
  },
  list: {
    paddingHorizontal: premiumSpacing.lg,
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: premiumSpacing.md,
    paddingHorizontal: premiumSpacing.md,
    borderRadius: premiumBorderRadius.md,
    marginBottom: 4,
    gap: premiumSpacing.md,
  },
  rowActive: {
    backgroundColor: premiumColors.primary.base + '08',
    borderWidth: 1,
    borderColor: premiumColors.primary.base + '20',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    ...premiumTypography.small,
    color: premiumColors.text.secondary,
    marginBottom: 2,
  },
  rowValue: {
    ...premiumTypography.body,
    color: premiumColors.text.tertiary,
  },
  rowValueSet: {
    color: premiumColors.primary.base,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: premiumSpacing.lg,
    marginHorizontal: premiumSpacing.xl,
    paddingVertical: premiumSpacing.md,
    alignItems: 'center',
    borderRadius: premiumBorderRadius.md,
    backgroundColor: premiumColors.borderLight,
  },
  closeText: {
    ...premiumTypography.bodyMedium,
    color: premiumColors.text.secondary,
  },
});

export default ArticlesFilterSheet;
