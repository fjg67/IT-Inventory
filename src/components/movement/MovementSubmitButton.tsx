import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

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
      <TouchableOpacity disabled={disabled || loading} onPress={onPress} activeOpacity={0.9} style={{ opacity: disabled ? 0.45 : 1 }}>
        <LinearGradient
          colors={success ? ['#16A34A', '#15803D'] : [identity.colorDark, identity.color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.btn}
        >
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Icon name="check-circle-outline" size={18} color="#FFF" />}
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
    paddingTop: 10,
    backgroundColor: 'rgba(10,15,13,0.95)',
    borderTopWidth: 1,
    borderTopColor: MOVEMENT_COLORS.border_subtle,
  },
  btn: {
    minHeight: 54,
    borderRadius: 16,
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
  text: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
