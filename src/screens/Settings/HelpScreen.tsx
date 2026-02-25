// ============================================
// HELP & SUPPORT SCREEN - Premium Design
// IT-Inventory Application — Aide et Support
// ============================================

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Vibration,
  Linking,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { isTablet as checkIsTablet, getContentMaxWidth } from '@/utils/responsive';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  FAQItem,
  FAQCategory,
  searchFAQ,
  getFAQByCategory,
  getPopularFAQ,
} from '@/constants/faqContent';
import debounce from 'lodash/debounce';
import { useTheme } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SUPPORT_EMAIL = 'Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr';

// ==================== FAQ ACCORDION ====================
interface FAQAccordionProps {
  item: FAQItem;
  expanded: boolean;
  onToggle: () => void;
}

const FAQAccordion: React.FC<FAQAccordionProps> = React.memo(
  ({ item, expanded, onToggle }) => {
    const { colors } = useTheme();
    const rotation = useSharedValue(expanded ? 1 : 0);

    React.useEffect(() => {
      rotation.value = withTiming(expanded ? 1 : 0, {
        duration: 250,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, [expanded, rotation]);

    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    }));

    return (
      <View style={[styles.faqCard, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => {
            Vibration.vibrate(10);
            onToggle();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.faqQuestion, { color: colors.textSecondary }, expanded && { fontWeight: '600', color: colors.textPrimary }]}>
            {item.question}
          </Text>
          <Animated.View style={chevronStyle}>
            <Icon name="chevron-down" size={22} color={colors.textMuted} />
          </Animated.View>
        </TouchableOpacity>

        {expanded && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.faqContent}>
            <View style={[styles.faqDivider, { backgroundColor: colors.divider }]} />
            {item.answer.split('\n\n').map((paragraph, idx) => (
              <Text
                key={idx}
                style={[
                  styles.faqAnswer,
                  { color: colors.textSecondary },
                  paragraph.endsWith(':') && { fontWeight: '600', color: colors.textPrimary },
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </Animated.View>
        )}
      </View>
    );
  },
);

// ==================== MAIN SCREEN ====================
export const HelpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isConnected, supabaseReachable } = useAppSelector(state => state.network);
  const { colors, isDark } = useTheme();

  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  const contentMaxWidth = getContentMaxWidth(width);

  const scrollViewRef = useRef<ScrollView>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FAQItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  // FAQ
  const [expandedFAQId, setExpandedFAQId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const popularFAQ = useMemo(() => getPopularFAQ(), []);

  const displayedFAQ = useMemo(() => {
    if (selectedCategory) return getFAQByCategory(selectedCategory);
    return popularFAQ;
  }, [selectedCategory, popularFAQ]);

  const selectedCategoryData = useMemo(
    () => FAQ_CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory],
  );

  // Search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (query.length < 2) {
          setSearchResults([]);
          setShowResults(false);
          return;
        }
        const results = searchFAQ(query);
        setSearchResults(results);
        setShowResults(true);
      }, 250),
    [],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      debouncedSearch(text);
    },
    [debouncedSearch],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, []);

  const handleBack = useCallback(() => {
    Vibration.vibrate(10);
    navigation.goBack();
  }, [navigation]);

  const handleCategoryPress = useCallback((catId: string) => {
    Vibration.vibrate(10);
    setSelectedCategory(prev => (prev === catId ? null : catId));
    setExpandedFAQId(null);
  }, []);

  const handleFAQToggle = useCallback((itemId: string) => {
    setExpandedFAQId(prev => (prev === itemId ? null : itemId));
  }, []);

  const handleEmailPress = useCallback(() => {
    Vibration.vibrate(10);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support IT-Inventory`);
  }, []);

  const handleSearchResultPress = useCallback((item: FAQItem) => {
    setShowResults(false);
    setSearchQuery('');
    setSelectedCategory(item.category);
    setExpandedFAQId(item.id);
  }, []);

  // ==================== RENDER ====================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Cercles décoratifs */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Top Bar */}
        <View style={styles.headerTopBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Icon name="arrow-left" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerIconCircle}>
            <Icon name="lifebuoy" size={30} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Aide et Support</Text>
          <Text style={styles.headerSubtitle}>
            Comment pouvons-nous vous aider ?
          </Text>
        </View>
      </LinearGradient>

      {/* ===== CONTENT ===== */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, tablet && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== SEARCH BAR ===== */}
        <Animated.View
          entering={FadeInUp.delay(50).duration(350)}
          style={styles.searchContainer}
        >
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Icon name="magnify" size={22} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Rechercher dans l'aide..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.searchResultsCard, { backgroundColor: colors.surface }]}>
              {searchResults.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.searchResultItem,
                    idx < searchResults.length - 1 && [styles.searchResultBorder, { borderBottomColor: colors.borderSubtle }],
                  ]}
                  onPress={() => handleSearchResultPress(item)}
                  activeOpacity={0.6}
                >
                  <Icon name="help-circle-outline" size={18} color={colors.primary} />
                  <Text style={[styles.searchResultText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.question}
                  </Text>
                  <Icon name="chevron-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.searchResultsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.noResultsContainer}>
                <Icon name="magnify-close" size={28} color={colors.textMuted} />
                <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>Aucun résultat trouvé</Text>
                <Text style={[styles.noResultsHint, { color: colors.textMuted }]}>Essayez d'autres mots-clés</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* ===== QUICK ACTIONS ===== */}
        <Animated.View entering={FadeInUp.delay(120).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Actions rapides</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => {
                Vibration.vibrate(10);
                handleCategoryPress('getting_started');
              }}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <Icon name="rocket-launch-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Guide de{'\n'}démarrage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => {
                Vibration.vibrate(10);
                handleCategoryPress('features');
              }}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                <Icon name="cog-outline" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Toutes les{'\n'}fonctions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => {
                Vibration.vibrate(10);
                handleEmailPress();
              }}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Icon name="email-fast-outline" size={24} color="#10B981" />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Nous{'\n'}contacter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => {
                Vibration.vibrate(10);
                handleCategoryPress('troubleshooting');
              }}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <Icon name="bug-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Résoudre{'\n'}un problème</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ===== CATEGORIES ===== */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Questions par catégorie</Text>
          {FAQ_CATEGORIES.map((cat, idx) => {
            const count = FAQ_ITEMS.filter(i => i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  { borderLeftColor: cat.color, backgroundColor: colors.surface },
                  isSelected && { borderLeftWidth: 5, backgroundColor: `${cat.color}08` },
                ]}
                onPress={() => handleCategoryPress(cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}15` }]}>
                  <Icon name={cat.icon} size={22} color={cat.color} />
                </View>
                <View style={styles.categoryTextCol}>
                  <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>{cat.title}</Text>
                  <Text style={[styles.categoryDesc, { color: colors.textMuted }]}>{cat.description}</Text>
                </View>
                <View style={styles.categoryRight}>
                  <View style={[styles.countBadge, { backgroundColor: `${cat.color}15` }]}>
                    <Text style={[styles.countText, { color: cat.color }]}>{count}</Text>
                  </View>
                  <Icon
                    name={isSelected ? 'chevron-up' : 'chevron-right'}
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ===== FAQ SECTION ===== */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>
            {selectedCategoryData
              ? `${selectedCategoryData.title} — Questions`
              : 'Questions populaires'}
          </Text>
          {selectedCategory && (
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                Vibration.vibrate(10);
                setSelectedCategory(null);
                setExpandedFAQId(null);
              }}
              activeOpacity={0.7}
            >
              <Icon name="filter-remove-outline" size={16} color={colors.primary} />
              <Text style={[styles.resetFilterText, { color: colors.primary }]}>Voir toutes les questions</Text>
            </TouchableOpacity>
          )}

          {displayedFAQ.map(item => (
            <FAQAccordion
              key={item.id}
              item={item}
              expanded={expandedFAQId === item.id}
              onToggle={() => handleFAQToggle(item.id)}
            />
          ))}
        </Animated.View>

        {/* ===== CONTACT ===== */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Besoin d'aide personnalisée ?</Text>

          {/* Email */}
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface }]}
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <Icon name="email-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Email</Text>
              <Text style={[styles.contactPrimary, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
              <Text style={[styles.contactSecondary, { color: colors.textMuted }]}>Réponse sous 24h</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* ===== SYSTEM STATUS ===== */}
        <Animated.View entering={FadeInUp.delay(480).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Statut du système</Text>
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            {/* Global status */}
            <View style={[
              styles.statusGlobalRow,
              {
                backgroundColor: isConnected && supabaseReachable
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(245,158,11,0.08)',
              },
            ]}>
              <View style={[
                styles.statusDot,
                {
                  backgroundColor: isConnected && supabaseReachable ? '#10B981' : '#F59E0B',
                },
              ]} />
              <Text style={[
                styles.statusGlobalText,
                {
                  color: isConnected && supabaseReachable ? '#059669' : '#D97706',
                },
              ]}>
                {isConnected && supabaseReachable
                  ? 'Tous les services opérationnels'
                  : 'Certains services sont dégradés'}
              </Text>
            </View>

            {/* Service rows */}
            <View style={styles.statusServiceRow}>
              <Text style={[styles.statusServiceLabel, { color: colors.textPrimary }]}>Application</Text>
              <View style={styles.statusServiceRight}>
                <View style={[styles.statusDotSmall, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusServiceStatus, { color: colors.success }]}>
                  Opérationnel
                </Text>
              </View>
            </View>
            <View style={[styles.statusServiceDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statusServiceRow}>
              <Text style={[styles.statusServiceLabel, { color: colors.textPrimary }]}>Réseau</Text>
              <View style={styles.statusServiceRight}>
                <View style={[
                  styles.statusDotSmall,
                  { backgroundColor: isConnected ? colors.success : colors.danger },
                ]} />
                <Text style={[
                  styles.statusServiceStatus,
                  { color: isConnected ? colors.success : colors.danger },
                ]}>
                  {isConnected ? 'Connecté' : 'Hors ligne'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusServiceDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statusServiceRow}>
              <Text style={[styles.statusServiceLabel, { color: colors.textPrimary }]}>Synchronisation</Text>
              <View style={styles.statusServiceRight}>
                <View style={[
                  styles.statusDotSmall,
                  { backgroundColor: supabaseReachable ? colors.success : colors.warning },
                ]} />
                <Text style={[
                  styles.statusServiceStatus,
                  { color: supabaseReachable ? colors.success : colors.warning },
                ]}>
                  {supabaseReachable ? 'Opérationnel' : 'Indisponible'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ===== FOOTER ===== */}
        <Animated.View
          entering={FadeInUp.delay(540).duration(400)}
          style={styles.footerInfo}
        >
          <View style={styles.footerRow}>
            <Icon name="information-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>IT-Inventory — Aide et Support</Text>
          </View>
          <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
            © {new Date().getFullYear()} IT-Inventory. Tous droits réservés.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  // === Container ===
  container: {
    flex: 1,
  },

  // === Header ===
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 52,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: 40,
    left: SCREEN_WIDTH * 0.4,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },

  // === ScrollView ===
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },

  // === Search ===
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchResultsCard: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
    }),
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchResultBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  noResultsHint: {
    fontSize: 13,
  },

  // === Section Title ===
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  // === Quick Actions ===
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  quickCard: {
    width: (SCREEN_WIDTH - 24 - 10) / 2,
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // === Categories ===
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // === Filter Reset ===
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 10,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderRadius: 20,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // === FAQ Accordion ===
  faqCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 21,
  },
  faqQuestionExpanded: {
    fontWeight: '600',
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  faqDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  faqAnswer: {
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 21,
    marginBottom: 8,
  },
  faqAnswerBold: {
    fontWeight: '600',
    marginTop: 4,
  },

  // === Contact ===
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactPrimary: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  contactSecondary: {
    fontSize: 12,
    marginTop: 2,
  },

  // === Status ===
  statusCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  statusGlobalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 14,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusGlobalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusServiceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusServiceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusServiceStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusServiceDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // === Footer ===
  footerInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default HelpScreen;
