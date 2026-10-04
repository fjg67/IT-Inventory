import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import globalSearchService, { GlobalSearchResults } from '@/services/globalSearchService';

const EMPTY: GlobalSearchResults = { articles: [], movements: [], sites: [] };

export const GlobalSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const siteId = useAppSelector(selectEffectiveSiteId);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length < 2) { setResults(EMPTY); return; }
      setLoading(true);
      globalSearchService.search(query, siteId ?? undefined).then(setResults).catch(() => setResults(EMPTY)).finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(timer);
  }, [query, siteId]);

  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Icon name="arrow-left" size={21} color="#17352A" /></Pressable><Text style={styles.title}>Recherche globale</Text></View><View style={styles.searchWrap}><Icon name="magnify" size={20} color="#007A55" /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Article, PC, mouvement, site..." placeholderTextColor="#82948A" style={styles.input} /></View>{loading ? <ActivityIndicator color="#007A55" style={styles.loader} /> : <ScrollView contentContainerStyle={styles.content}>{query.length > 1 && <><ResultSection title="Articles et PC" icon="package-variant" count={results.articles.length}>{results.articles.map(article => <Pressable key={String(article.id)} style={styles.row} onPress={() => navigation.navigate('Articles', { screen: 'ArticleDetail', params: { articleId: article.id } })}><Icon name="package-variant-closed" size={18} color="#007A55" /><View style={styles.rowBody}><Text style={styles.rowTitle}>{article.nom}</Text><Text style={styles.rowMeta}>{article.reference} · {article.emplacement ?? 'Emplacement non renseigné'} · Stock {article.quantiteActuelle ?? 0}</Text></View></Pressable>)}</ResultSection><ResultSection title="Sites" icon="office-building-outline" count={results.sites.length}>{results.sites.map(site => <View key={String(site.id)} style={styles.row}><Icon name="map-marker-outline" size={18} color="#2563EB" /><View style={styles.rowBody}><Text style={styles.rowTitle}>{site.nom}</Text><Text style={styles.rowMeta}>{site.code} · {site.adresse ?? ''}</Text></View></View>)}</ResultSection><ResultSection title="Mouvements" icon="swap-horizontal" count={results.movements.length}>{results.movements.map(movement => <View key={String(movement.id)} style={styles.row}><Icon name="history" size={18} color="#B45309" /><View style={styles.rowBody}><Text style={styles.rowTitle}>{movement.article?.nom ?? 'Article'} · {movement.type}</Text><Text style={styles.rowMeta}>{new Date(movement.dateMouvement).toLocaleString('fr-FR')} · {movement.commentaire ?? 'Sans commentaire'}</Text></View></View>)}</ResultSection>{results.articles.length + results.sites.length + results.movements.length === 0 && <Text style={styles.empty}>Aucun résultat.</Text>}</>}</ScrollView>}</SafeAreaView>;
};

const ResultSection = ({ title, icon, count, children }: { title: string; icon: string; count: number; children: React.ReactNode }) => <View style={styles.section}><View style={styles.sectionHeader}><Icon name={icon} size={18} color="#007A55" /><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.count}>{count}</Text></View>{children}</View>;

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F5F0' }, header: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16, backgroundColor: '#FFFFFF' }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF5F0', alignItems: 'center', justifyContent: 'center' }, title: { color: '#17352A', fontSize: 21, fontWeight: '800' }, searchWrap: { margin: 14, height: 50, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B9D9C6', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 }, input: { flex: 1, color: '#17352A', fontSize: 15 }, loader: { marginTop: 24 }, content: { padding: 14, gap: 12, paddingBottom: 30 }, section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 13, borderWidth: 1, borderColor: '#DCE8DF' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }, sectionTitle: { flex: 1, color: '#17352A', fontWeight: '800', fontSize: 14 }, count: { color: '#007A55', fontWeight: '800', fontSize: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E1EAE4' }, rowBody: { flex: 1 }, rowTitle: { color: '#28563F', fontSize: 13, fontWeight: '700' }, rowMeta: { color: '#718078', fontSize: 11, marginTop: 3 }, empty: { color: '#718078', textAlign: 'center', padding: 30 },
});

export default GlobalSearchScreen;
