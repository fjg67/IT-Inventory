import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import * as XLSX from 'xlsx';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { bulkArticleService, parseImportText, type BulkPatch } from '@/services/bulkArticleService';
import { Article, Site } from '@/types';

 type Action = 'update' | 'transfer' | 'entry' | 'exit' | 'archive' | null;

export const BulkArticleActionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const siteId = useAppSelector(selectEffectiveSiteId);
  const siteName = useAppSelector(state => state.site.siteActif?.nom ?? 'Non sélectionné');
  const currentTechnician = useAppSelector(state => state.auth.currentTechnicien);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<Action>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [famille, setFamille] = useState('');
  const [marque, setMarque] = useState('');
  const [emplacement, setEmplacement] = useState('');
  const [stockMini, setStockMini] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [destinationSiteId, setDestinationSiteId] = useState<string | number | null>(null);

  const loadData = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const [loadedArticles, loadedSites] = await Promise.all([
        bulkArticleService.getArticles(siteId),
        bulkArticleService.getSites(),
      ]);
      setArticles(loadedArticles);
      setSites(loadedSites.filter(site => String(site.id) !== String(siteId)));
    } catch (error) {
      Alert.alert('Chargement impossible', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { loadData().catch(() => {}); }, [loadData]);

  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter(article => [article.reference, article.nom, article.barcode].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [articles, search]);

  const selectedArticles = useMemo(() => articles.filter(article => selectedIds.has(String(article.id))), [articles, selectedIds]);

  const toggleSelected = (id: string | number) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      const key = String(id);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleVisible = () => {
    const allVisibleSelected = visibleArticles.every(article => selectedIds.has(String(article.id)));
    setSelectedIds(previous => {
      const next = new Set(previous);
      visibleArticles.forEach(article => {
        if (allVisibleSelected) next.delete(String(article.id));
        else next.add(String(article.id));
      });
      return next;
    });
  };

  const showResult = (label: string, result: { success: number; failed: Array<{ reference: string; message: string }> }) => {
    const failures = result.failed.slice(0, 3).map(item => `${item.reference}: ${item.message}`).join('\n');
    Alert.alert(label, `${result.success} opération(s) réussie(s).${result.failed.length ? `\n\n${result.failed.length} échec(s) :\n${failures}` : ''}`);
  };

  const executeAction = async () => {
    if (!siteId || selectedArticles.length === 0 || !action) return;
    setWorking(true);
    try {
      if (action === 'archive') {
        const confirmed = await new Promise<boolean>(resolve => Alert.alert('Archiver les articles ?', `${selectedArticles.length} article(s) seront masqués du stock actif.`, [{ text: 'Annuler', style: 'cancel', onPress: () => resolve(false) }, { text: 'Archiver', style: 'destructive', onPress: () => resolve(true) }]));
        if (!confirmed) return;
        showResult('Archivage terminé', await bulkArticleService.archiveArticles(selectedArticles));
      } else if (action === 'update') {
        const patch: BulkPatch = {};
        if (famille.trim()) patch.famille = famille.trim();
        if (marque.trim()) patch.marque = marque.trim();
        if (emplacement.trim()) patch.emplacement = emplacement.trim();
        if (stockMini.trim()) patch.stockMini = Math.max(0, Number(stockMini));
        if (Object.keys(patch).length === 0) throw new Error('Renseignez au moins un champ à modifier');
        showResult('Modification terminée', await bulkArticleService.updateArticles(selectedArticles, patch));
      } else if (action === 'entry' || action === 'exit') {
        showResult('Mouvement terminé', await bulkArticleService.createMovement(selectedArticles, siteId, action === 'entry' ? 'entree' : 'sortie', Number(quantity), currentTechnician?.id ?? 1));
      } else if (action === 'transfer') {
        if (!destinationSiteId) throw new Error('Choisissez un site de destination');
        showResult('Transfert terminé', await bulkArticleService.transferArticles(selectedArticles, siteId, destinationSiteId, currentTechnician?.id ?? 1));
      }
      setAction(null);
      setSelectedIds(new Set());
      await loadData();
    } catch (error) {
      Alert.alert('Opération impossible', (error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const importFile = async () => {
    try {
      const file = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.csv, DocumentPicker.types.xls, DocumentPicker.types.xlsx, DocumentPicker.types.plainText] });
      const sourceUri = file.fileCopyUri ?? file.uri;
      const path = sourceUri.replace(/^file:\/\//, '');
      const base64 = await RNFS.readFile(path, 'base64');
      const workbook = XLSX.read(base64, { type: 'base64' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const text = firstSheet ? XLSX.utils.sheet_to_csv(firstSheet, { FS: ';' }) : '';
      const rows = parseImportText(text);
      if (!siteId || rows.length === 0) throw new Error('Le fichier ne contient aucune ligne exploitable');
      setWorking(true);
      const result = await bulkArticleService.importRows(rows, siteId);
      showResult(`Import terminé · ${result.created} créé(s), ${result.updated} mis à jour`, result);
      await loadData();
    } catch (error) {
      if (DocumentPicker.isCancel(error)) return;
      Alert.alert('Import impossible', (error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const renderArticle = ({ item }: { item: Article }) => {
    const selected = selectedIds.has(String(item.id));
    return <Pressable onPress={() => toggleSelected(item.id)} style={[styles.articleRow, selected && styles.articleRowSelected]}><View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Icon name="check" size={16} color="#FFFFFF" /> : null}</View><View style={styles.articleInfo}><Text style={styles.articleName} numberOfLines={1}>{item.nom}</Text><Text style={styles.articleMeta}>{item.reference} · Stock {item.quantiteActuelle ?? 0}</Text></View><Icon name="chevron-right" size={18} color="#93A39A" /></Pressable>;
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color="#007A55" /><Text style={styles.centerText}>Chargement des articles...</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><Icon name="arrow-left" size={21} color="#17352A" /></Pressable><View style={styles.headerTitle}><Text style={styles.kicker}>ARTICLES</Text><Text style={styles.title}>Actions groupées</Text></View><Pressable onPress={importFile} style={styles.importButton} disabled={working}><Icon name="file-import-outline" size={19} color="#FFFFFF" /></Pressable></View>
    <View style={styles.siteBar}><Icon name="office-building-outline" size={17} color="#007A55" /><Text style={styles.siteText}>Site actif · {siteName}</Text></View>
    <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un article..." placeholderTextColor="#809087" style={styles.searchInput} />
    <View style={styles.selectionBar}><Text style={styles.selectionText}>{selectedIds.size} sélectionné(s)</Text><Pressable onPress={toggleVisible}><Text style={styles.selectAll}>{visibleArticles.every(article => selectedIds.has(String(article.id))) ? 'Tout désélectionner' : 'Tout sélectionner'}</Text></Pressable></View>
    <FlatList data={visibleArticles} keyExtractor={item => String(item.id)} renderItem={renderArticle} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>Aucun article trouvé.</Text>} />
    <View style={styles.bottomBar}><Pressable disabled={selectedIds.size === 0} onPress={() => setAction('update')} style={styles.actionButton}><Icon name="pencil-outline" size={18} color="#FFFFFF" /><Text style={styles.actionText}>Modifier</Text></Pressable><Pressable disabled={selectedIds.size === 0} onPress={() => setAction('entry')} style={[styles.actionButton, styles.entryButton]}><Icon name="arrow-up" size={18} color="#FFFFFF" /><Text style={styles.actionText}>Entrée</Text></Pressable><Pressable disabled={selectedIds.size === 0} onPress={() => setAction('exit')} style={[styles.actionButton, styles.exitButton]}><Icon name="arrow-down" size={18} color="#FFFFFF" /><Text style={styles.actionText}>Sortie</Text></Pressable><Pressable disabled={selectedIds.size === 0} onPress={() => setAction('transfer')} style={[styles.actionButton, styles.transferButton]}><Icon name="swap-horizontal" size={18} color="#FFFFFF" /><Text style={styles.actionText}>Transfert</Text></Pressable><Pressable disabled={selectedIds.size === 0} onPress={() => setAction('archive')} style={[styles.actionButton, styles.archiveButton]}><Icon name="archive-outline" size={18} color="#FFFFFF" /><Text style={styles.actionText}>Archiver</Text></Pressable></View>

    <Modal visible={action !== null} transparent animationType="slide" onRequestClose={() => setAction(null)}><View style={styles.backdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{action === 'update' ? 'Modifier les articles' : action === 'transfer' ? 'Transférer les articles' : action === 'entry' ? 'Faire une entrée' : action === 'exit' ? 'Faire une sortie' : 'Archiver les articles'}</Text><Text style={styles.modalHint}>{selectedArticles.length} article(s) sélectionné(s)</Text>{action === 'update' ? <><Field label="Famille" value={famille} onChangeText={setFamille} placeholder="Laisser inchangé" /><Field label="Marque" value={marque} onChangeText={setMarque} placeholder="Laisser inchangé" /><Field label="Emplacement" value={emplacement} onChangeText={setEmplacement} placeholder="Laisser inchangé" /><Field label="Stock minimum" value={stockMini} onChangeText={setStockMini} placeholder="Laisser inchangé" keyboardType="numeric" /></> : null}{action === 'entry' || action === 'exit' ? <Field label="Quantité par référence" value={quantity} onChangeText={setQuantity} keyboardType="numeric" /> : null}{action === 'transfer' ? <View style={styles.siteOptions}>{sites.map(site => <Pressable key={String(site.id)} onPress={() => setDestinationSiteId(site.id)} style={[styles.siteOption, String(destinationSiteId) === String(site.id) && styles.siteOptionSelected]}><Icon name={String(destinationSiteId) === String(site.id) ? 'radiobox-marked' : 'radiobox-blank'} size={19} color="#007A55" /><Text style={styles.siteOptionText}>{site.nom}</Text></Pressable>)}</View> : null}<View style={styles.modalActions}><Pressable onPress={() => setAction(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Annuler</Text></Pressable><Pressable onPress={executeAction} disabled={working} style={styles.confirmButton}>{working ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>Confirmer</Text>}</Pressable></View></View></View></Modal>
  </SafeAreaView>;
};

const Field = ({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'numeric' }) => <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#809087" keyboardType={keyboardType} style={styles.fieldInput} /></View>;

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F5F0' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F5F5F0' }, centerText: { color: '#617068' }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#FFFFFF' }, iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF5F0' }, headerTitle: { flex: 1 }, kicker: { color: '#007A55', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 21, fontWeight: '800', marginTop: 3 }, importButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#007A55' }, siteBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#EAF4EE' }, siteText: { color: '#28563F', fontSize: 13, fontWeight: '700' }, searchInput: { margin: 14, height: 46, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, color: '#17352A' }, selectionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 9 }, selectionText: { color: '#17352A', fontSize: 13, fontWeight: '800' }, selectAll: { color: '#007A55', fontSize: 12, fontWeight: '700' }, list: { paddingHorizontal: 14, paddingBottom: 110, gap: 8 }, articleRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#FFFFFF' }, articleRowSelected: { borderWidth: 1, borderColor: '#007A55', backgroundColor: '#F0FAF4' }, checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.5, borderColor: '#B9C9BE', alignItems: 'center', justifyContent: 'center' }, checkboxSelected: { borderColor: '#007A55', backgroundColor: '#007A55' }, articleInfo: { flex: 1 }, articleName: { color: '#17352A', fontWeight: '700', fontSize: 14 }, articleMeta: { color: '#718078', fontSize: 12, marginTop: 4 }, empty: { color: '#617068', textAlign: 'center', padding: 30 }, bottomBar: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', gap: 5, padding: 7, borderRadius: 16, backgroundColor: '#17352A', elevation: 8 }, actionButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 10, backgroundColor: '#2563EB' }, entryButton: { backgroundColor: '#059669' }, exitButton: { backgroundColor: '#DC2626' }, transferButton: { backgroundColor: '#7C3AED' }, archiveButton: { backgroundColor: '#B45309' }, actionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' }, backdrop: { flex: 1, backgroundColor: 'rgba(10,25,18,0.52)', justifyContent: 'flex-end' }, modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, gap: 12 }, modalTitle: { color: '#17352A', fontSize: 20, fontWeight: '800' }, modalHint: { color: '#617068', fontSize: 13 }, field: { gap: 5 }, fieldLabel: { color: '#426151', fontSize: 12, fontWeight: '700' }, fieldInput: { height: 45, borderWidth: 1, borderColor: '#C9D9CF', borderRadius: 10, paddingHorizontal: 12, color: '#17352A' }, siteOptions: { gap: 7 }, siteOption: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#F5F8F5' }, siteOptionSelected: { backgroundColor: '#DDF5E8' }, siteOptionText: { color: '#17352A', fontWeight: '600' }, modalActions: { flexDirection: 'row', gap: 9, marginTop: 5 }, cancelButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#EEF3EF' }, cancelText: { color: '#345343', fontWeight: '700' }, confirmButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#007A55' }, confirmText: { color: '#FFFFFF', fontWeight: '800' },
});

export default BulkArticleActionsScreen;
