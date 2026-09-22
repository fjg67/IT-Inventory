import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';
import { Image } from 'react-native';

interface Article {
  id: string;
  reference: string;
  label: string;
  stock_actuel: number;
  imageUrl?: string | null;
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
}: CAMouvementStepArticleProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation de pulsation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.2);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [pulseOpacity, pulseScale]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
  <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

    {/* Zone de scan principale */}
    <Pressable onPress={onScan} style={styles.scanZone}
      accessibilityRole="button" accessibilityLabel="Appuyez pour scanner un code-barres">
      
      <View style={styles.scanIconContainer}>
        {/* Cercles de pulsation */}
        <Animated.View style={[styles.pulseCircle, animatedPulseStyle]} />
        <View style={styles.scanIconWrap} aria-hidden>
          <Icon name="barcode-scan" size={36} color={CA_THEME.white} />
        </View>
      </View>
      
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={styles.scanTitle}>Scanner l'article</Text>
        <Text style={styles.scanSub}>Utilisez l'appareil photo pour identifier rapidement un équipement</Text>
      </View>
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
      <View style={[styles.searchWrap, isFocused ? styles.searchWrapFocused : {}]}>
        <Icon name="magnify" size={18} color={isFocused ? CA_THEME.green : CA_THEME.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={onManualSearch}
          placeholder="Entrez la référence..."
          placeholderTextColor={CA_THEME.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
        <View style={styles.resultsHeader}>
          <View style={styles.resultsTitleWrap}>
            <View style={styles.resultsAccent} />
            <Text style={styles.resultsTitle}>Articles trouvés</Text>
          </View>
          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>{searchResults.length}</Text>
          </View>
        </View>
        {searchResults.map(art => (
          <Pressable key={art.id} onPress={() => onSelectArticle(art)}
            style={styles.resultRow}
            accessibilityRole="button" accessibilityLabel={`Sélectionner ${art.label}`}>
            <View style={styles.resultIconWrap}>
              {art.imageUrl ? (
                <Image source={{ uri: art.imageUrl }} style={styles.resultImage} resizeMode="cover" />
              ) : (
                <Icon name="package-variant-closed" size={16} color={CA_THEME.textMuted} />
              )}
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={1}>{art.label}</Text>
              <View style={styles.resultMeta}>
                <View style={styles.referenceWrap}>
                  <Icon name="barcode" size={12} color={CA_THEME.green} />
                  <Text style={styles.resultRef}>{art.reference}</Text>
                </View>
                <View style={styles.resultStock}>
                  <Text style={styles.resultStockLabel}>Stock</Text>
                  <Text style={styles.resultStockValue}>{art.stock_actuel}</Text>
                </View>
              </View>
            </View>
            <View style={styles.resultArrow}>
              <Icon name="arrow-right" size={15} color={CA_THEME.green} />
            </View>
          </Pressable>
        ))}
      </View>
    )}
  </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, paddingBottom: 120 },
  scanZone: {
    backgroundColor: CA_THEME.white,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     CA_THEME.borderGray,
    padding:         32,
    alignItems:      'center',
    gap:             16,
    overflow:        'hidden',
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
  },
  scanIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100, height: 100,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: CA_THEME.green,
  },
  scanIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: CA_THEME.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    elevation: 8,
    shadowColor: CA_THEME.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  scanTitle:  { fontSize: 18, fontWeight: '800', color: CA_THEME.green },
  scanSub:    { fontSize: 13, color: CA_THEME.textSecondary, textAlign: 'center', maxWidth: '80%' },
  orRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  orLine:     { flex: 1, height: 1, backgroundColor: CA_THEME.borderGray },
  orPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: CA_THEME.white,
    borderWidth: 1, borderColor: CA_THEME.borderGray,
  },
  orText:      { fontSize: 12, fontWeight: '700', color: CA_THEME.textMuted },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  sectionBar:   { width: 3, height: 12, backgroundColor: CA_THEME.green },
  sectionLabelText: {
    fontSize: 11, fontWeight: '700', color: CA_THEME.green,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CA_THEME.white,
    borderRadius: 16, borderWidth: 1, borderColor: CA_THEME.borderGray,
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  searchWrapFocused: {
    borderColor: CA_THEME.green,
    shadowColor: CA_THEME.green,
    shadowOpacity: 0.1,
  },
  searchInput: { flex: 1, fontSize: 15, color: CA_THEME.textPrimary, padding: 0, fontWeight: '500' },
  results: {
    backgroundColor: CA_THEME.white, borderRadius: 18,
    borderWidth: 1, borderColor: '#CFE5D9', overflow: 'hidden',
    elevation: 5,
    shadowColor: CA_THEME.greenDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#F3FAF6', borderBottomWidth: 1, borderBottomColor: '#DCEDE3' },
  resultsTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultsAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: CA_THEME.green },
  resultsTitle: { color: CA_THEME.greenText, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  resultsCount: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: CA_THEME.green, alignItems: 'center', justifyContent: 'center' },
  resultsCountText: { color: CA_THEME.white, fontSize: 11, fontWeight: '800' },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    minHeight: 84, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E7ECE9',
  },
  resultIconWrap: {
    width: 50, height: 50, borderRadius: 13,
    backgroundColor: '#F4F7F5', borderWidth: 1, borderColor: '#D9EAE0',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  resultImage: {
    width: '100%', height: '100%',
  },
  resultInfo:  { flex: 1, minWidth: 0, gap: 7 },
  resultName:  { fontSize: 15, fontWeight: '800', color: CA_THEME.textPrimary },
  resultMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  referenceWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 },
  resultRef:   { fontSize: 11, color: CA_THEME.textMuted, fontWeight: '600' },
  resultStock: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: CA_THEME.greenBg },
  resultStockLabel: { fontSize: 10, color: CA_THEME.greenText, fontWeight: '600' },
  resultStockValue: { fontSize: 12, color: CA_THEME.green, fontWeight: '800' },
  resultArrow: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#E8F5EF', alignItems: 'center', justifyContent: 'center' },
});
