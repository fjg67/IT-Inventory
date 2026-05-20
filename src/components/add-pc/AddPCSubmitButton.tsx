import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface AddPCSubmitButtonProps {
  isValid: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AddPCSubmitButton: React.FC<AddPCSubmitButtonProps> = ({
  isValid,
  isLoading,
  isSuccess,
  onCancel,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const cancelScale = useSharedValue(1);
  const submitScale = useSharedValue(1);

  const cancelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  const submitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const submitDisabled = !isValid || isLoading || isSuccess;

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(10, 15, 13, 0)', OBSIDIAN_COLORS.bg_primary]}
        style={styles.fade}
      />

      <View style={styles.row}>
        <AnimatedPressable
          onPress={onCancel}
          onPressIn={() => {
            cancelScale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
          }}
          onPressOut={() => {
            cancelScale.value = withSpring(1, { damping: 14, stiffness: 180 });
          }}
          style={[styles.cancelButton, cancelStyle]}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </AnimatedPressable>

        <AnimatedPressable
          disabled={submitDisabled}
          onPress={onSubmit}
          onPressIn={() => {
            submitScale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
          }}
          onPressOut={() => {
            submitScale.value = withSpring(1, { damping: 14, stiffness: 180 });
          }}
          style={[styles.submitButton, submitStyle, submitDisabled ? styles.submitDisabled : null]}
        >
          {isSuccess ? (
            <View style={styles.submitContent}>
              <Icon name="check-bold" size={16} color="#FFFFFF" />
              <Text style={styles.submitText}>PC enregistré !</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.submitContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitText}>Enregistrement...</Text>
            </View>
          ) : submitDisabled ? (
            <View style={styles.submitIdle}>
              <Icon name="laptop" size={15} color={OBSIDIAN_COLORS.text_dim} />
              <Text style={styles.submitIdleText}>Enregistrer le PC</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#1B8A3E', '#145C26']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              <View style={styles.submitContent}>
                <Icon name="content-save-outline" size={15} color="#FFFFFF" />
                <Text style={styles.submitText}>Enregistrer le PC</Text>
              </View>
            </LinearGradient>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -40,
    height: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    minHeight: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.12)',
    shadowColor: '#22C55E',
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
  },
  submitDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  submitIdle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitIdleText: {
    color: OBSIDIAN_COLORS.text_dim,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddPCSubmitButton;
