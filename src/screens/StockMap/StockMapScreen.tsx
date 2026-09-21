import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown, FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';
import { CAScreenWrapper } from '@/components/dashboard/CAScreenWrapper';
import { useAppSelector } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository } from '@/database';

// Configuration
type CabinetItem = {
  id: string;
  label: string;
  icon: string;
  refLabel: string;
  isBin?: 'red' | 'blue' | 'none'; 
};

type CabinetLevel = {
  level: number;
  items: CabinetItem[];
};

const ARMOIRE_GAUCHE: CabinetLevel[] = [
  { level: 5, items: [{ id: '1000023', label: 'Sacoches', icon: 'briefcase-outline', refLabel: '1000023' }] },
  { level: 4, items: [{ id: 'INCIDENT PC', label: 'Parc PCs', icon: 'laptop', refLabel: 'INCIDENT PC' }] },
  { level: 3, items: [{ id: 'SCAN_CHEQUE', label: 'Scanners chèques', icon: 'scanner', refLabel: 'N/A' }] },
  {
    level: 2,
    items: [
      { id: '1000004', label: 'Claviers F', icon: 'keyboard-outline', refLabel: '1000004', isBin: 'red' },
      { id: '1000003', label: 'Souris Cherry', icon: 'mouse', refLabel: '1000003', isBin: 'red' },
      { id: '1000031', label: 'Souris Filaire', icon: 'mouse-variant', refLabel: '1000031', isBin: 'blue' },
    ]
  },
  { level: 1, items: [{ id: 'DIVERS_G', label: 'Divers', icon: 'package-variant', refLabel: 'Vrac', isBin: 'blue' }] }
];

const ARMOIRE_DROITE: CabinetLevel[] = [
  {
    level: 5,
    items: [
      { id: '1600001', label: 'Scanners doc', icon: 'scanner', refLabel: '1600001' },
      { id: '1000010', label: 'Filtres 16"', icon: 'monitor-eye', refLabel: '1000010' }
    ]
  },
  {
    level: 4,
    items: [
      { id: 'INCIDENT PC_D', label: 'Parc PCs', icon: 'laptop', refLabel: 'INCIDENT PC' },
      { id: 'MINI UC', label: 'MINI UC', icon: 'desktop-tower', refLabel: 'MINI UC' },
    ]
  },
  {
    level: 3,
    items: [
      { id: '1100001', label: 'Casque V1', icon: 'headphones', refLabel: '1100001', isBin: 'red' },
      { id: '1100002', label: 'Casque V2', icon: 'headphones', refLabel: '1100002', isBin: 'red' },
      { id: '1100006', label: 'Base Casque V2', icon: 'dock-bottom', refLabel: '1100006', isBin: 'red' },
    ]
  },
  {
    level: 2,
    items: [
      { id: '1250006', label: 'Câble U-A', icon: 'usb', refLabel: '1250006', isBin: 'blue' },
      { id: '1250007', label: 'Câble U-C', icon: 'cable-data', refLabel: '1250007', isBin: 'blue' },
      { id: '1000007', label: 'Hub USB-C', icon: 'usb-port', refLabel: '1000007', isBin: 'blue' },
    ]
  },
  { level: 1, items: [{ id: 'DIVERS_D', label: 'Cartons Divers', icon: 'package-variant', refLabel: 'Vrac', isBin: 'none' }] }
];

const ITEM_COLORS = {
  primary: '#007D70',
  secondary: '#99D6D1',
  ok: '#007D70',
  warning: '#F59E0B',
  critical: '#D32F2F',
  bgGray: '#F4F4F4',
};

const getStatusColor = (qty: number) => {
  if (qty === 0) return ITEM_COLORS.critical;
  if (qty < 5) return ITEM_COLORS.warning;
  return ITEM_COLORS.ok;
};

// Composant Item Tile
const ItemTile = ({ item, qty, isHighlighted, index }: { item: CabinetItem; qty: number; isHighlighted: boolean; index: number }) => {
  const statusColor = getStatusColor(qty);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (isHighlighted) {
      progress.value = withRepeat(
        withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 600 })),
        -1,
        true
      );
    } else {
      progress.value = 0;
    }
  }, [isHighlighted, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isHighlighted ? 1 + (progress.value * 0.04) : 1 }],
    borderColor: isHighlighted ? `rgba(245, 158, 11, ${0.4 + progress.value * 0.6})` : CA_THEME.borderGray,
    borderWidth: isHighlighted ? 2 : 1,
    shadowOpacity: isHighlighted ? 0.3 + (progress.value * 0.5) : 0.05,
    shadowColor: isHighlighted ? CA_THEME.warning : '#000',
    shadowRadius: isHighlighted ? 10 : 3,
    elevation: isHighlighted ? 8 : 2,
    zIndex: isHighlighted ? 100 : 1,
  }));

  // Couleur du type de bac
  let iconColor = CA_THEME.textPrimary;
  if (item.isBin === 'red') iconColor = CA_THEME.danger;
  else if (item.isBin === 'blue') iconColor = CA_THEME.info;
  else iconColor = CA_THEME.green;

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.tile, animatedStyle]}
    >
      <View style={styles.tileHeader}>
        <Icon name={item.icon} size={24} color={iconColor} />
        <View style={[styles.qtyBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.qtyBadgeText}>{qty}</Text>
        </View>
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileLabel} numberOfLines={2}>{item.label}</Text>
        <Text style={styles.tileRef} numberOfLines={1}>{item.refLabel}</Text>
      </View>
      {isHighlighted && <View style={[StyleSheet.absoluteFillObject, styles.highlightGlow]} pointerEvents="none" />}
    </Animated.View>
  );
};

export const StockMapScreen = () => {
  const route = useRoute<any>();
  const highlightBarcode = route.params?.highlightBarcode;
  
  const effectiveSiteId = useAppSelector(selectEffectiveSiteId);
  const [stockByRef, setStockByRef] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'gauche' | 'droite'>('gauche');

  const loadStock = useCallback(async () => {
    if (!effectiveSiteId) return;
    try {
      const result = await articleRepository.findAll(effectiveSiteId, 0, 2000);
      const counts: Record<string, number> = {};
      result.data.forEach(art => {
        const ref = art.reference;
        if (ref) counts[ref] = (counts[ref] || 0) + (art.quantiteActuelle || 0);
      });
      setStockByRef(counts);
    } catch (error) {
      console.error('Erreur chargement stock plan:', error);
    }
  }, [effectiveSiteId]);

  useFocusEffect(
    useCallback(() => {
      loadStock();
    }, [loadStock])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStock();
    setRefreshing(false);
  };

  const activeCabinet = activeTab === 'gauche' ? ARMOIRE_GAUCHE : ARMOIRE_DROITE;

  // Si on highlight un objet, on bascule sur la bonne armoire automatiquement
  React.useEffect(() => {
    if (highlightBarcode) {
      const inLeft = ARMOIRE_GAUCHE.some(lvl => lvl.items.some(i => i.id === highlightBarcode));
      const inRight = ARMOIRE_DROITE.some(lvl => lvl.items.some(i => i.id === highlightBarcode));
      if (inRight && !inLeft) setActiveTab('droite');
      if (inLeft && !inRight) setActiveTab('gauche');
    }
  }, [highlightBarcode]);

  return (
    <CAScreenWrapper>
      {/* Header Premium CA */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSquare}>
            <Text style={styles.logoCA}>CA</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Cartographie du Stock 1er</Text>
            <Text style={styles.headerSubtitle}>Visualisation des étagères et emplacements</Text>
          </View>
        </View>
      </View>

      {/* Sélecteur d'Armoire */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'gauche' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('gauche')}
          activeOpacity={0.7}
        >
          <Icon name="wardrobe" size={20} color={activeTab === 'gauche' ? CA_THEME.white : CA_THEME.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'gauche' && styles.tabTextActive]}>Armoire Gauche</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'droite' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('droite')}
          activeOpacity={0.7}
        >
          <Icon name="wardrobe" size={20} color={activeTab === 'droite' ? CA_THEME.white : CA_THEME.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'droite' && styles.tabTextActive]}>Armoire Droite</Text>
        </TouchableOpacity>
      </View>

      {/* Légende discrète */}
      <View style={styles.legendBar}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ITEM_COLORS.ok }]} />
          <Text style={styles.legendLabel}>Stock Correct</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ITEM_COLORS.warning }]} />
          <Text style={styles.legendLabel}>Stock Bas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ITEM_COLORS.critical }]} />
          <Text style={styles.legendLabel}>Rupture</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.cabinetContainer}>
          {activeCabinet.map((levelObj, i) => (
            <View key={levelObj.level} style={styles.shelfLevelWrapper}>
              {/* Le fond du rayonnage */}
              <View style={styles.shelfBackdrop}>
                <View style={styles.shelfTilesRow}>
                  {levelObj.items.map((item, idx) => (
                    <ItemTile 
                      key={item.id} 
                      item={item} 
                      qty={item.id.includes('INCIDENT PC') ? stockByRef['INCIDENT PC'] || 0 : (stockByRef[item.id] || 0)} 
                      isHighlighted={highlightBarcode === item.id} 
                      index={idx}
                    />
                  ))}
                  {/* Ajouter des emplacements vides pour combler si on a moins de 3 objets */}
                  {Array.from({ length: Math.max(0, 3 - levelObj.items.length) }).map((_, emptyIdx) => (
                    <View key={`empty-${emptyIdx}`} style={styles.emptyTile}>
                      <Icon name="plus-box-outline" size={24} color={CA_THEME.borderGray} />
                    </View>
                  ))}
                </View>
              </View>
              {/* L'épaisseur de l'étagère */}
              <View style={styles.shelfPlank} />
              <View style={styles.shelfPlankShadow} />
            </View>
          ))}
        </Animated.View>
        <View style={styles.floorPadding} />
      </ScrollView>
    </CAScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: CA_THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: CA_THEME.borderGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoSquare: {
    width: 40,
    height: 40,
    backgroundColor: ITEM_COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCA: {
    color: CA_THEME.white,
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: CA_THEME.fontFamilyBold,
    color: CA_THEME.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: CA_THEME.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: CA_THEME.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: CA_THEME.borderGray,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: CA_THEME.lightGray,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: ITEM_COLORS.primary,
  },
  tabText: {
    fontFamily: CA_THEME.fontFamilySemiBold,
    color: CA_THEME.textSecondary,
    fontSize: 14,
  },
  tabTextActive: {
    color: CA_THEME.white,
  },
  legendBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    backgroundColor: CA_THEME.lightGray,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilyMedium,
    color: CA_THEME.textSecondary,
  },
  scrollContent: {
    padding: 16,
    backgroundColor: ITEM_COLORS.bgGray,
  },
  cabinetContainer: {
    backgroundColor: '#EAEAEA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    padding: 12,
    // Ombre du meuble
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  shelfLevelWrapper: {
    marginBottom: 0, // Collé car on dessine l'étagère
  },
  shelfBackdrop: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderLeftColor: '#E0E0E0',
    borderRightColor: '#E0E0E0',
  },
  shelfTilesRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-start',
  },
  shelfPlank: {
    height: 14,
    backgroundColor: '#D1D1D1',
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  shelfPlankShadow: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  tile: {
    flex: 1,
    backgroundColor: CA_THEME.white,
    borderRadius: 12,
    padding: 10,
    minHeight: 90,
  },
  emptyTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  qtyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qtyBadgeText: {
    color: CA_THEME.white,
    fontFamily: CA_THEME.fontFamilyBold,
    fontSize: 12,
  },
  tileBody: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tileLabel: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilySemiBold,
    color: CA_THEME.textPrimary,
    marginBottom: 2,
  },
  tileRef: {
    fontSize: 10,
    fontFamily: CA_THEME.fontFamilyRegular,
    color: CA_THEME.textMuted,
  },
  highlightGlow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
  },
  floorPadding: {
    height: 40,
  },
});
