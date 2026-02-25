// ============================================
// TERMS SCREEN - Premium Design
// IT-Inventory Application — Conditions d'Utilisation
// ============================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Vibration,
  LayoutChangeEvent,
  Dimensions,
  Platform,
} from 'react-native';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  TERMS_VERSION,
  TERMS_LAST_UPDATE,
  TERMS_SECTIONS,
  TermsSection as TermsSectionData,
} from '@/constants/termsContent';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== HELPERS ====================
const formatDate = (dateStr: string): string => {
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
};

// ==================== SECTION COMPONENT ====================
interface SectionProps {
  number: number;
  section: TermsSectionData;
  defaultExpanded: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}

const CollapsibleSection: React.FC<SectionProps> = React.memo(
  ({ number, section, defaultExpanded, onLayout }) => {
    const { colors, isDark } = useTheme();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rotation = useSharedValue(defaultExpanded ? 1 : 0);

    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    }));

    const toggle = useCallback(() => {
      Vibration.vibrate(10);
      const next = !expanded;
      setExpanded(next);
      rotation.value = withTiming(next ? 1 : 0, {
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, [expanded, rotation]);

    return (
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]} onLayout={onLayout}>
        {/* Section Header */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionNumberBadge, { backgroundColor: isDark ? colors.primaryGlow : 'rgba(37, 99, 235, 0.08)' }]}>
              <Text style={[styles.sectionNumberText, { color: colors.secondary }]}>{number}</Text>
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {section.title}
              </Text>
            </View>
          </View>
          <Animated.View style={chevronStyle}>
            <Icon name="chevron-down" size={22} color={colors.textMuted} />
          </Animated.View>
        </TouchableOpacity>

        {/* Section Content */}
        {expanded && (
          <Animated.View
            entering={FadeIn.duration(250)}
            style={styles.sectionContent}
          >
            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
            {section.content.split('\n\n').map((paragraph, idx) => (
              <Text
                key={idx}
                style={[
                  styles.sectionText,
                  { color: colors.textSecondary },
                  paragraph.endsWith(':') && [styles.sectionTextBold, { color: colors.textPrimary }],
                  paragraph.startsWith('•') && styles.sectionTextBullet,
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
export const TermsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const requireAcceptance = route.params?.requireAcceptance ?? false;
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  // TOC
  const [tocExpanded, setTocExpanded] = useState(true);
  const tocRotation = useSharedValue(1);
  const tocChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(tocRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  // Acceptance
  const [accepted, setAccepted] = useState(false);

  // === Handlers ===
  const handleBack = useCallback(() => {
    Vibration.vibrate(10);
    navigation.goBack();
  }, [navigation]);

  const toggleToc = useCallback(() => {
    Vibration.vibrate(10);
    const next = !tocExpanded;
    setTocExpanded(next);
    tocRotation.value = withTiming(next ? 1 : 0, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [tocExpanded, tocRotation]);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      Vibration.vibrate(10);
      const y = sectionPositions.current[sectionId];
      if (y !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: y - 16, animated: true });
      }
    },
    [],
  );

  const handleSectionLayout = useCallback(
    (sectionId: string) => (e: LayoutChangeEvent) => {
      sectionPositions.current[sectionId] = e.nativeEvent.layout.y;
    },
    [],
  );

  const handleAccept = useCallback(() => {
    if (!accepted) return;
    Vibration.vibrate([0, 20, 40, 20]);
    navigation.goBack();
  }, [accepted, navigation]);

  const toggleAccepted = useCallback(() => {
    Vibration.vibrate(10);
    setAccepted(prev => !prev);
  }, []);

  // ==================== RENDER ====================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* ===== HEADER PREMIUM ===== */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Cercles décoratifs */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerCircle3} />

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

          <View style={styles.headerBadge}>
            <Icon name="file-document-check-outline" size={14} color="#FFF" />
            <Text style={styles.headerBadgeText}>v{TERMS_VERSION}</Text>
          </View>
        </View>

        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerIconCircle}>
            <Icon name="scale-balance" size={28} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
          <Text style={styles.headerSubtitle}>
            Dernière mise à jour : {formatDate(TERMS_LAST_UPDATE)}
          </Text>
        </View>
      </LinearGradient>

      {/* ===== CONTENT ===== */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' } : undefined,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ===== TABLE DES MATIERES ===== */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={[styles.tocCard, { backgroundColor: colors.surface }]}
        >
          {/* TOC Header */}
          <TouchableOpacity
            style={styles.tocHeader}
            onPress={toggleToc}
            activeOpacity={0.7}
          >
            <View style={styles.tocHeaderLeft}>
              <View style={[styles.tocIconCircle, { backgroundColor: isDark ? colors.primaryGlow : 'rgba(37, 99, 235, 0.08)' }]}>
                <Icon name="format-list-numbered" size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.tocTitle, { color: colors.textPrimary }]}>Table des matières</Text>
            </View>
            <Animated.View style={tocChevronStyle}>
              <Icon name="chevron-down" size={22} color={colors.textMuted} />
            </Animated.View>
          </TouchableOpacity>

          {/* TOC Items */}
          {tocExpanded && (
            <Animated.View entering={FadeIn.duration(200)}>
              {TERMS_SECTIONS.map((section, index) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.tocItem,
                    index < TERMS_SECTIONS.length - 1 && [styles.tocItemBorder, { borderBottomColor: colors.divider }],
                  ]}
                  onPress={() => scrollToSection(section.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.tocItemLeft}>
                    <View style={[styles.tocItemDot, { backgroundColor: isDark ? colors.primaryGlow : 'rgba(37, 99, 235, 0.08)' }]}>
                      <Text style={[styles.tocItemNumber, { color: colors.secondary }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.tocItemTitle, { color: colors.textSecondary }]}>{section.title}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {/* ===== SECTIONS ===== */}
        {TERMS_SECTIONS.map((section, index) => (
          <Animated.View
            key={section.id}
            entering={FadeInUp.delay(200 + index * 60).duration(400)}
          >
            <CollapsibleSection
              number={index + 1}
              section={section}
              defaultExpanded={index === 0}
              onLayout={handleSectionLayout(section.id)}
            />
          </Animated.View>
        ))}

        {/* ===== FOOTER INFO ===== */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(400)}
          style={styles.footerInfo}
        >
          <View style={styles.footerInfoRow}>
            <Icon name="information-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.footerInfoText, { color: colors.textMuted }]}>
              IT-Inventory — Version {TERMS_VERSION}
            </Text>
          </View>
          <Text style={[styles.footerInfoSubtext, { color: colors.textMuted }]}>
            © {new Date().getFullYear()} IT-Inventory SAS. Tous droits réservés.
          </Text>
        </Animated.View>

        {/* Spacer pour footer fixe */}
        {requireAcceptance && <View style={{ height: 140 }} />}
      </ScrollView>

      {/* ===== FOOTER ACCEPTATION ===== */}
      {requireAcceptance && (
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={[styles.acceptFooter, { backgroundColor: colors.surface }]}
        >
          <View style={styles.acceptFooterInner}>
            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={toggleAccepted}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.borderStrong, backgroundColor: colors.surfaceInput },
                  accepted && styles.checkboxChecked,
                ]}
              >
                {accepted && (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.checkboxGradient}
                    >
                      <Icon name="check" size={16} color="#FFF" />
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                J'ai lu et j'accepte les conditions d'utilisation
              </Text>
            </TouchableOpacity>

            {/* Bouton Accepter */}
            <TouchableOpacity
              activeOpacity={accepted ? 0.8 : 1}
              onPress={handleAccept}
              disabled={!accepted}
            >
              <LinearGradient
                colors={accepted ? ['#3B82F6', '#1D4ED8'] : ['#D1D5DB', '#9CA3AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.acceptButton,
                  !accepted && styles.acceptButtonDisabled,
                ]}
              >
                <Icon
                  name="check-circle-outline"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.acceptButtonText}>
                  Accepter et continuer
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
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
  headerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  headerCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: -30,
  },
  headerCircle3: {
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
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
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

  // === Table des matières ===
  tocCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
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
  tocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tocHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tocIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tocTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  tocItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tocItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  tocItemDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tocItemNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  tocItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // === Section Card ===
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  sectionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'justify',
  },
  sectionTextBold: {
    fontWeight: '600',
    fontSize: 14.5,
    marginTop: 4,
  },
  sectionTextBullet: {
    paddingLeft: 4,
  },

  // === Footer Info ===
  footerInfo: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  footerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerInfoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerInfoSubtext: {
    fontSize: 12,
    marginTop: 4,
  },

  // === Footer Acceptation ===
  acceptFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  acceptFooterInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 36,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  checkboxGradient: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default TermsScreen;
