import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PanneDeclarationFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isValid: boolean;
}

export const PanneDeclarationFooter: React.FC<PanneDeclarationFooterProps> = ({
  onCancel,
  onConfirm,
  isLoading,
  isValid,
}) => (
  <View style={styles.footer}>
    <TouchableOpacity
      onPress={onCancel}
      disabled={isLoading}
      style={[styles.cancelBtn, isLoading && styles.btnDisabled]}
      activeOpacity={0.85}
    >
      <Text style={styles.cancelText}>Annuler</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onConfirm}
      disabled={!isValid || isLoading}
      style={[styles.confirmBtn, (!isValid || isLoading) && styles.btnDisabled]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={isValid ? ['#EF4444', '#DC2626'] : ['#6B7280', '#4B5563']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.confirmBtnGradient}
      >
        {isLoading ? (
          <Icon name="loading" size={16} color="#FFFFFF" />
        ) : (
          <>
            <Icon name="alert-octagon" size={16} color="#FFFFFF" />
            <Text style={styles.confirmText}>Déclarer la panne</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.border_card,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.text_primary,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
