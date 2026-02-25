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
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';
import { useTheme } from '@/theme';
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
  const { colors } = useTheme();
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
        <View style={[styles.sheet, { backgroundColor: colors.surface }, tablet && { maxWidth: 540, width: '100%' }]} onStartShouldSetResponder={() => true}>
          <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.titleRow}>
            <Icon name="filter-variant" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Filtrer par</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
                  style={[styles.row, isSet && [styles.rowActive, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]]}
                  onPress={() => handleRowPress(row.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIcon, { backgroundColor: row.iconColor + '15' }]}>
                    <Icon name={row.icon as any} size={20} color={row.iconColor} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                    <Text
                      style={[styles.rowValue, { color: colors.textMuted }, isSet && [styles.rowValueSet, { color: colors.primary }]]}
                      numberOfLines={1}
                    >
                      {displayValue}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.borderSubtle }]}
            onPress={() => { Vibration.vibrate(10); onClose(); }}
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
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
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
  },
  subtitle: {
    ...premiumTypography.small,
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
    borderWidth: 1,
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
    marginBottom: 2,
  },
  rowValue: {
    ...premiumTypography.body,
  },
  rowValueSet: {
    fontWeight: '600',
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

export default ArticlesFilterSheet;
