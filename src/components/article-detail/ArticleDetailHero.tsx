import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  AnimatedStyleProp,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Article } from '@/types';
import { ADC } from './articleDetailColors';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

interface ArticleDetailHeroProps {
  article: Article;
  isLowStock: boolean;
  isCritical: boolean;
  photoOpacity: AnimatedStyleProp<object>;
  compactTitleOpacity: AnimatedStyleProp<object>;
  onBack: () => void;
  onEdit: () => void;
  showEdit: boolean;
}

export const ArticleDetailHero: React.FC<ArticleDetailHeroProps> = ({
  article,
  isLowStock,
  isCritical,
  photoOpacity,
  compactTitleOpacity,
  onBack,
  onEdit,
  showEdit,
}) => {
  const statusColor = isCritical ? ADC.danger : isLowStock ? ADC.warning : ADC.green_primary;
  const statusIcon = isCritical ? 'close' : isLowStock ? 'alert' : 'check';

  return (
    <View style={styles.hero}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(139,92,246,0.20)', 'rgba(27,138,62,0.10)', 'rgba(10,15,13,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Orbs lumineux */}
        <View style={styles.orbViolet} />
        <View style={styles.orbGreen} />
      </View>

      {/* Boutons nav */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={onBack}>
          <Icon name="arrow-left" size={20} color={ADC.text_primary} />
        </TouchableOpacity>

        {/* Titre compact (visible au scroll) */}
        <Animated.View style={[styles.compactTitle, compactTitleOpacity]}>
          <Text style={styles.compactTitleText} numberOfLines={1}>{article.nom}</Text>
        </Animated.View>

        {showEdit ? (
          <TouchableOpacity style={styles.navBtn} onPress={onEdit}>
            <Icon name="pencil-outline" size={20} color={ADC.text_primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Photo + ref + titre */}
      <Animated.View style={[styles.heroContent, photoOpacity]}>
        {/* Photo */}
        <Animated.View entering={ZoomIn.delay(150).duration(380).springify()} style={styles.photoWrap}>
          {article.photoUrl ? (
            <Image source={{ uri: article.photoUrl }} style={styles.photo} resizeMode="contain" />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.initials}>{getInitials(article.nom)}</Text>
            </View>
          )}
          {/* Badge statut */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Icon name={statusIcon} size={12} color="#FFF" />
          </View>
        </Animated.View>

        {/* Référence barcode */}
        <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.refPill}>
          <Icon name="barcode" size={12} color={ADC.text_muted} />
          <Text style={styles.refText}>{article.reference}</Text>
        </Animated.View>

        {/* Nom article */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(300)}
          style={styles.articleName}
          numberOfLines={2}
        >
          {article.nom}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    backgroundColor: ADC.bg_primary,
    overflow: 'hidden',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  orbViolet: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
    right: -50,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  orbGreen: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -30,
    left: -40,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ADC.bg_card + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADC.border_subtle,
  },
  compactTitle: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  compactTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADC.text_primary,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    gap: 8,
  },
  photoWrap: {
    position: 'relative',
    shadowColor: ADC.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: ADC.border_card,
    backgroundColor: ADC.bg_card_elevated,
  },
  photoFallback: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: ADC.bg_card_elevated,
    borderWidth: 2,
    borderColor: ADC.border_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 30,
    fontWeight: '800',
    color: ADC.text_secondary,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ADC.bg_primary,
  },
  refPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ADC.bg_card + 'CC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
  },
  refText: {
    fontSize: 13,
    fontWeight: '600',
    color: ADC.text_secondary,
    letterSpacing: 0.5,
  },
  articleName: {
    fontSize: 22,
    fontWeight: '800',
    color: ADC.text_primary,
    textAlign: 'center',
    letterSpacing: -0.3,
    paddingHorizontal: 24,
  },
});
