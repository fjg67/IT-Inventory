import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CA_THEME } from '@/constants/caTheme';

export const CAParametresHeader = () => {
  const insets = useSafeAreaInsets();
  
  return (
  <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
    <View style={styles.titleRow}>
      <View style={styles.logoGroup}>
        <View style={styles.caSquare} aria-hidden>
          <Text style={styles.caText}>CA</Text>
        </View>
        <Text style={styles.title}>Réglages</Text>
      </View>
    </View>
    <Text style={styles.subtitle}>Personnalisez votre expérience</Text>
    <View style={styles.triband} aria-hidden>
      <View style={[styles.stripe, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.stripe, { backgroundColor: CA_THEME.greenLight }]} />
      <View style={[styles.stripe, { backgroundColor: CA_THEME.greenDark }]} />
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor:   CA_THEME.green,
    paddingHorizontal: 16,
    paddingBottom:     14,
    position:          'relative',
  },
  titleRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caSquare: {
    width: 32, height: 26, borderRadius: 3,
    backgroundColor: CA_THEME.white,
    alignItems: 'center', justifyContent: 'center',
  },
  caText:   { fontSize: 10, fontWeight: '900', color: CA_THEME.green, letterSpacing: -0.5 },
  title:    { fontSize: 20, fontWeight: '700', color: CA_THEME.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  triband:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },
  stripe:   { flex: 1, height: '100%' },
});
