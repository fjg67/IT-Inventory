import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PARC_PC_COLORS } from './tokens';

interface PCSwipeButtonProps {
  label: string;
  sub: string;
  icon: string;
  color: string;
  border: string;
  backgroundColor: string;
  onPress: () => void;
}

export const PCSwipeButton: React.FC<PCSwipeButtonProps> = ({ label, sub, icon, color, border, backgroundColor, onPress }) => {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} style={[styles.button, { backgroundColor, borderLeftColor: color, borderColor: border }]}> 
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={[styles.sub, { color }]}>{sub}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 80,
  },
  button: {
    flex: 1,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderLeftWidth: 2,
    backgroundColor: PARC_PC_COLORS.bg_card_elevated,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  sub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
