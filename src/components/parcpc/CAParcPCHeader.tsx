import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

interface CAParcPCHeaderProps {
  activeCount:  number;   // PC actifs (non envoyés)
  vsLastWeek:   number;   // différence vs semaine dernière
}

export const CAParcPCHeader = ({ activeCount, vsLastWeek }: CAParcPCHeaderProps) => (
  <View style={styles.header}>

    <View style={styles.titleRow}>
      {/* Logo CA + titre */}
      <View style={styles.logoGroup}>
        <View style={styles.caSquare} aria-hidden>
          <Text style={styles.caText}>CA</Text>
        </View>
        <Text style={styles.title}>Parc PC</Text>
      </View>
    </View>

    {/* Pills info */}
    <View style={styles.pillsRow}>
      <View style={styles.pillMain} accessibilityLabel={`${activeCount} PC actifs`}>
        <Text style={styles.pillMainText}>{activeCount} PC actifs</Text>
      </View>
      <View style={styles.pillSec} accessibilityLabel={`${vsLastWeek > 0 ? '+' : ''}${vsLastWeek} vs semaine dernière`}>
        <Text style={styles.pillSecText}>
          {vsLastWeek > 0 ? '+' : ''}{vsLastWeek} vs sem.
        </Text>
      </View>
    </View>

    {/* Bande tricolore */}
    <View style={styles.triband} aria-hidden>
      <View style={[styles.stripe, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.stripe, { backgroundColor: CA_THEME.greenLight }]} />
      <View style={[styles.stripe, { backgroundColor: CA_THEME.greenDark }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor:   CA_THEME.green,
    paddingTop:        StatusBar.currentHeight ?? 12,
    paddingHorizontal: 16,
    paddingBottom:     14,
    position:          'relative',
  },
  titleRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logoGroup:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caSquare: {
    width: 32, height: 26, borderRadius: 3,
    backgroundColor: CA_THEME.white,
    alignItems: 'center', justifyContent: 'center',
  },
  caText:  { fontSize: 10, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '900', color: CA_THEME.green, letterSpacing: -0.5 },
  title:   { fontSize: 20, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', color: CA_THEME.white },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pillMain: {
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)',
  },
  pillMainText: { fontSize: 12, fontFamily: CA_THEME.fontFamilySemiBold, fontWeight: '600', color: CA_THEME.white },
  pillSec: {
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  pillSecText: { fontSize: 12, fontFamily: CA_THEME.fontFamilyMedium, fontWeight: '500', color: 'rgba(255,255,255,0.80)' },
  triband:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
  stripe:   { flex: 1, height: '100%' },
});
