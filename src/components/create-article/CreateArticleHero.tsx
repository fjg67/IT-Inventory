// ============================================
// CreateArticleHero — Hero Header — Obsidian Grid
// IT-Inventory Application
// ============================================
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

interface Props {
  isEditing: boolean;
  isPCEditMode?: boolean;
  onBack: () => void;
}

export const CreateArticleHero: React.FC<Props> = ({ isEditing, isPCEditMode, onBack }) => {
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.6, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const badge = isPCEditMode ? 'PC ÉDITION' : isEditing ? 'ÉDITION' : 'CRÉATION';
  const title = isPCEditMode ? 'Modifier le poste' : isEditing ? "Modifier l'article" : 'Nouvel Article';
  const subtitle = isPCEditMode ? 'Fiche parc PC' : isEditing ? 'Mise à jour des informations' : 'Ajouter au stock IT';

  return (
    <View style={styles.hero}>
      {/* Background gradient overlay */}
      <LinearGradient
        colors={['rgba(27, 138, 62, 0.25)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Row: back + badges */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="arrow-left" size={20} color={CAC.text_primary} />
        </TouchableOpacity>

        <View style={styles.badgeRow}>
          <View style={styles.creationBadge}>
            <Animated.View style={[styles.badgeDot, pulseStyle]} />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>

        {!isEditing && (
          <View style={styles.collectionPill}>
            <Text style={styles.collectionText}>Consommables</Text>
          </View>
        )}
      </View>

      {/* Title + subtitle */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {!isEditing && !isPCEditMode && (
        <View style={styles.contextPill}>
          <Icon name="label-outline" size={12} color={CAC.text_secondary} />
          <Text style={styles.contextText}>Création d'article consommable</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: CAC.bg_primary,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    minHeight: 160,
    overflow: 'hidden',
    gap: 6,
  },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(27, 138, 62, 0.12)',
  },
  circle2: {
    position: 'absolute',
    top: 60,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CAC.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flex: 1 },
  creationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: CAC.green_subtle,
    borderWidth: 1,
    borderColor: CAC.border_accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CAC.green_light,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: CAC.green_light, letterSpacing: 0.5 },
  collectionPill: {
    backgroundColor: CAC.green_subtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CAC.border_subtle,
  },
  collectionText: { fontSize: 11, color: CAC.green_light },
  title: { fontSize: 26, fontWeight: '800', color: CAC.text_primary },
  subtitle: { fontSize: 13, color: CAC.text_muted },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CAC.bg_card,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CAC.border_subtle,
    marginTop: 4,
  },
  contextText: { fontSize: 12, color: CAC.text_secondary },
});
