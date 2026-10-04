import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import reportService, { ReportFormat } from '@/services/reportService';

export const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const technician = useAppSelector(state => state.auth.currentTechnicien);
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [articleReference, setArticleReference] = useState('');
  const [email, setEmail] = useState('');
  const [weekly, setWeekly] = useState(false);
  const [monthly, setMonthly] = useState(false);
  const [working, setWorking] = useState(false);
  const siteId = useAppSelector(state => state.site.siteActif?.id);

  const run = async (action: () => Promise<string>) => {
    setWorking(true);
    try { await action(); } catch (error) { Alert.alert('Export impossible', (error as Error).message); } finally { setWorking(false); }
  };

  const saveSchedule = async (frequency: 'weekly' | 'monthly', enabled: boolean) => {
    if (!technician?.id || !email.trim()) { Alert.alert('Email requis', 'Saisissez une adresse email pour activer l’envoi automatique.'); return; }
    setWorking(true);
    try { await reportService.saveSubscription(String(technician.id), email, frequency, enabled); Alert.alert('Rapports automatiques', enabled ? 'Abonnement enregistré.' : 'Abonnement désactivé.'); } catch (error) { Alert.alert('Enregistrement impossible', (error as Error).message); } finally { setWorking(false); }
  };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Icon name="arrow-left" size={21} color="#17352A" /></Pressable><View><Text style={styles.eyebrow}>EXPORTS</Text><Text style={styles.title}>Rapports</Text></View></View>
    <View style={styles.formatRow}><Text style={styles.formatLabel}>Format</Text><Pressable onPress={() => setFormat('csv')} style={[styles.formatButton, format === 'csv' && styles.formatActive]}><Text style={[styles.formatText, format === 'csv' && styles.formatTextActive]}>CSV</Text></Pressable><Pressable onPress={() => setFormat('xlsx')} style={[styles.formatButton, format === 'xlsx' && styles.formatActive]}><Text style={[styles.formatText, format === 'xlsx' && styles.formatTextActive]}>Excel</Text></Pressable></View>
    <ReportAction icon="warehouse" title="Rapport de stock par site" subtitle="Stock actuel, seuils et écarts" onPress={() => run(() => reportService.exportStockBySite(format))} />
    <ReportAction icon="laptop-off" title="Rapport des PC en panne" subtitle="Pannes actives et historique des tickets" onPress={() => run(() => reportService.exportPCBreakdowns(format))} />
    <ReportAction icon="swap-horizontal" title="Rapport des transferts" subtitle="Sites de départ, arrivée et quantités" onPress={() => run(() => reportService.exportTransfers(format))} />
    <View style={styles.articleCard}><Text style={styles.cardTitle}>Historique complet d’un article</Text><Text style={styles.cardHint}>Saisissez une référence présente sur le site actif.</Text><View style={styles.inline}><TextInput value={articleReference} onChangeText={setArticleReference} placeholder="Référence article" placeholderTextColor="#82948A" style={styles.input} /><Pressable disabled={!articleReference.trim() || !siteId} onPress={() => run(() => reportService.exportArticleHistory(articleReference, siteId!, format))} style={styles.smallButton}><Icon name="download" size={18} color="#FFFFFF" /></Pressable></View></View>
    <View style={styles.scheduleCard}><View><Text style={styles.cardTitle}>Envoi automatique</Text><Text style={styles.cardHint}>Le rapport sera envoyé par email même si l’application est fermée.</Text></View><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@exemple.fr" placeholderTextColor="#82948A" style={styles.input} /><ScheduleRow label="Chaque semaine" active={weekly} onPress={() => { const next = !weekly; setWeekly(next); saveSchedule('weekly', next).catch(() => {}); }} /><ScheduleRow label="Chaque mois" active={monthly} onPress={() => { const next = !monthly; setMonthly(next); saveSchedule('monthly', next).catch(() => {}); }} /></View>
    {working ? <Text style={styles.working}>Traitement en cours...</Text> : null}
  </ScrollView></SafeAreaView>;
};

const ReportAction = ({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) => <Pressable onPress={onPress} style={styles.action}><View style={styles.actionIcon}><Icon name={icon} size={21} color="#007A55" /></View><View style={styles.actionBody}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></View><Icon name="download" size={19} color="#007A55" /></Pressable>;
const ScheduleRow = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => <Pressable onPress={onPress} style={styles.scheduleRow}><Icon name={active ? 'checkbox-marked' : 'checkbox-blank-outline'} size={21} color={active ? '#007A55' : '#82948A'} /><Text style={styles.scheduleLabel}>{label}</Text></Pressable>;

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F5F0' }, content: { padding: 16, gap: 11, paddingBottom: 34 }, header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 4 }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#007A55', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 23, fontWeight: '800', marginTop: 3 }, formatRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 6, borderRadius: 12, backgroundColor: '#FFFFFF' }, formatLabel: { flex: 1, color: '#617068', fontSize: 12, fontWeight: '700', paddingLeft: 7 }, formatButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EEF3EF' }, formatActive: { backgroundColor: '#007A55' }, formatText: { color: '#426151', fontSize: 12, fontWeight: '800' }, formatTextActive: { color: '#FFFFFF' }, action: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8DF' }, actionIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#EAF4EE', alignItems: 'center', justifyContent: 'center' }, actionBody: { flex: 1 }, actionTitle: { color: '#17352A', fontSize: 14, fontWeight: '800' }, actionSubtitle: { color: '#718078', fontSize: 11, marginTop: 4 }, articleCard: { padding: 14, gap: 9, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8DF' }, cardTitle: { color: '#17352A', fontSize: 14, fontWeight: '800' }, cardHint: { color: '#718078', fontSize: 11 }, inline: { flexDirection: 'row', gap: 8 }, input: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#C9D9CF', paddingHorizontal: 12, color: '#17352A' }, smallButton: { width: 45, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#007A55' }, scheduleCard: { padding: 14, gap: 11, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8DF' }, scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 3 }, scheduleLabel: { color: '#28563F', fontSize: 13, fontWeight: '700' }, working: { color: '#007A55', fontSize: 12, textAlign: 'center', fontWeight: '700' },
});

export default ReportsScreen;
