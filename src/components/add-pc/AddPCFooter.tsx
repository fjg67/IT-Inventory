import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddPCFooterProps {
  isValid: boolean;
  isLoading: boolean;
  statusColor: string;
  fromButtonColor: string;
  toButtonColor: string;
  colorProgress: SharedValue<number>;
  onCancel: () => void;
  onSubmit: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AddPCFooter: React.FC<AddPCFooterProps> = ({
  isValid,
  isLoading,
  statusColor,
  fromButtonColor,
  toButtonColor,
  colorProgress,
  onCancel,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const disabled = !isValid || isLoading;

  const submitStyle = useAnimatedStyle(() => ({
    backgroundColor: disabled
      ? '#2A3430'
      : interpolateColor(colorProgress.value, [0, 1], [fromButtonColor, toButtonColor]),
    borderColor: disabled
      ? 'rgba(148,163,184,0.2)'
      : interpolateColor(colorProgress.value, [0, 1], [fromButtonColor, toButtonColor]),
  }));

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(10, insets.bottom + 4) }]}>
      <View style={styles.row}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>

        <AnimatedPressable disabled={disabled} onPress={onSubmit} style={[styles.submitButton, submitStyle]}>
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitText}>Enregistrement...</Text>
            </>
          ) : (
            <>
              <Icon name="content-save-outline" size={16} color={disabled ? '#9AA8A4' : '#FFFFFF'} />
              <Text style={[styles.submitText, disabled ? styles.submitTextDisabled : null]}>Enregistrer le PC</Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <View style={[styles.edgeLine, { backgroundColor: statusColor }]} />
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
    backgroundColor: 'rgba(10,15,13,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.16)',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101915',
  },
  cancelText: {
    color: '#A9B7B2',
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    flex: 2,
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  submitTextDisabled: {
    color: '#9AA8A4',
  },
  edgeLine: {
    marginTop: 10,
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
  },
});
