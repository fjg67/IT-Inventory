import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

interface CAMovementQtyBadgeProps {
  quantity: number;
  type:     string;
}

const QTY_STYLE = {
  entree:      { bg: CA_THEME.greenBg,  border: CA_THEME.greenBg2,                numColor: CA_THEME.green,  prefix: '+' },
  sortie:      { bg: CA_THEME.dangerBg, border: 'rgba(211,47,47,0.25)',            numColor: CA_THEME.danger, prefix: '-' },
  ajustement:  { bg: CA_THEME.warningBg,border: 'rgba(230,81,0,0.22)',             numColor: CA_THEME.warning,prefix: '+' },
  transfert:   { bg: CA_THEME.purpleBg, border: 'rgba(107,33,168,0.22)',           numColor: CA_THEME.purple, prefix: ''  },
};

export const CAMovementQtyBadge = ({ quantity, type }: CAMovementQtyBadgeProps) => {
  const normalizedType = type.startsWith('transfert') ? 'transfert' : type as keyof typeof QTY_STYLE;
  const conf = QTY_STYLE[normalizedType];
  const isSortie = type === 'sortie' || type === 'transfert_depart';
  const sign = isSortie ? '-' : (quantity > 0 ? '+' : '');
  const absQty = Math.abs(quantity);

  return (
    <View style={[styles.badge, {
      backgroundColor: conf.bg,
      borderColor:     conf.border,
    }]}
      accessibilityLabel={`Quantité : ${sign}${absQty}`}
    >
      <Text style={styles.label}>QTE</Text>
      <Text style={[styles.number, { color: conf.numColor }]}>
        {sign}{absQty}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   5,
    borderRadius:      7,
    borderWidth:       1,
    alignItems:        'center',
    minWidth:          46,
  },
  label:  { fontSize: 9, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: CA_THEME.textMuted },
  number: { fontSize: 18, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '800', lineHeight: 22 },
});
