import React from 'react';
import { StyleSheet, View } from 'react-native';

type ScanCornersProps = {
  color: string;
  size: number;
  cornerLength: number;
};

export const ScanCorners: React.FC<ScanCornersProps> = ({ color, size, cornerLength }) => {
  const s = StyleSheet.create({
    wrap: {
      width: size,
      height: size,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: cornerLength,
      height: cornerLength,
    },
    tl: {
      top: 0,
      left: 0,
      borderTopWidth: 2.5,
      borderLeftWidth: 2.5,
      borderColor: color,
      borderTopLeftRadius: 4,
    },
    tr: {
      top: 0,
      right: 0,
      borderTopWidth: 2.5,
      borderRightWidth: 2.5,
      borderColor: color,
      borderTopRightRadius: 4,
    },
    bl: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 2.5,
      borderLeftWidth: 2.5,
      borderColor: color,
      borderBottomLeftRadius: 4,
    },
    br: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 2.5,
      borderRightWidth: 2.5,
      borderColor: color,
      borderBottomRightRadius: 4,
    },
  });

  return (
    <View style={s.wrap}>
      <View style={[s.corner, s.tl]} />
      <View style={[s.corner, s.tr]} />
      <View style={[s.corner, s.bl]} />
      <View style={[s.corner, s.br]} />
    </View>
  );
};
