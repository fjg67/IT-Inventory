import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { MOVEMENT_IDENTITIES } from '@/components/movement/movementTheme';

interface Props {
  onBack: () => void;
}

export const TransfertHeader: React.FC<Props> = ({ onBack }) => {
  const identity = MOVEMENT_IDENTITIES.transfert;

  return (
    <View style={styles.header}>
      <LinearGradient
        colors={[identity.bgGradient[0], identity.bgGradient[1], identity.bgGradient[2]]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { backgroundColor: identity.glow }]} />

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Icon name="arrow-left" size={21} color="#F0FDF4" />
      </TouchableOpacity>
      <View style={styles.centerRow}>
        <View style={styles.iconWrap}>
          <Icon name="swap-horizontal" size={16} color={identity.color} />
        </View>
        <Text style={styles.title}>Transfert inter-sites</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  orb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    position: 'absolute',
    right: -30,
    top: -40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(17,26,20,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F0FDF4',
    fontSize: 17,
    fontWeight: '700',
  },
});
