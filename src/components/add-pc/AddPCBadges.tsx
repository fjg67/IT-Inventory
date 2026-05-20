import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PCCategory } from '@/hooks/useAddPCForm';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface AddPCBadgesProps {
  category: PCCategory | null;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const AddPCBadges: React.FC<AddPCBadgesProps> = ({ category }) => {
  const categoryAnim = useSharedValue(category ? 1 : 0);

  useEffect(() => {
    categoryAnim.value = withTiming(category ? 1 : 0, { duration: 300 });
  }, [category, categoryAnim]);

  const categoryStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      categoryAnim.value,
      [0, 1],
      [OBSIDIAN_COLORS.bg_card, 'rgba(34, 197, 94, 0.10)'],
    ),
    borderColor: interpolateColor(
      categoryAnim.value,
      [0, 1],
      ['rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.30)'],
    ),
  }));

  const categoryLabel = category === 'portable_siege'
    ? 'Portable siège'
    : category === 'portable_agence'
      ? 'Portable agence'
      : 'Aucune catégorie';

  return (
    <View style={styles.row}>
      <View style={styles.pillSecure}>
        <Icon name="shield-check-outline" size={12} color={OBSIDIAN_COLORS.green_light} />
        <Text style={styles.textSecure}>Ajout sécurisé</Text>
      </View>
      <AnimatedView style={[styles.pillCategory, categoryStyle]}>
        <Icon name="laptop" size={12} color={category ? OBSIDIAN_COLORS.green_light : OBSIDIAN_COLORS.text_muted} />
        <Text style={[styles.textCategory, category ? styles.textCategoryActive : null]}>{categoryLabel}</Text>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pillSecure: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.30)',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    paddingHorizontal: 12,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textSecure: {
    color: OBSIDIAN_COLORS.green_light,
    fontSize: 12,
    fontWeight: '500',
  },
  pillCategory: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textCategory: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 12,
    fontWeight: '500',
  },
  textCategoryActive: {
    color: OBSIDIAN_COLORS.green_light,
  },
});

export default AddPCBadges;
