// ============================================
// ARTICLE DETAIL SCREEN - Premium Design
// IT-Inventory Application
// ============================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Vibration,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store';
import { articleRepository, mouvementRepository, stockRepository } from '@/database';
import { formatTimeParis, formatRelativeDateParis } from '@/utils/dateUtils';
import { exportArticleDetail } from '@/utils/csv';
import { Article, Mouvement, StockSite } from '@/types';
import { useResponsive } from '@/utils/responsive';
import { useTheme } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ==================== HELPERS ====================
const AVATAR_GRADIENTS = [
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#6366F1'],
  ['#EC4899', '#F472B6'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FBBF24'],
  ['#06B6D4', '#22D3EE'],
  ['#EF4444', '#F87171'],
];

const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatTime = (date: Date) => formatTimeParis(date);
const formatRelDate = (date: Date) => formatRelativeDateParis(date);

const TYPE_CFG: Record<string, { icon: string; color: string; label: string; prefix: string }> = {
  entree: { icon: 'arrow-up-bold', color: '#10B981', label: 'Entrée', prefix: '+' },
  sortie: { icon: 'arrow-down-bold', color: '#EF4444', label: 'Sortie', prefix: '-' },
  ajustement: { icon: 'swap-vertical', color: '#F59E0B', label: 'Ajustement', prefix: '' },
  transfert_depart: { icon: 'arrow-right-bold', color: '#8B5CF6', label: 'Transfert ↗', prefix: '-' },
  transfert_arrivee: { icon: 'arrow-left-bold', color: '#8B5CF6', label: 'Transfert ↙', prefix: '+' },
};

// ==================== MAIN ====================
export const ArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { articleId } = route.params;
  const siteActif = useAppSelector(state => state.site.siteActif);
  const { isTablet, contentMaxWidth } = useResponsive();
  const { colors, isDark, theme } = useTheme();
  const { gradients } = theme;

  const [article, setArticle] = useState<Article | null>(null);
  const [historique, setHistorique] = useState<Mouvement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!articleId || !siteActif) return;
    setIsLoading(true);
    try {
      const [art, hist] = await Promise.all([
        articleRepository.findById(articleId, siteActif.id),
        mouvementRepository.findByArticle(articleId, siteActif.id, 10),
      ]);
      setArticle(art);
      setHistorique(hist);
    } catch (error) {
      console.error('Erreur chargement article:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, siteActif]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Computed
  const stockActuel = article?.quantiteActuelle ?? 0;
  const isLowStock = article ? stockActuel < article.stockMini : false;
  const isCritical = article ? stockActuel === 0 && article.stockMini > 0 : false;
  const gradient = useMemo(() => getGradient(article?.nom ?? 'A'), [article?.nom]);

  // Navigation
  const handleMouvement = (type: 'entree' | 'sortie') => {
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', { screen: 'MouvementForm', params: { articleId, type } });
  };
  const handleTransfert = () => {
    Vibration.vibrate(10);
    navigation.navigate('Mouvements', { screen: 'TransfertForm', params: { articleId } });
  };
  const handleEdit = () => {
    Vibration.vibrate(10);
    navigation.navigate('ArticleEdit', { articleId });
  };

  const handleExportCSV = useCallback(async () => {
    if (!article || !siteActif) return;
    Vibration.vibrate(10);
    setExporting(true);
    try {
      const filepath = await exportArticleDetail(article, historique, siteActif.nom);
      const dirName = filepath.split('/').slice(-2, -1)[0] || 'Téléchargements';
      Alert.alert(
        'Export réussi',
        `Fichier enregistré dans ${dirName}.\n\n${filepath.split('/').pop() ?? ''}`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'exporter : ${(error as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [article, historique, siteActif]);

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>Chargement...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Icon name="package-variant-closed-remove" size={56} color={colors.textMuted} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 15 }}>Article non trouvé</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ paddingBottom: 40 }, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}>
        {/* ===== HEADER IMMERSIF ===== */}
        <LinearGradient colors={gradient} style={styles.header}>
          {/* Back + Edit */}
          <View style={styles.headerNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => { Vibration.vibrate(10); navigation.goBack(); }}>
              <Icon name="arrow-left" size={22} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={handleEdit}>
              <Icon name="pencil-outline" size={22} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>

          {/* Photo / Avatar */}
          <Animated.View entering={ZoomIn.delay(150).duration(400)} style={styles.avatarWrapper}>
            {article.photoUrl ? (
              <Image source={{ uri: article.photoUrl }} style={[styles.avatarImg, { borderColor: colors.textOnPrimary }]} />
            ) : (
              <View style={[styles.avatarFallback, { borderColor: colors.textOnPrimary }]}>
                <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>{getInitials(article.nom)}</Text>
              </View>
            )}
            {/* Stock badge */}
            <View style={[styles.stockDot, {
              backgroundColor: isCritical ? colors.danger : isLowStock ? colors.warning : colors.success,
              borderColor: colors.surface,
            }]}>
              <Icon
                name={isCritical ? 'close' : isLowStock ? 'alert' : 'check'}
                size={14}
                color={colors.textOnPrimary}
              />
            </View>
          </Animated.View>

          {/* Ref + Name */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.headerInfo}>
            <View style={styles.refBadge}>
              <Icon name="barcode" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.refText}>{article.reference}</Text>
            </View>
            <Text style={[styles.headerName, { color: colors.textOnPrimary }]} numberOfLines={2}>{article.nom}</Text>
            {article.categorieNom ? (
              <View style={styles.catBadge}>
                <Icon name="folder-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.catText}>{article.categorieNom}</Text>
              </View>
            ) : null}
          </Animated.View>
        </LinearGradient>

        {/* ===== QUICK STATS ===== */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.infoBg }]}>
              <Icon name="package-variant" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.statValue, {
              color: isCritical ? colors.danger : isLowStock ? colors.warning : colors.textPrimary,
            }]}>{stockActuel}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Stock actuel</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningBg }]}>
              <Icon name="alert-circle-outline" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{article.stockMini}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Stock minimum</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.mouvementTransfert}14` }]}>
              <Icon name="swap-vertical" size={20} color={colors.mouvementTransfert} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{historique.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mouvements</Text>
          </View>
        </Animated.View>

        {/* ===== ALERTE STOCK ===== */}
        {isLowStock && (
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.alertWrapper}>
            <LinearGradient
              colors={isCritical ? gradients.danger : gradients.warning}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.alertCard}
            >
              <Icon name={isCritical ? 'alert-octagon' : 'alert'} size={24} color={colors.textOnPrimary} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: colors.textOnPrimary }]}>
                  {isCritical ? 'Stock critique !' : 'Stock inférieur au minimum'}
                </Text>
                <Text style={styles.alertSub}>
                  {isCritical
                    ? `Aucune unité en stock. Seuil : ${article.stockMini}`
                    : `Il reste ${stockActuel} unité(s). Seuil : ${article.stockMini}`}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ===== INFORMATIONS ===== */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Informations</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Référence</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{article.reference}</Text>
            </View>
            {article.codeFamille ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Code famille</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.badge }]}>
                  <Icon name="tag-outline" size={13} color={colors.primary} />
                  <Text style={[styles.infoTagText, { color: colors.primary }]}>{article.codeFamille}</Text>
                </View>
              </View>
            ) : null}
            {article.famille ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Famille</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: `${colors.mouvementTransfert}1A` }]}>
                  <Icon name="shape-outline" size={13} color={colors.mouvementTransfert} />
                  <Text style={[styles.infoTagText, { color: colors.mouvementTransfert }]}>{article.famille}</Text>
                </View>
              </View>
            ) : null}
            {article.typeArticle ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.infoBg }]}>
                  <Icon name="format-list-bulleted-type" size={13} color={colors.info} />
                  <Text style={[styles.infoTagText, { color: colors.info }]}>{article.typeArticle}</Text>
                </View>
              </View>
            ) : null}
            {article.sousType ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sous-type</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.warningBg }]}>
                  <Icon name="tag-text-outline" size={13} color={colors.warning} />
                  <Text style={[styles.infoTagText, { color: colors.warning }]}>{article.sousType}</Text>
                </View>
              </View>
            ) : null}
            {article.marque ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Marque</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.infoBg }]}>
                  <Icon name="domain" size={13} color={colors.secondary} />
                  <Text style={[styles.infoTagText, { color: colors.secondary }]}>{article.marque}</Text>
                </View>
              </View>
            ) : null}
            {article.emplacement ? (
              <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Emplacement</Text>
                <View style={[styles.infoTagBadge, { backgroundColor: colors.successBg }]}>
                  <Icon name="map-marker" size={13} color={colors.success} />
                  <Text style={[styles.infoTagText, { color: colors.success }]}>{article.emplacement}</Text>
                </View>
              </View>
            ) : null}
            <View style={[styles.infoRow, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Site</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{siteActif?.nom ?? '—'}</Text>
            </View>
            {article.description ? (
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]} numberOfLines={3}>
                  {article.description}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* ===== EXPORT CSV ===== */}
        <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.section}>
          <TouchableOpacity
            style={styles.exportTouchable}
            activeOpacity={0.85}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            <LinearGradient
              colors={gradients.primaryHorizontal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exportGradient}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <>
                  <View style={[styles.exportIconCircle, { backgroundColor: colors.surface }]}>
                    <Icon name="file-download-outline" size={28} color={colors.secondary} />
                  </View>
                  <View style={styles.exportTextWrap}>
                    <Text style={[styles.exportTitle, { color: colors.textOnPrimary }]}>Exporter en CSV</Text>
                    <Text style={styles.exportSub}>Fiche article + historique • Enregistré sur le téléphone</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ===== ACTIONS RAPIDES ===== */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]} activeOpacity={0.7} onPress={() => handleMouvement('entree')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.successBg }]}>
                <Icon name="arrow-up-bold-circle-outline" size={28} color={colors.success} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.success }]}>Entrée</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, stockActuel === 0 && { opacity: 0.4 }]}
              activeOpacity={0.7}
              onPress={() => handleMouvement('sortie')}
              disabled={stockActuel === 0}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.dangerBg }]}>
                <Icon name="arrow-down-bold-circle-outline" size={28} color={colors.danger} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>Sortie</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]} activeOpacity={0.7} onPress={handleTransfert}>
              <View style={[styles.actionIcon, { backgroundColor: `${colors.mouvementTransfert}1A` }]}>
                <Icon name="swap-horizontal" size={28} color={colors.mouvementTransfert} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.mouvementTransfert }]}>Transfert</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ===== HISTORIQUE ===== */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Historique</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{historique.length} mouvement{historique.length !== 1 ? 's' : ''}</Text>
          </View>

          {historique.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: colors.surface }]}>
              <Icon name="chart-timeline-variant" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aucun mouvement</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Les mouvements de cet article apparaîtront ici</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {historique.slice(0, 5).map((m, idx) => {
                const cfg = TYPE_CFG[m.type] || TYPE_CFG.entree;
                return (
                  <Animated.View
                    key={m.id}
                    entering={FadeInUp.delay(500 + idx * 60).duration(350)}
                    style={styles.tlItem}
                  >
                    <View style={styles.tlLeft}>
                      <View style={[styles.tlDot, { backgroundColor: cfg.color, borderColor: colors.surface }]} />
                      {idx < Math.min(historique.length, 5) - 1 && (
                        <View style={[styles.tlLine, { backgroundColor: cfg.color + '25' }]} />
                      )}
                    </View>
                    <View style={[styles.tlCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <View style={styles.tlCardTop}>
                        <View style={[styles.tlBadge, { backgroundColor: cfg.color + '12' }]}>
                          <Icon name={cfg.icon} size={14} color={cfg.color} />
                          <Text style={[styles.tlBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={[styles.tlTime, { color: colors.textMuted }]}>{formatTime(new Date(m.dateMouvement))}</Text>
                      </View>
                      <Text style={[styles.tlQty, { color: cfg.color }]}>
                        {cfg.prefix}{Math.abs(m.quantite)} unités
                      </Text>
                      <View style={styles.tlMeta}>
                        <Text style={[styles.tlMetaText, { color: colors.textMuted }]}>
                          {formatRelDate(new Date(m.dateMouvement))}
                        </Text>
                        {m.technicien && (
                          <>
                            <Text style={[styles.tlMetaSep, { color: colors.textMuted }]}>•</Text>
                            <Text style={[styles.tlMetaText, { color: colors.textMuted }]}>
                              {m.technicien.prenom} {m.technicien.nom?.charAt(0)}.
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ===== HEADER =====
  header: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 4,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  stockDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  refText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },

  // ===== STATS =====
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },

  // ===== ALERT =====
  alertWrapper: { marginHorizontal: 16, marginTop: 16 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  // ===== EXPORT CSV =====
  exportTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  exportIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextWrap: { flex: 1, justifyContent: 'center' },
  exportTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  exportSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '500',
  },

  // ===== SECTIONS =====
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionCount: { fontSize: 12, fontWeight: '500' },

  // ===== INFO CARD =====
  infoCard: {
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '500' },
  infoCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoCatText: { fontSize: 13, fontWeight: '600' },
  infoTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoTagText: { fontSize: 13, fontWeight: '600' },

  // ===== ACTIONS =====
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: { fontSize: 13, fontWeight: '600' },

  // ===== EMPTY =====
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 36,
    borderRadius: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },

  // ===== TIMELINE =====
  timeline: { paddingLeft: 4 },
  tlItem: { flexDirection: 'row', marginBottom: 4 },
  tlLeft: { width: 24, alignItems: 'center' },
  tlDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tlLine: { flex: 1, width: 2, borderRadius: 1, marginTop: 2 },
  tlCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    borderWidth: 1,
  },
  tlCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tlBadgeText: { fontSize: 11, fontWeight: '600' },
  tlTime: { fontSize: 11 },
  tlQty: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tlMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tlMetaText: { fontSize: 11 },
  tlMetaSep: { fontSize: 11 },
});

export default ArticleDetailScreen;
