// ============================================
// KIT SCREEN - IT-Inventory Application
// Écran de sélection et validation des kits
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import Animated, { FadeInUp, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useAppSelector } from '@/store';
import { getSupabaseClient, tables } from '@/api/supabase';
import { stockRepository, mouvementRepository } from '@/database';
import { KIT_DEFINITIONS, KitDefinition, KitArticle } from '@/constants/kitDefinitions';
import {
  premiumColors,
} from '@/constants/premiumTheme';
import { useResponsive } from '@/utils/responsive';

// ==================== TYPES ====================

interface ResolvedArticle {
  kitArticle: KitArticle;
  articleId: number | null;
  articleNom: string | null;
  articleReference: string | null;
  stockDisponible: number;
  estDisponible: boolean;
}

interface KitAvailability {
  kit: KitDefinition;
  articles: ResolvedArticle[];
  tousDisponibles: boolean;
  loading: boolean;
}

interface ConfirmModalState {
  visible: boolean;
  type: 'confirm' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  articles?: string[];
  onConfirm?: () => void;
  onClose?: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
}

// ==================== MAIN SCREEN ====================

export const KitScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const { isTablet, contentMaxWidth } = useResponsive();

  // State
  const [selectedKit, setSelectedKit] = useState<KitDefinition | null>(null);
  const [kitAvailability, setKitAvailability] = useState<KitAvailability | null>(null);
  const [loadingKit, setLoadingKit] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    visible: false,
    type: 'confirm',
    title: '',
    message: '',
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // ===== Vérifier la disponibilité d'un kit =====
  const checkKitAvailability = useCallback(
    async (kit: KitDefinition) => {
      if (!siteActif) return;

      setLoadingKit(true);
      setSelectedKit(kit);
      setShowModal(true);

      const supabase = getSupabaseClient();
      const resolvedArticles: ResolvedArticle[] = [];

      for (const kitArticle of kit.articles) {
        try {
          // Rechercher l'article par référence (code barre) dans Supabase
          const { data: articles, error } = await supabase
            .from(tables.articles)
            .select('id, name, reference')
            .eq('isArchived', false)
            .eq('reference', kitArticle.reference)
            .limit(1);

          if (error || !articles || articles.length === 0) {
            resolvedArticles.push({
              kitArticle,
              articleId: null,
              articleNom: null,
              articleReference: null,
              stockDisponible: 0,
              estDisponible: false,
            });
            continue;
          }

          const article = articles[0];
          // Vérifier le stock sur le site actif
          const stockActuel = await stockRepository.getQuantite(article.id, siteActif.id);

          resolvedArticles.push({
            kitArticle,
            articleId: article.id,
            articleNom: (article as any).name,
            articleReference: article.reference,
            stockDisponible: stockActuel ?? 0,
            estDisponible: (stockActuel ?? 0) >= kitArticle.quantite,
          });
        } catch (err) {
          console.error(`Erreur recherche article ${kitArticle.label}:`, err);
          resolvedArticles.push({
            kitArticle,
            articleId: null,
            articleNom: null,
            articleReference: null,
            stockDisponible: 0,
            estDisponible: false,
          });
        }
      }

      // Sélectionner par défaut tous les articles disponibles
      const defaultSelected = new Set<number>();
      resolvedArticles.forEach((a, idx) => {
        if (a.estDisponible) {
          defaultSelected.add(idx);
        }
      });
      setSelectedArticles(defaultSelected);

      setKitAvailability({
        kit,
        articles: resolvedArticles,
        tousDisponibles: resolvedArticles.every((a) => a.estDisponible),
        loading: false,
      });
      setLoadingKit(false);
    },
    [siteActif],
  );

  // ===== Toggle sélection d'un article =====
  const toggleArticleSelection = useCallback((idx: number) => {
    setSelectedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  // True si le kit courant permet la sélection individuelle des articles
  const isSelectableKit = selectedKit?.id === 'kit_complet';

  // Articles sélectionnés et disponibles
  const selectedAvailableCount = kitAvailability
    ? kitAvailability.articles.filter((a, idx) => selectedArticles.has(idx) && a.estDisponible).length
    : 0;

  const hasSelectedArticles = isSelectableKit
    ? selectedAvailableCount > 0
    : (kitAvailability?.tousDisponibles ?? false);

  // Vérifier si les articles sélectionnés sont tous disponibles
  const selectedAllAvailable = kitAvailability
    ? kitAvailability.articles.every((a, idx) => !selectedArticles.has(idx) || a.estDisponible)
    : false;

  // ===== Exécuter la sortie du kit =====
  const executeKitSortie = useCallback(async () => {
    if (!kitAvailability || !siteActif || !technicien) return;

    // Kit Complet : articles sélectionnés individuellement
    // Autres kits : tous les articles disponibles
    const articlesToProcess = isSelectableKit
      ? kitAvailability.articles.filter(
          (a, idx) => selectedArticles.has(idx) && a.estDisponible && a.articleId,
        )
      : kitAvailability.articles.filter((a) => a.estDisponible && a.articleId);

    closeConfirmModal();
    setValidating(true);

    try {
      for (const resolved of articlesToProcess) {
        if (resolved.articleId) {
          await mouvementRepository.create(
            {
              articleId: resolved.articleId,
              siteId: siteActif.id,
              type: 'sortie',
              quantite: resolved.kitArticle.quantite,
              commentaire: `Sortie Kit : ${kitAvailability.kit.nom}`,
            },
            technicien.id,
          );
        }
      }

      Vibration.vibrate([0, 50, 100, 50]);
      setValidating(false);

      setConfirmModal({
        visible: true,
        type: 'success',
        title: 'Sortie validée',
        message: `${articlesToProcess.length} article${articlesToProcess.length > 1 ? 's' : ''} retiré${articlesToProcess.length > 1 ? 's' : ''} du stock avec succès.`,
        articles: articlesToProcess.map((a) => a.articleNom || a.kitArticle.label),
        confirmLabel: 'Parfait',
        showCancel: false,
        onConfirm: () => {
          closeConfirmModal();
          setShowModal(false);
          setSelectedKit(null);
          setKitAvailability(null);
          setSelectedArticles(new Set());
          // Retourner à la liste des articles (pas à ArticleEdit)
          navigation.navigate('ArticlesList');
        },
      });
    } catch (err: any) {
      console.error('Erreur validation kit:', err);
      setValidating(false);

      setConfirmModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: err?.message || 'Une erreur est survenue lors de la validation du kit.',
        confirmLabel: 'Compris',
        showCancel: false,
        onConfirm: closeConfirmModal,
      });
    }
  }, [kitAvailability, siteActif, technicien, selectedArticles, isSelectableKit, closeConfirmModal]);

  // ===== Valider le kit =====
  const validateKit = useCallback(async () => {
    if (!kitAvailability || !siteActif || !technicien) return;

    if (isSelectableKit) {
      // Kit Complet : vérifier la sélection individuelle
      if (!hasSelectedArticles) {
        setConfirmModal({
          visible: true,
          type: 'warning',
          title: 'Aucune sélection',
          message: 'Veuillez sélectionner au moins un article à retirer du stock.',
          confirmLabel: 'Compris',
          showCancel: false,
          onConfirm: closeConfirmModal,
        });
        return;
      }

      if (!selectedAllAvailable) {
        setConfirmModal({
          visible: true,
          type: 'error',
          title: 'Stock insuffisant',
          message: 'Certains articles sélectionnés ne sont pas disponibles en stock.',
          confirmLabel: 'Compris',
          showCancel: false,
          onConfirm: closeConfirmModal,
        });
        return;
      }

      const articlesToProcess = kitAvailability.articles.filter(
        (a, idx) => selectedArticles.has(idx) && a.estDisponible && a.articleId,
      );

      setConfirmModal({
        visible: true,
        type: 'confirm',
        title: 'Confirmer la sortie',
        message: `Retirer ${articlesToProcess.length} article${articlesToProcess.length > 1 ? 's' : ''} du stock ?`,
        articles: articlesToProcess.map((a) => a.articleNom || a.kitArticle.label),
        confirmLabel: 'Confirmer',
        showCancel: true,
        onConfirm: executeKitSortie,
      });
    } else {
      // Kits assemblés : tout ou rien
      if (!kitAvailability.tousDisponibles) {
        setConfirmModal({
          visible: true,
          type: 'error',
          title: 'Kit incomplet',
          message: 'Tous les articles du kit doivent être disponibles en stock pour valider la sortie.',
          confirmLabel: 'Compris',
          showCancel: false,
          onConfirm: closeConfirmModal,
        });
        return;
      }

      setConfirmModal({
        visible: true,
        type: 'confirm',
        title: 'Confirmer la sortie du kit',
        message: `Retirer le ${kitAvailability.kit.nom} complet du stock (${kitAvailability.articles.length} articles) ?`,
        articles: kitAvailability.articles.map((a) => a.articleNom || a.kitArticle.label),
        confirmLabel: 'Confirmer',
        showCancel: true,
        onConfirm: executeKitSortie,
      });
    }
  }, [kitAvailability, siteActif, technicien, selectedArticles, isSelectableKit, hasSelectedArticles, selectedAllAvailable, executeKitSortie, closeConfirmModal]);

  // ===== Fermer le modal =====
  const closeModal = useCallback(() => {
    if (!validating) {
      setShowModal(false);
      setSelectedKit(null);
      setKitAvailability(null);
      setSelectedArticles(new Set());
    }
  }, [validating]);

  // ==================== RENDER ====================

  // Mapping kit type labels
  const getKitTypeLabel = (kit: KitDefinition) => {
    if (kit.id === 'kit_complet') return 'Sélection libre';
    if (kit.id === 'kit_audio') return 'Audio';
    return 'Périphériques';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* ===== HEADER IMMERSIF ===== */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#0B1120', '#162044', '#1E3A5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Décors géométriques flottants */}
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          <View style={styles.headerDecor3} />

          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerBadge}>
              <Icon name="package-variant-closed" size={14} color="#60A5FA" />
              <Text style={styles.headerBadgeText}>{KIT_DEFINITIONS.length} kits</Text>
            </View>
          </View>

          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.headerContent}>
            <View style={styles.headerIconGlow}>
              <LinearGradient
                colors={['#3B82F6', '#6366F1']}
                style={styles.headerIconCircle}
              >
                <Icon name="toolbox" size={26} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.headerTitle}>Préparation Kit</Text>
            <Text style={styles.headerSubtitle}>
              Assemblez et validez vos kits de déploiement
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Courbe bottom */}
        <View style={styles.headerCurve} />
      </View>

      {/* ===== LISTE DES KITS ===== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isTablet && contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info tip */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View style={styles.tipContainer}>
            <View style={styles.tipIconWrapper}>
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                style={styles.tipIconBg}
              >
                <Icon name="lightbulb-on-outline" size={18} color="#6366F1" />
              </LinearGradient>
            </View>
            <Text style={styles.tipText}>
              Appuyez sur un kit pour{' '}
              <Text style={styles.tipTextBold}>vérifier la disponibilité</Text> et valider la sortie.
            </Text>
          </View>
        </Animated.View>

        {/* Kit Cards */}
        {KIT_DEFINITIONS.map((kit, index) => {
          const isKitComplet = kit.id === 'kit_complet';

          return (
            <Animated.View
              key={kit.id}
              entering={FadeInUp.delay(280 + index * 100).duration(500).springify().damping(16)}
            >
              <TouchableOpacity
                style={styles.kitCard}
                activeOpacity={0.85}
                onPress={() => {
                  Vibration.vibrate(15);
                  if (isKitComplet) {
                    checkKitAvailability(kit);
                  } else {
                    navigation.navigate('ArticleEdit', { famille: kit.nom });
                  }
                }}
              >
                {/* Accent top colored line */}
                <LinearGradient
                  colors={[...kit.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.kitCardAccent}
                />

                <View style={styles.kitCardBody}>
                  {/* Row: Icon + Info */}
                  <View style={styles.kitCardTopRow}>
                    {/* Kit Icon with glow */}
                    <View style={[styles.kitIconGlow, { shadowColor: kit.color }]}>
                      <LinearGradient
                        colors={[...kit.gradient]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.kitIconContainer}
                      >
                        <Icon name={kit.icon} size={26} color="#FFF" />
                      </LinearGradient>
                    </View>

                    {/* Info */}
                    <View style={styles.kitInfo}>
                      <View style={styles.kitNameRow}>
                        <Text style={styles.kitName}>{kit.nom}</Text>
                        {isKitComplet && (
                          <View style={styles.kitCompletBadge}>
                            <Icon name="star" size={10} color="#F59E0B" />
                            <Text style={styles.kitCompletBadgeText}>Modulable</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.kitDescription} numberOfLines={2}>
                        {kit.description}
                      </Text>
                    </View>

                    {/* Arrow */}
                    <View style={styles.kitArrow}>
                      <Icon name="chevron-right" size={20} color="#94A3B8" />
                    </View>
                  </View>

                  {/* Bottom meta row */}
                  <View style={styles.kitMetaRow}>
                    <View style={styles.kitMetaItem}>
                      <View style={[styles.kitMetaDot, { backgroundColor: kit.color }]} />
                      <Text style={styles.kitMetaLabel}>{getKitTypeLabel(kit)}</Text>
                    </View>

                    <View style={styles.kitMetaDivider} />

                    <View style={styles.kitMetaItem}>
                      <Icon name="layers-outline" size={14} color="#94A3B8" />
                      <Text style={styles.kitMetaLabel}>
                        {kit.articles.length} article{kit.articles.length > 1 ? 's' : ''}
                      </Text>
                    </View>

                    {isKitComplet && (
                      <>
                        <View style={styles.kitMetaDivider} />
                        <View style={styles.kitMetaItem}>
                          <Icon name="checkbox-multiple-marked-outline" size={14} color="#94A3B8" />
                          <Text style={styles.kitMetaLabel}>Choix individuel</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ===== MODAL DÉTAIL DU KIT ===== */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {selectedKit && (
              <>
                {/* Header du modal */}
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[...selectedKit.gradient]}
                    style={styles.modalKitIcon}
                  >
                    <Icon name={selectedKit.icon} size={32} color="#FFF" />
                  </LinearGradient>
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalTitle}>{selectedKit.nom}</Text>
                    <Text style={styles.modalSubtitle}>{selectedKit.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={closeModal}
                    disabled={validating}
                  >
                    <Icon name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Contenu */}
                {loadingKit ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={premiumColors.primary.base} />
                    <Text style={styles.loadingText}>
                      Vérification du stock...
                    </Text>
                  </View>
                ) : kitAvailability ? (
                  <ScrollView
                    style={styles.modalScrollView}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Status global */}
                    <View
                      style={[
                        styles.statusBanner,
                        kitAvailability.tousDisponibles
                          ? styles.statusBannerOk
                          : styles.statusBannerError,
                      ]}
                    >
                      <Icon
                        name={
                          kitAvailability.tousDisponibles
                            ? 'check-circle'
                            : 'alert-circle'
                        }
                        size={22}
                        color={
                          kitAvailability.tousDisponibles
                            ? '#059669'
                            : '#DC2626'
                        }
                      />
                      <Text
                        style={[
                          styles.statusBannerText,
                          kitAvailability.tousDisponibles
                            ? styles.statusTextOk
                            : styles.statusTextError,
                        ]}
                      >
                        {kitAvailability.tousDisponibles
                          ? isSelectableKit
                            ? 'Tous les articles sont disponibles'
                            : 'Kit disponible – prêt pour la sortie'
                          : isSelectableKit
                            ? 'Certains articles sont manquants'
                            : 'Kit indisponible – articles manquants'}
                      </Text>
                    </View>

                    {/* Sélection info (uniquement pour Kit Complet) */}
                    {isSelectableKit && (
                      <View style={styles.selectionInfo}>
                        <Icon name="checkbox-multiple-marked-outline" size={16} color="#6366F1" />
                        <Text style={styles.selectionInfoText}>
                          {selectedAvailableCount} article{selectedAvailableCount > 1 ? 's' : ''} sélectionné{selectedAvailableCount > 1 ? 's' : ''} sur {kitAvailability.articles.length}
                        </Text>
                      </View>
                    )}

                    {/* Liste des articles */}
                    <Text style={styles.articlesSectionTitle}>
                      {isSelectableKit ? 'Articles du kit' : 'Contenu du kit'}
                    </Text>

                    {kitAvailability.articles.map((resolved, idx) => {
                      const isSelected = selectedArticles.has(idx);
                      const canSelect = resolved.estDisponible && isSelectableKit;

                      return (
                        <Animated.View
                          key={idx}
                          entering={FadeIn.delay(idx * 60).duration(300)}
                        >
                          <TouchableOpacity
                            style={[
                              styles.articleRow,
                              !resolved.estDisponible && styles.articleRowUnavailable,
                              isSelectableKit && isSelected && resolved.estDisponible && styles.articleRowSelected,
                              !isSelectableKit && resolved.estDisponible && styles.articleRowSelected,
                            ]}
                            activeOpacity={canSelect ? 0.7 : 1}
                            onPress={() => {
                              if (canSelect) {
                                Vibration.vibrate(10);
                                toggleArticleSelection(idx);
                              }
                            }}
                            disabled={!canSelect}
                          >
                            {/* Checkbox (uniquement pour Kit Complet) */}
                            {isSelectableKit && (
                              <View
                                style={[
                                  styles.checkbox,
                                  isSelected && resolved.estDisponible && styles.checkboxChecked,
                                  !resolved.estDisponible && styles.checkboxDisabled,
                                ]}
                              >
                                {isSelected && resolved.estDisponible && (
                                  <Icon name="check" size={14} color="#FFF" />
                                )}
                                {!resolved.estDisponible && (
                                  <Icon name="close" size={14} color="#FFF" />
                                )}
                              </View>
                            )}
                            {/* Icône statut pour les kits assemblés */}
                            {!isSelectableKit && (
                              <View
                                style={[
                                  styles.checkbox,
                                  resolved.estDisponible ? styles.checkboxChecked : styles.checkboxDisabled,
                                ]}
                              >
                                <Icon
                                  name={resolved.estDisponible ? 'check' : 'close'}
                                  size={14}
                                  color="#FFF"
                                />
                              </View>
                            )}

                            <View style={styles.articleInfo}>
                              <Text style={[
                                styles.articleLabel,
                                !resolved.estDisponible && styles.articleLabelDisabled,
                              ]}>
                                {resolved.articleNom || resolved.kitArticle.label}
                              </Text>
                              {resolved.articleReference && (
                                <Text style={styles.articleRef}>
                                  Réf: {resolved.articleReference}
                                </Text>
                              )}
                              {!resolved.articleId && (
                                <Text style={styles.articleNotFound}>
                                  Article non trouvé dans le stock
                                </Text>
                              )}
                            </View>

                            {/* Stock badge */}
                            <View
                              style={[
                                styles.stockBadge,
                                resolved.estDisponible
                                  ? styles.stockBadgeOk
                                  : styles.stockBadgeError,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stockBadgeText,
                                  resolved.estDisponible
                                    ? styles.stockTextOk
                                    : styles.stockTextError,
                                ]}
                              >
                                {resolved.articleId
                                  ? `${resolved.stockDisponible} dispo`
                                  : 'N/A'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}

                    <View style={{ height: 20 }} />
                  </ScrollView>
                ) : null}

                {/* Bouton de validation */}
                {!loadingKit && kitAvailability && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[
                        styles.validateButton,
                        !hasSelectedArticles && styles.validateButtonDisabled,
                      ]}
                      activeOpacity={0.7}
                      onPress={validateKit}
                      disabled={!hasSelectedArticles || validating}
                    >
                      <LinearGradient
                        colors={
                          hasSelectedArticles
                            ? ['#34D399', '#10B981']
                            : ['#D1D5DB', '#9CA3AF']
                        }
                        style={styles.validateButtonGradient}
                      >
                        {validating ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Icon
                              name={
                                hasSelectedArticles
                                  ? 'check-circle-outline'
                                  : 'cancel'
                              }
                              size={22}
                              color="#FFF"
                            />
                            <Text style={styles.validateButtonText}>
                              {isSelectableKit
                                ? hasSelectedArticles
                                  ? `Valider la sortie (${selectedAvailableCount})`
                                  : 'Sélectionnez des articles'
                                : hasSelectedArticles
                                  ? `Valider la sortie du kit`
                                  : 'Kit indisponible'}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ===== CUSTOM CONFIRMATION MODAL ===== */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (confirmModal.showCancel) {
            closeConfirmModal();
          }
        }}
      >
        <View style={confirmStyles.overlay}>
          <Animated.View
            entering={ZoomIn.duration(250).springify().damping(15)}
            style={confirmStyles.card}
          >
            {/* Icône en cercle avec gradient */}
            <View style={confirmStyles.iconWrapper}>
              <LinearGradient
                colors={
                  confirmModal.type === 'success'
                    ? ['#34D399', '#10B981']
                    : confirmModal.type === 'error'
                    ? ['#F87171', '#EF4444']
                    : confirmModal.type === 'warning'
                    ? ['#FBBF24', '#F59E0B']
                    : ['#818CF8', '#6366F1']
                }
                style={confirmStyles.iconCircle}
              >
                <Icon
                  name={
                    confirmModal.type === 'success'
                      ? 'check-circle'
                      : confirmModal.type === 'error'
                      ? 'close-circle'
                      : confirmModal.type === 'warning'
                      ? 'alert-circle'
                      : 'package-variant-closed'
                  }
                  size={36}
                  color="#FFF"
                />
              </LinearGradient>
            </View>

            {/* Titre */}
            <Text style={confirmStyles.title}>{confirmModal.title}</Text>

            {/* Message */}
            <Text style={confirmStyles.message}>{confirmModal.message}</Text>

            {/* Liste des articles */}
            {confirmModal.articles && confirmModal.articles.length > 0 && (
              <View style={confirmStyles.articlesList}>
                {confirmModal.articles.map((name, idx) => (
                  <Animated.View
                    key={idx}
                    entering={FadeInDown.delay(80 + idx * 50).duration(250)}
                    style={confirmStyles.articleChip}
                  >
                    <LinearGradient
                      colors={
                        confirmModal.type === 'success'
                          ? ['#ECFDF5', '#D1FAE5']
                          : ['#EEF2FF', '#E0E7FF']
                      }
                      style={confirmStyles.articleChipGradient}
                    >
                      <Icon
                        name={
                          confirmModal.type === 'success'
                            ? 'check-circle'
                            : 'package-variant'
                        }
                        size={16}
                        color={
                          confirmModal.type === 'success'
                            ? '#059669'
                            : '#6366F1'
                        }
                      />
                      <Text
                        style={[
                          confirmStyles.articleChipText,
                          confirmModal.type === 'success'
                            ? { color: '#065F46' }
                            : { color: '#3730A3' },
                        ]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Séparateur */}
            <View style={confirmStyles.divider} />

            {/* Boutons */}
            <View style={confirmStyles.buttonsRow}>
              {confirmModal.showCancel && (
                <TouchableOpacity
                  style={confirmStyles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={closeConfirmModal}
                >
                  <Text style={confirmStyles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  confirmStyles.confirmBtn,
                  !confirmModal.showCancel && confirmStyles.confirmBtnFull,
                ]}
                activeOpacity={0.7}
                onPress={confirmModal.onConfirm}
              >
                <LinearGradient
                  colors={
                    confirmModal.type === 'success'
                      ? ['#34D399', '#10B981']
                      : confirmModal.type === 'error'
                      ? ['#F87171', '#EF4444']
                      : confirmModal.type === 'warning'
                      ? ['#FBBF24', '#F59E0B']
                      : ['#818CF8', '#6366F1']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={confirmStyles.confirmBtnGradient}
                >
                  <Icon
                    name={
                      confirmModal.type === 'success'
                        ? 'check'
                        : confirmModal.type === 'error' || confirmModal.type === 'warning'
                        ? 'arrow-right'
                        : 'check-bold'
                    }
                    size={18}
                    color="#FFF"
                  />
                  <Text style={confirmStyles.confirmBtnText}>
                    {confirmModal.confirmLabel || 'OK'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // ===== Header =====
  headerWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  header: {
    paddingTop: 14,
    paddingBottom: 36,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: 10,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  headerDecor3: {
    position: 'absolute',
    top: 20,
    right: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: 0.3,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIconGlow: {
    marginBottom: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(203, 213, 225, 0.8)',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#F0F4F8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // ===== ScrollView =====
  scrollView: {
    flex: 1,
    marginTop: -8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 30,
  },

  // ===== Tip =====
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  tipIconWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tipIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  tipTextBold: {
    fontWeight: '700',
    color: '#4F46E5',
  },

  // ===== Kit Card =====
  kitCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  kitCardAccent: {
    height: 3,
  },
  kitCardBody: {
    padding: 18,
  },
  kitCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  kitIconGlow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  kitIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitInfo: {
    flex: 1,
  },
  kitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  kitName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  kitCompletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
  },
  kitCompletBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  kitDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  kitArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Meta row
  kitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  kitMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kitMetaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kitMetaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  kitMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
  },

  bottomSpacer: {
    height: 40,
  },

  // ===== Modal =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 34,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 18,
  },

  // Modal header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 14,
    marginBottom: 18,
  },
  modalKitIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 18,
  },
  statusBannerOk: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBannerError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextOk: {
    color: '#059669',
  },
  statusTextError: {
    color: '#DC2626',
  },

  // Articles section
  articlesSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginHorizontal: 22,
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modalScrollView: {
    maxHeight: 360,
  },

  // Article row
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  articleRowUnavailable: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  articleRowSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxDisabled: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    marginBottom: 14,
    gap: 6,
  },
  selectionInfoText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  articleLabelDisabled: {
    color: '#94A3B8',
  },
  articleInfo: {
    flex: 1,
  },
  articleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  articleRef: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  articleNotFound: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 1,
  },

  // Stock badge
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeOk: {
    backgroundColor: '#D1FAE5',
  },
  stockBadgeError: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockTextOk: {
    color: '#059669',
  },
  stockTextError: {
    color: '#DC2626',
  },

  // Footer / Validate button
  modalFooter: {
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  validateButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  validateButtonDisabled: {
    opacity: 0.7,
  },
  validateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

// ==================== CONFIRM MODAL STYLES ====================

const confirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    paddingTop: 36,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 24,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  articlesList: {
    width: '100%',
    gap: 6,
    marginBottom: 8,
  },
  articleChip: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  articleChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  articleChipText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmBtnFull: {
    flex: 1,
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default KitScreen;
