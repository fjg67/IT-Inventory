import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { OBSIDIAN_COLORS } from '@/constants/colors';

type SendPCFooterProps = {
  isValid: boolean;
  isLoading: boolean;
  isSuccess?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const SendPCFooter: React.FC<SendPCFooterProps> = ({
  isValid,
  isLoading,
  isSuccess = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Annuler</Text>
      </Pressable>

      <Pressable disabled={!isValid || isLoading} onPress={onConfirm} style={styles.confirmBtnWrap}>
        {isLoading ? (
          <View style={styles.confirmDisabled}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.confirmDisabledText}>Envoi en cours...</Text>
          </View>
        ) : isSuccess ? (
          <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.confirmEnabled}>
            <Icon name="check-bold" size={15} color="#FFFFFF" />
            <Text style={styles.confirmEnabledText}>PC envoye !</Text>
          </LinearGradient>
        ) : isValid ? (
          <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.confirmEnabled}>
            <Icon name="send-outline" size={15} color="#FFFFFF" />
            <Text style={styles.confirmEnabledText}>Confirmer l'envoi</Text>
          </LinearGradient>
        ) : (
          <View style={styles.confirmDisabled}>
            <Icon name="send-outline" size={15} color={OBSIDIAN_COLORS.text_dim} />
            <Text style={styles.confirmDisabledText}>Confirmer l'envoi</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: OBSIDIAN_COLORS.text_muted,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtnWrap: {
    flex: 2,
  },
  confirmEnabled: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmEnabledText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDisabled: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.7,
  },
  confirmDisabledText: {
    color: OBSIDIAN_COLORS.text_dim,
    fontSize: 14,
    fontWeight: '600',
  },
});
