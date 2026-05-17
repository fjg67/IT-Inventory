import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';
import { MOVEMENT_COLORS, MovementIdentity } from './movementTheme';
import { MovementStepper } from './MovementStepper';

interface Props {
  title: string;
  identity: MovementIdentity;
  currentStep: number;
  onBack: () => void;
  onHistory?: () => void;
  onHelp?: () => void;
  overlayStyle?: any;
}

export const MovementHeader: React.FC<Props> = ({
  title,
  identity,
  currentStep,
  onBack,
  onHistory,
  onHelp,
  overlayStyle,
}) => {
  return (
    <View style={styles.header}>
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} />
      <LinearGradient
        colors={[identity.bgGradient[0], identity.bgGradient[1], identity.bgGradient[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { backgroundColor: identity.glow }]} />

      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color={MOVEMENT_COLORS.text_primary} />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onHistory}>
            <Icon name="history" size={16} color={MOVEMENT_COLORS.text_primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onHelp}>
            <Icon name="help-circle-outline" size={16} color={MOVEMENT_COLORS.text_primary} />
          </TouchableOpacity>
        </View>
      </View>

      <MovementStepper currentStep={currentStep} identity={identity} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: MOVEMENT_COLORS.bg_primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: MOVEMENT_COLORS.text_primary,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(17,26,20,0.8)',
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
