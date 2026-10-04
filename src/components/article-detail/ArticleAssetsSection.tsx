import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';
import { AssetScanRecord, getAssetsInStock, workstationAssetService } from '@/services/workstationAssetService';

type AssetView = 'stock' | 'history';

export const ArticleAssetsSection = ({ articleId, siteId }: { articleId: string | number; siteId: string | number }) => {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<AssetScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AssetView>('stock');
  const [copiedCode, setCopiedCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHistory(await workstationAssetService.listHistory(articleId, siteId));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [articleId, siteId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const inStock = getAssetsInStock(history);
  const displayed = view === 'stock' ? inStock : history;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}><Icon name="barcode-scan" size={18} color={CA_THEME.green} /></View>
        <Text style={styles.sectionTitle}>Assets</Text>
        <Text style={styles.sectionCount}>STOCK SUIVI</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{inStock.length}</Text>
          <Text style={styles.summaryLabel}>ASSETS PRÉSENTS</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{history.length}</Text>
          <Text style={styles.summaryLabel}>SCANS ENREGISTRÉS</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={CA_THEME.green} style={styles.indicator} />
      ) : error ? (
        <Pressable onPress={load} style={styles.retry} accessibilityRole="button">
          <Icon name="refresh" size={16} color={CA_THEME.danger} />
          <Text style={styles.retryText}>Chargement impossible · Réessayer</Text>
        </Pressable>
      ) : (
        <>
          {inStock.length > 0 && (
            <View style={styles.previewList}>
              {inStock.slice(0, 3).map(asset => (
                <View key={asset.code} style={styles.previewRow}>
                  <Icon name="barcode" size={17} color={CA_THEME.green} />
                  <Text style={styles.previewCode} numberOfLines={2} ellipsizeMode="middle">{asset.code}</Text>
                  <Icon name="check-circle" size={16} color={CA_THEME.green} />
                </View>
              ))}
            </View>
          )}
          {history.length === 0 && <Text style={styles.emptyText}>Aucun asset scanné sur ce site</Text>}
          <Pressable onPress={() => { setView('stock'); setOpen(true); }} style={styles.seeAll} accessibilityRole="button">
            <Icon name="format-list-bulleted" size={18} color={CA_THEME.white} />
            <Text style={styles.seeAllText}>Tous les assets et les scans</Text>
            <Icon name="arrow-right" size={18} color={CA_THEME.white} />
          </Pressable>
        </>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleBlock}>
                <Text style={styles.sheetTitle}>Assets de l’article</Text>
                <Text style={styles.sheetSubtitle}>Stock et historique sur ce site</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} style={styles.close} accessibilityRole="button" accessibilityLabel="Fermer la liste des assets">
                <Icon name="close" size={20} color={CA_THEME.white} />
              </Pressable>
            </View>
            <View style={styles.tabs} accessibilityRole="tablist">
              {([
                { key: 'stock', label: `En stock (${inStock.length})` },
                { key: 'history', label: `Historique (${history.length})` },
              ] as const).map(tab => (
                <Pressable key={tab.key} onPress={() => setView(tab.key)} style={[styles.tab, view === tab.key && styles.tabActive]} accessibilityRole="tab" accessibilityState={{ selected: view === tab.key }}>
                  <Text style={[styles.tabText, view === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>
            <FlatList
              data={displayed}
              keyExtractor={item => item.id}
              refreshing={loading}
              onRefresh={load}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.emptyText}>{view === 'stock' ? 'Aucun asset présent sur ce site' : 'Aucun scan enregistré sur ce site'}</Text>}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={[styles.rowIcon, item.direction === 'sortie' && styles.rowIconExit]}>
                    <Icon name={item.direction === 'entree' ? 'arrow-down-bold' : 'arrow-up-bold'} size={16} color={item.direction === 'entree' ? CA_THEME.green : CA_THEME.danger} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowCode} selectable>{item.code}</Text>
                    <Text style={styles.rowDate}>{new Date(item.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Text style={[styles.rowDirection, item.direction === 'sortie' && styles.rowDirectionExit]}>{item.direction === 'entree' ? 'Entrée' : 'Sortie'}</Text>
                    <Pressable onPress={() => { Clipboard.setString(item.code); setCopiedCode(item.code); }} style={styles.copyButton} accessibilityRole="button" accessibilityLabel={`Copier l’asset ${item.code}`}>
                      <Icon name={copiedCode === item.code ? 'check' : 'content-copy'} size={17} color={CA_THEME.green} />
                    </Pressable>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 6, backgroundColor: CA_THEME.greenBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CA_THEME.greenBg2 },
  sectionTitle: { flex: 1, color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilyBold, fontSize: 16 },
  sectionCount: { color: CA_THEME.greenText, fontFamily: CA_THEME.fontFamilyBold, fontSize: 10, backgroundColor: CA_THEME.greenBg, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 4 },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: CA_THEME.greenDark, borderTopWidth: 3, borderTopColor: CA_THEME.greenLight, borderRadius: 8, paddingVertical: 17, paddingHorizontal: 18 },
  summaryStat: { flex: 1, alignItems: 'flex-start' },
  summaryValue: { color: CA_THEME.white, fontFamily: CA_THEME.fontFamilyBold, fontSize: 29 },
  summaryLabel: { color: '#CBE4D8', fontFamily: CA_THEME.fontFamilySemiBold, fontSize: 10, marginTop: 2 },
  separator: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)', marginRight: 18 },
  indicator: { paddingVertical: 16 },
  previewList: { backgroundColor: CA_THEME.white, borderRadius: 8, borderWidth: 1, borderColor: CA_THEME.borderGray, overflow: 'hidden' },
  previewRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 8, borderBottomWidth: 1, borderColor: CA_THEME.borderGray },
  previewCode: { flex: 1, minWidth: 0, color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 12, lineHeight: 18 },
  emptyText: { color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 13, textAlign: 'center', paddingVertical: 22 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  retryText: { color: CA_THEME.danger, fontFamily: CA_THEME.fontFamilySemiBold, fontSize: 12 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, backgroundColor: CA_THEME.green, borderRadius: 6 },
  seeAllText: { flex: 1, color: CA_THEME.white, fontFamily: CA_THEME.fontFamilyBold, fontSize: 12 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: CA_THEME.white, maxHeight: '82%', minHeight: 300, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18, backgroundColor: CA_THEME.greenDark, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  sheetTitleBlock: { flex: 1, minWidth: 0 },
  sheetTitle: { color: CA_THEME.white, fontFamily: CA_THEME.fontFamilyBold, fontSize: 18 },
  sheetSubtitle: { color: '#CBE4D8', fontFamily: CA_THEME.fontFamilyMedium, fontSize: 12, marginTop: 3 },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 18, marginTop: 14, padding: 4, gap: 4, marginBottom: 6, borderRadius: 6, backgroundColor: CA_THEME.lightGray },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 4 },
  tabActive: { backgroundColor: CA_THEME.green },
  tabText: { color: CA_THEME.textSecondary, fontFamily: CA_THEME.fontFamilySemiBold, fontSize: 12 },
  tabTextActive: { color: CA_THEME.white },
  list: { paddingHorizontal: 18, paddingBottom: 16, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 66, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: CA_THEME.borderGray },
  rowIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: CA_THEME.greenBg },
  rowIconExit: { backgroundColor: CA_THEME.dangerBg },
  rowContent: { flex: 1, minWidth: 0 },
  rowCode: { color: CA_THEME.textPrimary, fontFamily: CA_THEME.fontFamilySemiBold, fontSize: 13, lineHeight: 19 },
  rowDate: { color: CA_THEME.textMuted, fontFamily: CA_THEME.fontFamilyMedium, fontSize: 11, marginTop: 3 },
  rowActions: { alignItems: 'flex-end', gap: 3 },
  rowDirection: { color: CA_THEME.green, fontFamily: CA_THEME.fontFamilyBold, fontSize: 11 },
  rowDirectionExit: { color: CA_THEME.danger },
  copyButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});