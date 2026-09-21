import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';

interface CAStockBadgeProps {
  stock:       number;
  seuil:       number;
  seuilCrit?:  number;
}

export const CAStockBadge = ({
  stock,
  seuil,
  seuilCrit = 0,
}: CAStockBadgeProps) => {
  const isCritical = stock <= seuilCrit;
  const isAlert    = !isCritical && stock <= seuil;
  const isOk       = !isCritical && !isAlert;

  const bg =
    isCritical ? CA_THEME.danger :
    isAlert    ? CA_THEME.warning :
                 CA_THEME.green;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}
      accessibilityLabel={`${stock} pièces${isCritical ? ' — stock critique' : isAlert ? ' — stock en alerte' : ''}`}>
      <Text style={styles.number}>{stock}</Text>
      <Text style={styles.unit}>PCS</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width:           46,
    height:          46,
    borderRadius:    8,
    alignItems:      'center',
    justifyContent:  'center',
  },
  number: {
    fontSize:   17,
    fontFamily: CA_THEME.fontFamilyBold,
    fontWeight: '700',
    color:      CA_THEME.white,
    lineHeight: 20,
  },
  unit: {
    fontSize:   8,
    fontFamily: CA_THEME.fontFamilyBold,
    fontWeight: '700',
    color:      'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
