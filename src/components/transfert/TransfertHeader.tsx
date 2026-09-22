import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOVEMENT_IDENTITIES } from '@/components/movement/movementTheme';
import { CA_THEME } from '@/constants/caTheme';

interface Props {
  onBack: () => void;
}

export const TransfertHeader: React.FC<Props> = ({ onBack }) => {
  const identity = MOVEMENT_IDENTITIES.transfert;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: (insets.top || 40) + 12 }]}>
      <LinearGradient
        colors={[CA_THEME.white, '#F5F3FF', '#EDE9FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbes décoratifs */}
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbBottomLeft]} />

      {/* Bouton retour */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Icon name="arrow-left" size={20} color={identity.color} />
      </TouchableOpacity>

      {/* Titre central */}
      <View style={styles.centerCol}>
        <Text style={styles.subtitle}>OPÉRATION</Text>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <Icon name="swap-horizontal" size={18} color={CA_THEME.white} />
          </View>
          <Text style={styles.title}>Transfert inter-sites</Text>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ width: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,92,246,0.12)',
  },

  // Orbes décoratifs
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTopRight: {
    width: 180,
    height: 180,
    right: -50,
    top: -60,
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  orbBottomLeft: {
    width: 100,
    height: 100,
    left: -30,
    bottom: -40,
    backgroundColor: 'rgba(139,92,246,0.05)',
  },

  // Bouton retour
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: CA_THEME.white,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Centre
  centerCol: {
    alignItems: 'center',
    gap: 4,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});
