import React from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CA_THEME } from '@/constants/caTheme';

interface CAMouvementsHeaderProps {
  totalCount:     number;
  todayCount:     number;
  onOpenChart:    () => void;
  onOpenSearch:   () => void;
}

export const CAMouvementsHeader = ({
  totalCount, todayCount, onOpenChart, onOpenSearch
}: CAMouvementsHeaderProps) => {
  const insets = useSafeAreaInsets();
  
  return (
  <View style={[styles.header, { paddingTop: insets.top + 12 }]}>

    {/* Ligne principale */}
    <View style={styles.titleRow}>
      <View style={styles.logoGroup}>
        <View style={styles.caSquare} aria-hidden>
          <Text style={styles.caText}>CA</Text>
        </View>
        <Text style={styles.title}>Mouvements</Text>
      </View>
      <View style={styles.iconGroup}>
        <Pressable onPress={onOpenChart} style={styles.iconBtn}
          accessibilityRole="button" accessibilityLabel="Voir les graphiques">
          <Icon name="chart-bar" size={17} color={CA_THEME.white} />
        </Pressable>
        <Pressable onPress={onOpenSearch} style={styles.iconBtn}
          accessibilityRole="button" accessibilityLabel="Rechercher">
          <Icon name="magnify" size={17} color={CA_THEME.white} />
        </Pressable>
      </View>
    </View>

    {/* Sous-lignes info */}
    <Text style={styles.subText}>
      {totalCount} mouvements enregistrés
    </Text>
    <Text style={styles.todayText}>
      — {todayCount} mouvement{todayCount !== 1 ? 's' : ''} aujourd'hui
    </Text>

    {/* Bande tricolore CA */}
    <View style={styles.triband} aria-hidden>
      <View style={[styles.tribandPart, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.tribandPart, { backgroundColor: CA_THEME.greenLight }]} />
      <View style={[styles.tribandPart, { backgroundColor: CA_THEME.greenDark }]} />
    </View>

  </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor:  CA_THEME.green,
    paddingHorizontal: 16,
    paddingBottom:    14,
    position:         'relative',
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   6,
  },
  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caSquare: {
    width: 32, height: 26, borderRadius: 3,
    backgroundColor: CA_THEME.white,
    alignItems: 'center', justifyContent: 'center',
  },
  caText: { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '900', color: CA_THEME.green, letterSpacing: -0.5 },
  title:  { fontSize: 20, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', color: CA_THEME.white },
  iconGroup: { flexDirection: 'row', gap: 7 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  subText:   { fontSize: 12, fontFamily: CA_THEME.fontFamilyMedium, color: 'rgba(255,255,255,0.80)', marginBottom: 2 },
  todayText: { fontSize: 11, fontFamily: CA_THEME.fontFamilyMedium, color: 'rgba(255,255,255,0.58)' },
  triband: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, flexDirection: 'row',
  },
  tribandPart: { flex: 1, height: '100%' },
});
