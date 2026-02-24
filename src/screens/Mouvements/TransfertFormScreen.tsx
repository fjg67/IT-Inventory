// ============================================
// TRANSFERT FORM SCREEN - IT-Inventory Application
// Transfert inter-sites
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAppSelector, useAppDispatch } from '@/store';
import { showAlert } from '@/store/slices/uiSlice';
import { articleRepository, stockRepository, mouvementRepository } from '@/database';
import { Header, Card, Input, Button, Badge, Loading } from '@/components';
import { validateTransfertForm } from '@/utils';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Article, TransfertForm, StockSite } from '@/types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';
import { useResponsive } from '@/utils/responsive';

export const TransfertFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { isTablet, contentMaxWidth } = useResponsive();
  
  const siteActif = useAppSelector((state) => state.site.siteActif);
  const technicien = useAppSelector((state) => state.auth.currentTechnicien);
  const sitesDisponibles = useAppSelector((state) => state.site.sitesDisponibles);
  
  const initialArticleId = route.params?.articleId;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [stockDepart, setStockDepart] = useState<StockSite | null>(null);
  const [siteDepartId, setSiteDepartId] = useState<number | null>(siteActif?.id ?? null);
  const [siteArriveeId, setSiteArriveeId] = useState<number | null>(null);
  const [quantite, setQuantite] = useState('1');
  const [commentaire, setCommentaire] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadArticle = async (articleId: number) => {
    if (!siteDepartId) return;
    setIsLoading(true);
    try {
      const result = await articleRepository.findById(articleId, siteDepartId);
      setArticle(result);
    } catch (error) {
      console.error('Erreur chargement article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'article initial
  useEffect(() => {
    if (initialArticleId && siteDepartId) {
      loadArticle(initialArticleId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArticleId, siteDepartId]);

  // Charger le stock quand le site de départ change
  useEffect(() => {
    if (article && siteDepartId) {
      loadStockDepart(article.id, siteDepartId).catch(() => {});
    }
  }, [article, siteDepartId]);

  const loadStockDepart = async (articleId: number, siteId: number) => {
    try {
      const stock = await stockRepository.findByArticleAndSite(articleId, siteId);
      setStockDepart(stock);
    } catch (error) {
      console.error('Erreur chargement stock:', error);
    }
  };

  const validate = (): boolean => {
    const result = validateTransfertForm(
      {
        articleId: article?.id,
        siteDepartId: siteDepartId ?? undefined,
        siteArriveeId: siteArriveeId ?? undefined,
        quantite: parseInt(quantite, 10) || 0,
      },
      stockDepart?.quantiteActuelle ?? 0,
    );
    setErrors(result.errors);
    return result.isValid;
  };

  const handleSubmit = async () => {
    if (!validate() || !article || !siteDepartId || !siteArriveeId || !technicien) return;

    setIsSubmitting(true);

    try {
      const data: TransfertForm = {
        articleId: article.id,
        siteDepartId,
        siteArriveeId,
        quantite: parseInt(quantite, 10),
        commentaire: commentaire.trim() || undefined,
      };

      await mouvementRepository.createTransfert(data, technicien.id);

      dispatch(showAlert({
        type: 'success',
        message: SUCCESS_MESSAGES.TRANSFERT_CREATED,
        title: 'Transfert effectué',
      }));

      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      dispatch(showAlert({
        type: 'error',
        message,
        title: 'Erreur',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSiteName = (siteId: number | null): string => {
    if (!siteId) return 'Sélectionnez un site';
    const site = sitesDisponibles.find((s) => s.id === siteId);
    return site?.nom ?? 'Site inconnu';
  };

  const sitesArrivee = sitesDisponibles.filter((s) => s.id !== siteDepartId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Transfert inter-sites" 
          leftIcon={<Text>←</Text>} 
          leftAction={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <Loading message="Chargement..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Transfert inter-sites"
        leftIcon={<Text>←</Text>}
        leftAction={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={[styles.content, isTablet && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', padding: spacing.lg }]}>
          {/* Article sélectionné */}
          {article ? (
            <Card style={styles.articleCard}>
              <Text style={styles.articleNom}>{article.nom}</Text>
              <Text style={styles.articleRef}>{article.reference}</Text>
              
              <View style={styles.stockInfo}>
                <Text style={styles.stockLabel}>Stock sur {getSiteName(siteDepartId)}:</Text>
                <Badge
                  label={`${stockDepart?.quantiteActuelle ?? 0} ${article.unite}`}
                  variant={
                    (stockDepart?.quantiteActuelle ?? 0) < article.stockMini
                      ? 'warning'
                      : 'success'
                  }
                  size="md"
                />
              </View>
              {errors.articleId && (
                <Text style={styles.errorText}>{errors.articleId}</Text>
              )}
            </Card>
          ) : (
            <Card style={styles.noArticleCard}>
              <Text style={styles.noArticleText}>
                Veuillez sélectionner un article pour effectuer un transfert
              </Text>
              <Button
                title="Choisir un article"
                onPress={() => navigation.navigate('Articles', { screen: 'ArticlesList' })}
                variant="outline"
                size="sm"
              />
            </Card>
          )}

          {/* Icône de transfert */}
          <View style={styles.transferIcon}>
            <View style={styles.transferArrow}>
              <Text style={styles.transferArrowText}>↓</Text>
            </View>
          </View>

          {/* Site de départ */}
          <View style={styles.siteSection}>
            <Text style={styles.siteLabel}>Site de départ</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={siteDepartId}
                onValueChange={(value: number | null) => setSiteDepartId(value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un site" value={null} />
                {sitesDisponibles.map((site) => (
                  <Picker.Item key={site.id} label={site.nom} value={site.id} />
                ))}
              </Picker>
            </View>
            {errors.siteDepartId && (
              <Text style={styles.errorText}>{errors.siteDepartId}</Text>
            )}
          </View>

          {/* Site de destination */}
          <View style={styles.siteSection}>
            <Text style={styles.siteLabel}>Site de destination</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={siteArriveeId}
                onValueChange={(value: number | null) => setSiteArriveeId(value)}
                style={styles.picker}
                enabled={sitesArrivee.length > 0}
              >
                <Picker.Item label="Sélectionnez un site" value={null} />
                {sitesArrivee.map((site) => (
                  <Picker.Item key={site.id} label={site.nom} value={site.id} />
                ))}
              </Picker>
            </View>
            {errors.siteArriveeId && (
              <Text style={styles.errorText}>{errors.siteArriveeId}</Text>
            )}
          </View>

          {/* Quantité */}
          <Input
            label="Quantité à transférer"
            value={quantite}
            onChangeText={setQuantite}
            keyboardType="numeric"
            placeholder="1"
            error={errors.quantite}
          />

          {/* Commentaire */}
          <Input
            label="Commentaire (optionnel)"
            value={commentaire}
            onChangeText={setCommentaire}
            placeholder="Motif du transfert..."
            multiline
            numberOfLines={2}
          />

          {/* Résumé */}
          {article && siteDepartId && siteArriveeId && (
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé du transfert</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Article:</Text>
                <Text style={styles.summaryValue}>{article.nom}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>De:</Text>
                <Text style={styles.summaryValue}>{getSiteName(siteDepartId)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vers:</Text>
                <Text style={styles.summaryValue}>{getSiteName(siteArriveeId)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantité:</Text>
                <Text style={styles.summaryValue}>
                  {quantite} {article.unite}
                </Text>
              </View>
            </Card>
          )}

          {/* Bouton validation */}
          <Button
            title={isSubmitting ? 'Transfert en cours...' : 'Confirmer le transfert'}
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
            disabled={!article || !siteDepartId || !siteArriveeId || isSubmitting}
            fullWidth
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  articleCard: {
    marginBottom: spacing.sm,
  },
  articleNom: {
    ...typography.h4,
    color: colors.text.primary,
  },
  articleRef: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stockLabel: {
    ...typography.body,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  noArticleCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noArticleText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  transferIcon: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  transferArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferArrowText: {
    color: colors.text.inverse,
    fontSize: 24,
  },
  siteSection: {
    marginBottom: spacing.md,
  },
  siteLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    marginVertical: spacing.md,
  },
  summaryTitle: {
    ...typography.bodyBold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});

export default TransfertFormScreen;
