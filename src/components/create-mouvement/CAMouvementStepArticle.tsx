import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

interface Article {
  id: string;
  reference: string;
  label: string;
  stock_actuel: number;
}

interface CAMouvementStepArticleProps {
  onScan:         () => void;
  onManualSearch: (query: string) => void;
  searchQuery:    string;
  searchResults:  Article[];
  onSelectArticle:(article: Article) => void;
}

export const CAMouvementStepArticle = ({
  onScan, onManualSearch, searchQuery, searchResults, onSelectArticle,
}: CAMouvementStepArticleProps) => (
  <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

    {/* Zone de scan principale */}
    <Pressable onPress={onScan} style={styles.scanZone}
      accessibilityRole="button" accessibilityLabel="Appuyez pour scanner un code-barres">
      <View style={styles.scanIconWrap} aria-hidden>
        <Icon name="barcode-scan" size={32} color={CA_THEME.white} />
      </View>
      <Text style={styles.scanTitle}>Appuyez pour scanner</Text>
      <Text style={styles.scanSub}>Ou recherchez manuellement ci-dessous</Text>
    </Pressable>

    {/* Séparateur OU */}
    <View style={styles.orRow} aria-hidden>
      <View style={styles.orLine} />
      <View style={styles.orPill}><Text style={styles.orText}>OU</Text></View>
      <View style={styles.orLine} />
    </View>

    {/* Recherche manuelle */}
    <View>
      <View style={styles.sectionLabel}>
        <View style={styles.sectionBar} aria-hidden />
        <Text style={styles.sectionLabelText}>Code-barres / Référence</Text>
      </View>
      <View style={styles.searchWrap}>
        <Icon name="magnify" size={16} color={CA_THEME.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={onManualSearch}
          placeholder="Entrez la référence..."
          placeholderTextColor={CA_THEME.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel="Rechercher un article par référence"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onManualSearch('')} hitSlop={8}
            accessibilityRole="button" accessibilityLabel="Effacer">
            <Icon name="close" size={15} color={CA_THEME.textMuted} />
          </Pressable>
        )}
      </View>
    </View>

    {/* Résultats de recherche */}
    {searchResults.length > 0 && (
      <View style={styles.results}>
        {searchResults.map(art => (
          <Pressable key={art.id} onPress={() => onSelectArticle(art)}
            style={styles.resultRow}
            accessibilityRole="button" accessibilityLabel={`Sélectionner ${art.label}`}>
            <View style={styles.resultIconWrap}>
              <Icon name="package-variant-closed" size={16} color={CA_THEME.textMuted} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{art.label}</Text>
              <Text style={styles.resultRef}>{art.reference} · Stock : {art.stock_actuel}</Text>
            </View>
            <Icon name="chevron-right" size={15} color={CA_THEME.textMuted} />
          </Pressable>
        ))}
      </View>
    )}

  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: { padding: 12, gap: 12 },
  scanZone: {
    backgroundColor: CA_THEME.greenBg,
    borderRadius:    12,
    borderWidth:     2,
    borderColor:     CA_THEME.greenBg2,
    borderStyle:     'dashed',
    padding:         24,
    alignItems:      'center',
    gap:             10,
  },
  scanIconWrap: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: CA_THEME.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    elevation: 4,
    shadowColor: CA_THEME.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  scanTitle:  { fontSize: 16, fontWeight: '700', color: CA_THEME.green },
  scanSub:    { fontSize: 12, color: CA_THEME.textSecondary, textAlign: 'center' },
  orRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine:     { flex: 1, height: 1, backgroundColor: CA_THEME.borderGray },
  orPill: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, backgroundColor: CA_THEME.lightGray,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
  },
  orText:      { fontSize: 11, fontWeight: '600', color: CA_THEME.textMuted },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  sectionBar:   { width: 3, height: 12, backgroundColor: CA_THEME.green },
  sectionLabelText: {
    fontSize: 11, fontWeight: '700', color: CA_THEME.green,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: CA_THEME.white,
    borderRadius: 9, borderWidth: 1, borderColor: CA_THEME.borderGray,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: CA_THEME.textPrimary, padding: 0 },
  results: {
    backgroundColor: CA_THEME.white, borderRadius: 10,
    borderWidth: 1, borderColor: CA_THEME.borderGray, overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 11, borderBottomWidth: 1, borderBottomColor: CA_THEME.borderGray,
  },
  resultIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: CA_THEME.lightGray, borderWidth: 1, borderColor: CA_THEME.borderGray,
    alignItems: 'center', justifyContent: 'center',
  },
  resultInfo:  { flex: 1, minWidth: 0 },
  resultName:  { fontSize: 13, fontWeight: '600', color: CA_THEME.textPrimary },
  resultRef:   { fontSize: 10, color: CA_THEME.textMuted, marginTop: 1 },
});
