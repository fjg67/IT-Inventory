// ============================================
// CreateArticleFooter — Sticky — Obsidian Grid
// IT-Inventory Application
// ============================================
import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolateColor, ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

interface Props {
  isValid: boolean;
  isLoading: boolean;
  showSuccess: boolean;
  onSubmit: () => void;
  isEditing?: boolean;
}

const AnimTouch = Animated.createAnimatedComponent(TouchableOpacity);

export const CreateArticleFooter: React.FC<Props> = ({
  isValid,
  isLoading,
  showSuccess,
  onSubmit,
  isEditing,
}) => {
  const scale = useSharedValue(1);
  const validAnim = useSharedValue(isValid ? 1 : 0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    validAnim.value = withTiming(isValid ? 1 : 0, { duration: 300 });
  }, [isValid]);

  useEffect(() => {
    if (showSuccess) {
      checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      checkScale.value = withTiming(0, { duration: 150 });
    }
  }, [showSuccess]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  const handlePress = () => {
    if (!isValid || isLoading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onSubmit();
  };

  const label = showSuccess
    ? (isEditing ? 'Article mis à jour !' : 'Article créé !')
    : isLoading
      ? 'Enregistrement...'
      : isEditing
        ? "Mettre à jour"
        : "Créer l'article";

  return (
    <View style={styles.container}>
      {/* Fade gradient above */}
      <LinearGradient
        colors={['transparent', CAC.bg_primary]}
        style={styles.fadeGradient}
        pointerEvents="none"
      />

      <Animated.View style={[styles.inner, animStyle]}>
        {isValid ? (
          <TouchableOpacity
            style={styles.btnValid}
            onPress={handlePress}
            activeOpacity={0.85}
            disabled={isLoading || showSuccess}
          >
            <LinearGradient
              colors={showSuccess ? [CAC.green_light, CAC.green_light] : [CAC.green_primary, '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : showSuccess ? (
                <Animated.View style={[styles.checkWrap, checkStyle]}>
                  <Icon name="check-circle" size={22} color="#fff" />
                </Animated.View>
              ) : (
                <Icon name="check-circle-outline" size={20} color="#fff" />
              )}
              <Text style={styles.btnValidText}>{label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnInvalid}>
            <Icon name="check-circle-outline" size={20} color={CAC.text_dim} />
            <Text style={styles.btnInvalidText}>{label}</Text>
          </View>
        )}

        {!isValid && !isLoading && (
          <Text style={styles.hintText}>Remplissez les champs requis (*).</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CAC.bg_primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  fadeGradient: {
    position: 'absolute',
    top: -28,
    left: 0,
    right: 0,
    height: 28,
  },
  inner: { gap: 6 },
  btnValid: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: CAC.green_light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  btnValidText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  checkWrap: {},
  btnInvalid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: CAC.bg_card,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: CAC.border_subtle,
  },
  btnInvalidText: {
    fontSize: 15,
    fontWeight: '700',
    color: CAC.text_dim,
  },
  hintText: {
    fontSize: 11,
    color: CAC.text_dim,
    textAlign: 'center',
  },
});
