import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import savedFiltersService, { SavedArticleFilter } from '@/services/savedFiltersService';

export const SavedFiltersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<SavedArticleFilter[]>([]);
  const load = useCallback(async () => setItems(await savedFiltersService.list()), []);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const remove = (item: SavedArticleFilter) => Alert.alert('Supprimer le filtre ?', item.name, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: async () => { await savedFiltersService.remove(item.id); await load(); } }]);
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Icon name="arrow-left" size={21} color="#17352A" /></Pressable><View><Text style={styles.eyebrow}>ARTICLES</Text><Text style={styles.title}>Filtres enregistrés</Text></View></View><ScrollView contentContainerStyle={styles.content}>{items.length === 0 ? <Text style={styles.empty}>Aucun filtre enregistré.</Text> : items.map(item => <View key={item.id} style={styles.row}><View style={styles.body}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text></View><Pressable onPress={() => navigation.navigate('Main', { screen: 'Articles', params: { screen: 'ArticlesList', params: { savedFilter: item.filters } } })} style={styles.apply}><Icon name="filter-check-outline" size={18} color="#FFFFFF" /></Pressable><Pressable onPress={() => remove(item)} style={styles.delete}><Icon name="delete-outline" size={18} color="#B4233E" /></Pressable></View>)}</ScrollView></SafeAreaView>;
};
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F5F0' }, header: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16, backgroundColor: '#FFFFFF' }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF5F0', alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#007A55', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 21, fontWeight: '800' }, content: { padding: 14, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 13, backgroundColor: '#FFFFFF' }, body: { flex: 1 }, name: { color: '#17352A', fontWeight: '800' }, meta: { color: '#718078', fontSize: 11, marginTop: 3 }, apply: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#007A55' }, delete: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCECEF' }, empty: { color: '#718078', textAlign: 'center', padding: 30 }, });
export default SavedFiltersScreen;
