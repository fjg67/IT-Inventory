import React from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CA_THEME } from '@/constants/caTheme';

interface CAArticlesHeaderProps {
  totalCount: number;
  lastSyncedAt?: string;
  isGridView?: boolean;
  onToggleView?: () => void;
  onBack?: () => void;
}

const formatRelativeTime = (isoString?: string) => {
  if (!isoString) return 'à l\'instant';
  return 'récemment';
};

export const CAArticlesHeader = ({
  totalCount, lastSyncedAt, isGridView, onToggleView, onBack
}: CAArticlesHeaderProps) => {
  const insets = useSafeAreaInsets();
  
  return (
  <View style={[styles.header, { paddingTop: insets.top + 12 }]}>

    {/* Ligne titre + badge */}
    <View style={styles.titleRow}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backBtn}
          accessibilityRole="button" accessibilityLabel="Retour">
          <Icon name="arrow-left" size={20} color={CA_THEME.white} />
        </Pressable>
      )}

      {/* Logo CA + titre */}
      <View style={styles.logoGroup}>
        <View style={styles.caSquare} aria-hidden>
          <Text style={styles.caText}>CA</Text>
        </View>
        <Text style={styles.title}>Articles</Text>
      </View>

      {/* Bouton Vue Grille / Liste */}
      {onToggleView && (
        <Pressable onPress={onToggleView} style={styles.viewToggleBtn}
          accessibilityRole="button" accessibilityLabel="Changer de vue">
          <Icon name={isGridView ? "view-list" : "view-grid"} size={18} color={CA_THEME.white} />
        </Pressable>
      )}

      {/* Badge compteur total */}
      <View style={styles.countBadge} accessibilityLabel={`${totalCount} articles`}>
        <Text style={styles.countText}>{totalCount} articles</Text>
      </View>
    </View>

    {/* Indicateur de synchronisation */}
    <View style={styles.syncRow}>
      <View style={styles.syncDot} aria-hidden />
      <Text style={styles.syncText}>
        Mis à jour {formatRelativeTime(lastSyncedAt)}
      </Text>
    </View>

    {/* Bande tricolore CA */}
    <View style={styles.triband} aria-hidden>
      <View style={[styles.tribandStripe, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.tribandStripe, { backgroundColor: CA_THEME.greenLight }]} />
      <View style={[styles.tribandStripe, { backgroundColor: CA_THEME.greenDark }]} />
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
    marginBottom:   8,
    gap:            10,
  },
  backBtn: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  caSquare: {
    width: 34, height: 27, borderRadius: 3,
    backgroundColor: CA_THEME.white,
    alignItems: 'center', justifyContent: 'center',
  },
  caText: {
    fontSize: 11, fontWeight: '900',
    color: CA_THEME.green, letterSpacing: -0.5,
  },
  title: { fontSize: 20, fontWeight: '700', color: CA_THEME.white },
  countBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius:      20,
    backgroundColor:   'rgba(255,255,255,0.18)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.38)',
  },
  viewToggleBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 'auto',
  },
  countText: { fontSize: 11, fontWeight: '600', color: CA_THEME.white },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: CA_THEME.greenLight,
  },
  syncText: { fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  triband: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, flexDirection: 'row',
  },
  tribandStripe: { flex: 1, height: '100%' },
});
