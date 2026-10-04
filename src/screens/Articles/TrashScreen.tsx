import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { articleRepository } from '@/database';
import { Article } from '@/types';

export const TrashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [articles, setArticles] = useState<Article[]>([]);
  const load = useCallback(async () => { setArticles(await articleRepository.findArchived()); }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const restore = (article: Article) => Alert.alert('Restaurer l’article ?', article.nom, [{ text: 'Annuler', style: 'cancel' }, { text: 'Restaurer', onPress: async () => { try { await articleRepository.restore(article.id); await load(); } catch (error) { Alert.alert('Erreur', (error as Error).message); } } }]);
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Icon name="arrow-left" size={21} color="#17352A" /></Pressable><View><Text style={styles.eyebrow}>ARCHIVÉS</Text><Text style={styles.title}>Corbeille</Text></View></View><ScrollView contentContainerStyle={styles.content}>{articles.length === 0 ? <Text style={styles.empty}>La corbeille est vide.</Text> : articles.map(article => <View key={String(article.id)} style={styles.row}><View style={styles.body}><Text style={styles.name}>{article.nom}</Text><Text style={styles.meta}>{article.reference}</Text></View><Pressable onPress={() => restore(article)} style={styles.restore}><Icon name="restore" size={18} color="#FFFFFF" /></Pressable></View>)}</ScrollView></SafeAreaView>;
};
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F5F0' }, header: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16, backgroundColor: '#FFFFFF' }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF5F0', alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#B45309', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 21, fontWeight: '800' }, content: { padding: 14, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }, body: { flex: 1 }, name: { color: '#17352A', fontWeight: '800' }, meta: { color: '#718078', fontSize: 11, marginTop: 3 }, restore: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#007A55', alignItems: 'center', justifyContent: 'center' }, empty: { color: '#718078', textAlign: 'center', padding: 30 }, });
export default TrashScreen;
