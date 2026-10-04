import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import advancedDashboardService, { AdvancedDashboardData } from '@/services/advancedDashboardService';
import { CA_THEME } from '@/constants/caTheme';

const EMPTY: AdvancedDashboardData = {
  totalUnits: 0, totalStockValue: 0, valuationComplete: true, ruptureRate: 0, inventoryGapRate: null,
  familyConsumption: [], dormantArticles: [], technicianMovements: [], siteComparison: [], topConsumed: [],
};

export const AdvancedDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<AdvancedDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<30 | 90 | 365>(90);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await advancedDashboardService.load(period));
    } catch (error) {
      console.warn('[AdvancedDashboard] load error:', error);
      setError(error instanceof Error ? error.message : 'Impossible de charger les indicateurs.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load().catch(() => {}); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const maxFamily = Math.max(...data.familyConsumption.map(item => item.value), 1);
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Icon name="arrow-left" size={21} color="#17352A" /></Pressable><View><Text style={styles.eyebrow}>PILOTAGE</Text><Text style={styles.title}>Dashboard avancé</Text></View></View>
      <View style={styles.toolbar}>
        <View style={styles.toolbarLabel}>
          <Icon name="calendar-range" size={17} color={CA_THEME.green} />
          <Text style={styles.toolbarTitle}>Période d’analyse</Text>
        </View>
        <View style={styles.periods}>
          {([30, 90, 365] as const).map(value => (
            <Pressable key={value} onPress={() => setPeriod(value)} style={[styles.period, period === value && styles.periodActive]} accessibilityRole="radio" accessibilityState={{ selected: period === value }}>
              <Text style={[styles.periodText, period === value && styles.periodTextActive]}>{value === 365 ? '1 an' : `${value} j`}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {loading ? <View style={styles.loader}><ActivityIndicator color={CA_THEME.green} /><Text style={styles.muted}>Calcul des indicateurs...</Text></View> : error ? <View style={styles.errorState}><Icon name="cloud-alert-outline" size={34} color={CA_THEME.danger} /><Text style={styles.errorTitle}>Dashboard indisponible</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={load} style={styles.retry}><Icon name="refresh" size={17} color={CA_THEME.white} /><Text style={styles.retryText}>Réessayer</Text></Pressable></View> : <>
        <View style={styles.scope}><Icon name="database-outline" size={16} color={CA_THEME.green} /><Text style={styles.scopeText}>Vue consolidée · Tous les sites · {period === 365 ? '12 derniers mois' : `${period} derniers jours`}</Text></View>
        <View style={styles.kpiGrid}><Kpi icon="cash-multiple" label="Valeur totale du stock" value={`${data.totalStockValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`} hint={!data.valuationComplete ? 'Prix manquants' : 'Valorisation complète'} color="#007A55" /><Kpi icon="package-variant" label="Unités en stock" value={data.totalUnits.toLocaleString('fr-FR')} hint="Tous sites" color="#2563EB" /><Kpi icon="alert-circle-outline" label="Taux de rupture" value={`${(data.ruptureRate * 100).toFixed(1)} %`} hint="Lignes à zéro" color="#C2415A" /><Kpi icon="clipboard-alert-outline" label="Écart inventaire" value={data.inventoryGapRate == null ? 'N/D' : `${(data.inventoryGapRate * 100).toFixed(1)} %`} hint={data.inventoryGapRate == null ? 'Inventaire détaillé requis' : 'Dernier inventaire'} color="#B45309" /></View>
        <Section title="Consommation par famille" icon="shape-outline">{data.familyConsumption.length ? data.familyConsumption.map(item => <BarRow key={item.label} label={item.label} value={item.value} max={maxFamily} color="#007A55" />) : <Empty text="Aucune sortie sur les 90 derniers jours." />}</Section>
        <Section title="Top articles consommés" icon="chart-line">{data.topConsumed.length ? data.topConsumed.map((item, index) => <RankRow key={item.id} rank={index + 1} label={item.label} value={`${item.value} sortie(s)`} />) : <Empty text="Aucune consommation enregistrée." />}</Section>
        <Section title="Articles dormants" icon="sleep">{data.dormantArticles.length ? data.dormantArticles.map(item => <View key={item.id} style={styles.simpleRow}><View style={styles.rowIcon}><Icon name="package-variant-closed" size={16} color="#7C3AED" /></View><Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text><Text style={styles.rowValue}>{item.stock} en stock</Text></View>) : <Empty text="Aucun article dormant détecté." />}</Section>
        <Section title="Mouvements par technicien" icon="account-group-outline">{data.technicianMovements.length ? data.technicianMovements.map(item => <BarRow key={item.label} label={item.label} value={item.value} max={Math.max(...data.technicianMovements.map(row => row.value), 1)} color="#2563EB" suffix=" mouv." />) : <Empty text="Aucun mouvement récent." />}</Section>
        <Section title="Comparaison entre sites" icon="office-building-outline">{data.siteComparison.map(site => <View key={site.id} style={styles.siteRow}><View style={styles.siteHeader}><Text style={styles.rowLabel}>{site.label}</Text><Text style={styles.rowValue}>{site.units} unités</Text></View><View style={styles.siteMeta}><Text style={styles.muted}>{site.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</Text><Text style={[styles.muted, site.ruptureRate > 0 && styles.danger]}>{(site.ruptureRate * 100).toFixed(1)} % rupture · {site.movements} mouv.</Text></View></View>)}</Section>
      </>}
    </ScrollView>
  </SafeAreaView>;
};

const Kpi = ({ icon, label, value, hint, color }: { icon: string; label: string; value: string; hint: string; color: string }) => <View style={styles.kpi}><View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}><Icon name={icon} size={19} color={color} /></View><Text style={styles.kpiValue} numberOfLines={1}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text><Text style={[styles.kpiHint, { color }]}>{hint}</Text></View>;
const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => <View style={styles.section}><View style={styles.sectionHeader}><Icon name={icon} size={18} color={CA_THEME.green} /><Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>;
const BarRow = ({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) => <View style={styles.barRow}><View style={styles.barHeader}><Text style={styles.rowLabel} numberOfLines={1}>{label}</Text><Text style={styles.rowValue}>{value}{suffix}</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, (value / max) * 100)}%`, backgroundColor: color }]} /></View></View>;
const RankRow = ({ rank, label, value }: { rank: number; label: string; value: string }) => <View style={styles.simpleRow}><View style={styles.rank}><Text style={styles.rankText}>{rank}</Text></View><Text style={styles.rowLabel} numberOfLines={1}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
const Empty = ({ text }: { text: string }) => <Text style={styles.muted}>{text}</Text>;

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F5F5F0' }, content: { padding: 16, gap: 14, paddingBottom: 34 }, header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 2 }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#007A55', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#17352A', fontSize: 23, fontWeight: '800', marginTop: 3 }, loader: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10 }, muted: { color: '#718078', fontSize: 12 }, toolbar: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#DCE8DF', padding: 10, gap: 10 }, toolbarLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 }, toolbarTitle: { color: '#28563F', fontSize: 12, fontWeight: '800' }, periods: { flexDirection: 'row', gap: 6 }, period: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36, borderRadius: 8, backgroundColor: '#F1F5F2' }, periodActive: { backgroundColor: CA_THEME.green }, periodText: { color: '#617068', fontSize: 12, fontWeight: '800' }, periodTextActive: { color: '#FFFFFF' }, scope: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 }, scopeText: { color: '#617068', fontSize: 11, fontWeight: '700' }, errorState: { minHeight: 250, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#F3C8D0' }, errorTitle: { color: '#9E2943', fontSize: 16, fontWeight: '800' }, retry: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: CA_THEME.green }, retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, kpi: { width: '48.5%', minHeight: 135, padding: 13, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#DCE8DF' }, kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, kpiValue: { color: '#17352A', fontSize: 20, fontWeight: '800' }, kpiLabel: { color: '#617068', fontSize: 11, marginTop: 3 }, kpiHint: { fontSize: 10, fontWeight: '800', marginTop: 8 }, section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#DCE8DF', gap: 11 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 3 }, sectionTitle: { color: '#17352A', fontSize: 14, fontWeight: '800' }, barRow: { gap: 6 }, barHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, rowLabel: { flex: 1, color: '#28563F', fontSize: 12, fontWeight: '700' }, rowValue: { color: '#17352A', fontSize: 12, fontWeight: '800' }, track: { height: 8, borderRadius: 4, backgroundColor: '#EAF1EB', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4 }, simpleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 35, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E1EAE4', paddingTop: 7 }, rowIcon: { width: 27, height: 27, borderRadius: 8, backgroundColor: '#F0EAFE', alignItems: 'center', justifyContent: 'center' }, rank: { width: 25, height: 25, borderRadius: 8, backgroundColor: '#EAF4EE', alignItems: 'center', justifyContent: 'center' }, rankText: { color: '#007A55', fontSize: 12, fontWeight: '800' }, siteRow: { gap: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E1EAE4', paddingTop: 9 }, siteHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, siteMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, danger: { color: '#C2415A' },
});

export default AdvancedDashboardScreen;
