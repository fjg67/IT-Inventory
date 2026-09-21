import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CA_THEME } from '@/constants/caTheme';

export type CAActionButtonVariant = 'primary' | 'danger';

interface CAActionButtonProps {
  label:    string;
  icon:     string;
  variant:  CAActionButtonVariant;
  onPress:  () => void;
}

export const CAActionButton = ({ label, icon, variant, onPress }: CAActionButtonProps) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, isPrimary ? styles.btnPrimary : styles.btnDanger]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={16}
        color={isPrimary ? CA_THEME.white : CA_THEME.danger} />
      <Text style={[styles.text, { color: isPrimary ? CA_THEME.white : CA_THEME.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 12,
    borderRadius:    10,
  },
  btnPrimary: { backgroundColor: CA_THEME.green },
  btnDanger: {
    backgroundColor: CA_THEME.dangerBg,
    borderWidth: 1.5,
    borderColor: 'rgba(211,47,47,0.25)',
  },
  text: { fontSize: 13, fontWeight: '700' },
});
