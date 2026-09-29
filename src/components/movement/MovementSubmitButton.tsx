import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { MovementIdentity } from './movementTheme';

interface Props {
  identity: MovementIdentity;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  label?: string;
  onPress: () => void;
  bottomInset?: number;
}

export const MovementSubmitButton: React.FC<Props> = ({
  identity,
  disabled,
  loading,
  success,
  label = 'Valider le mouvement',
  onPress,
  bottomInset = 0,
}) => {
  return (
    <View style={[styles.stickyWrap, { paddingBottom: Math.max(10, bottomInset + 6) }]}>
      <TouchableOpacity disabled={disabled || loading} onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={success ? ['#16A34A', '#15803D'] : disabled ? ['#CBB9EA', '#A98BD8'] : [identity.colorDark, identity.color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.btn, disabled && styles.btnDisabled]}
        >
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Icon name="check-circle-outline" size={20} color="#FFF" />}
          <Text style={styles.text}>{success ? 'Mouvement enregistre !' : label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#D9E2DC',
    zIndex: 20,
    elevation: 20,
  },
  btn: {
    minHeight: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btnDisabled: {
    shadowOpacity: 0.1,
    elevation: 3,
  },
  text: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.2,
  },
});
