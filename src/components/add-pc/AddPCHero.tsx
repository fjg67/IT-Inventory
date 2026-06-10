import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { PCCategory } from '@/hooks/useAddPCForm';
import { PC_DEFAULT_UI, PCStatusUIConfig } from '@/constants/pcStatusColors';
import { PCStatus } from '@/types/pc.types';

interface AddPCHeroProps {
  selectedStatus: PCStatus | null;
  selectedModel: string | null;
  selectedCategory: PCCategory | null;
  fromConfig: PCStatusUIConfig;
  toConfig: PCStatusUIConfig;
  colorProgress: SharedValue<number>;
}

const AddPCHero: React.FC<AddPCHeroProps> = ({
  selectedStatus,
  selectedModel,
  selectedCategory,
  fromConfig,
  toConfig,
  colorProgress,
}) => {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (!selectedStatus) return;
    iconScale.value = withSpring(1.16, { damping: 8, stiffness: 220 }, () => {
      iconScale.value = withSpring(1, { damping: 14, stiffness: 170 });
    });
  }, [iconScale, selectedStatus]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(colorProgress.value, [0, 1], [fromConfig.border, toConfig.border]),
    backgroundColor: interpolateColor(colorProgress.value, [0, 1], [fromConfig.subtle, toConfig.subtle]),
    transform: [{ scale: iconScale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorProgress.value, [0, 1], [fromConfig.heroGlow, toConfig.heroGlow]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(colorProgress.value, [0, 1], [fromConfig.color, toConfig.color]),
  }));

  const activeConfig = selectedStatus ? toConfig : PC_DEFAULT_UI;

  return (
    <Animated.View entering={FadeInDown.duration(250)} style={styles.heroContainer}>
      <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />

      <Animated.View style={[styles.iconWrap, iconWrapStyle]}>
        <Icon name={activeConfig.icon} size={30} color={activeConfig.color} />
      </Animated.View>

      <Animated.Text style={[styles.heroLabel, labelStyle]}>
        {selectedStatus ? `PARC PORTABLE · ${activeConfig.label.toUpperCase()}` : 'PARC PORTABLE'}
      </Animated.Text>
      <Text style={styles.heroSub}>{selectedModel ?? 'Sélectionnez un modèle'}</Text>

      <View style={styles.pillsRow}>
        <View style={[styles.pill, { borderColor: activeConfig.border, backgroundColor: activeConfig.subtle }]}>
          <Icon name="shield-check-outline" size={12} color={activeConfig.color} />
          <Text style={[styles.pillText, { color: activeConfig.color }]}>Ajout sécurisé</Text>
        </View>

        {selectedCategory ? (
          <View style={[styles.pill, { borderColor: activeConfig.border, backgroundColor: activeConfig.subtle }]}>
            <Icon name="laptop" size={12} color={activeConfig.color} />
            <Text style={[styles.pillText, { color: activeConfig.color }]}>
              {selectedCategory === 'portable_siege' ? 'Portable siège' : 'Portable agence'}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  halo: {
    position: 'absolute',
    top: -34,
    width: 180,
    height: 120,
    borderRadius: 90,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 10,
    zIndex: 1,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0FDF4',
    marginBottom: 12,
    textAlign: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AddPCHero;
