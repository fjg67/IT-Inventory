import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface AddPCHeroProps {
  model: string | null;
  onBack: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const AddPCHero: React.FC<AddPCHeroProps> = ({ model, onBack }) => {
  const textOpacity = useSharedValue(1);
  const textY = useSharedValue(0);
  const iconOpacity = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    textOpacity.value = withTiming(0, { duration: 150 });
    textY.value = withTiming(-8, { duration: 150 });
    iconOpacity.value = withTiming(0.25, { duration: 120 });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      textY.value = 8;
      textOpacity.value = withTiming(1, { duration: 200 });
      textY.value = withSpring(0, { damping: 14, stiffness: 180 });
      iconOpacity.value = withTiming(1, { duration: 200 });
    }, 160);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [model, iconOpacity, textOpacity, textY]);

  const modelTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const laptopIconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['rgba(27, 138, 62, 0.25)', 'rgba(27, 138, 62, 0.05)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.orbOne} pointerEvents="none" />
      <View style={styles.orbTwo} pointerEvents="none" />

      <Pressable style={styles.backButton} onPress={onBack}>
        <Icon name="arrow-left" size={20} color={OBSIDIAN_COLORS.text_primary} />
      </Pressable>

      <View style={styles.center}>
        <View style={styles.frame}>
          <AnimatedView style={laptopIconStyle}>
            <Icon name="laptop" size={48} color={OBSIDIAN_COLORS.green_light} />
          </AnimatedView>
        </View>

        <Text style={styles.eyebrow}>PARC PORTABLE</Text>

        <AnimatedView entering={FadeIn.duration(180)} style={modelTextStyle}>
          <Text style={[styles.model, !model ? styles.modelPlaceholder : null]}>
            {model ?? 'Selectionnez un modele'}
          </Text>
        </AnimatedView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 180,
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orbOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -30,
    right: -30,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  orbTwo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 40,
    left: -20,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  frame: {
    width: 140,
    height: 90,
    borderRadius: 16,
    backgroundColor: OBSIDIAN_COLORS.bg_card_elevated,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: OBSIDIAN_COLORS.green_light,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  eyebrow: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  model: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modelPlaceholder: {
    color: OBSIDIAN_COLORS.text_dim,
    fontStyle: 'italic',
    fontSize: 16,
  },
});

export default AddPCHero;
