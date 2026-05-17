// ============================================
// DropdownBottomSheet — Dark Premium Modal
// IT-Inventory Application
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  TextInput, StyleSheet, Dimensions, Animated as RNAnimated,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

const { height: SCREEN_H } = Dimensions.get('window');

export interface DropdownItem {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  badge?: string; // numeric badge (e.g. code famille)
}

interface Props {
  visible: boolean;
  title: string;
  items: DropdownItem[];
  selectedValue: string | null;
  onSelect: (item: DropdownItem) => void;
  onClose: () => void;
  nullable?: boolean;
  nullLabel?: string;
  accentColor?: string;
}

export const DropdownBottomSheet: React.FC<Props> = ({
  visible,
  title,
  items,
  selectedValue,
  onSelect,
  onClose,
  nullable,
  nullLabel = 'Aucun',
  accentColor = CAC.green_light,
}) => {
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new RNAnimated.Value(SCREEN_H)).current;
  const overlayAnim = useRef(new RNAnimated.Value(0)).current;
  const showSearch = items.length > 6;

  useEffect(() => {
    if (visible) {
      setSearch('');
      RNAnimated.parallel([
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(overlayAnim, {
          toValue: 0.7,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      RNAnimated.parallel([
        RNAnimated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 220,
          useNativeDriver: true,
        }),
        RNAnimated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const filtered = search.trim()
    ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    onClose();
  };

  const handleClear = () => {
    onSelect({ value: '', label: '' });
    onClose();
  };

  const renderItem = ({ item }: { item: DropdownItem }) => {
    const isActive = selectedValue === item.value;
    return (
      <TouchableOpacity
        style={[styles.optionRow, isActive && styles.optionRowActive]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        {item.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : item.icon ? (
          <Icon name={item.icon} size={18} color={item.color ?? CAC.text_secondary} />
        ) : null}
        <Text style={[styles.optionLabel, isActive && { color: accentColor, fontWeight: '600' }]}>
          {item.label}
        </Text>
        {isActive && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Icon name="check" size={16} color={accentColor} />
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableWithoutFeedback onPress={onClose}>
        <RNAnimated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      <RNAnimated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="close" size={20} color={CAC.text_muted} />
          </TouchableOpacity>
        </View>
        <View style={styles.sep} />

        {/* Search */}
        {showSearch && (
          <View style={styles.searchBox}>
            <Icon name="magnify" size={18} color={CAC.text_muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={CAC.text_dim}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={16} color={CAC.text_muted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Null option */}
        {nullable && (
          <TouchableOpacity style={styles.optionRow} onPress={handleClear} activeOpacity={0.7}>
            <Icon name="close-circle-outline" size={18} color={CAC.text_muted} />
            <Text style={[styles.optionLabel, styles.optionNullLabel]}>{nullLabel}</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={filtered}
          keyExtractor={item => item.value}
          renderItem={renderItem}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Aucun résultat</Text>
            </View>
          }
        />
      </RNAnimated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.72,
    backgroundColor: CAC.bg_card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: CAC.border_card,
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: CAC.text_primary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CAC.bg_card_elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: 1, backgroundColor: CAC.border_subtle, marginHorizontal: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 12,
    margin: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: CAC.text_primary, paddingVertical: 0 },
  list: { flex: 1 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  optionRowActive: { backgroundColor: 'rgba(34, 197, 94, 0.08)' },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: CAC.text_primary },
  optionNullLabel: { color: CAC.text_muted, fontStyle: 'italic' },
  badge: {
    backgroundColor: CAC.bg_card_elevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: CAC.text_secondary },
  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: CAC.text_muted },
});
