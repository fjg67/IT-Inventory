import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ADC } from './articleDetailColors';

const TYPE_DOT: Record<string, { icon: string; color: string }> = {
  entree:            { icon: 'arrow-up-bold',    color: ADC.green_primary },
  sortie:            { icon: 'arrow-down-bold',  color: ADC.danger },
  ajustement:        { icon: 'tune-vertical',    color: ADC.warning },
  transfert_depart:  { icon: 'arrow-right-bold', color: ADC.purple },
  transfert_arrivee: { icon: 'arrow-left-bold',  color: ADC.purple },
};

interface HistoryTimelineDotProps {
  type: string;
  showLine?: boolean;
}

export const HistoryTimelineDot: React.FC<HistoryTimelineDotProps> = ({ type, showLine }) => {
  const cfg = TYPE_DOT[type] ?? TYPE_DOT.entree;

  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, { backgroundColor: cfg.color, borderColor: cfg.color + '66' }]}>
        <Icon name={cfg.icon} size={12} color="#FFF" />
      </View>
      {showLine && <View style={[styles.line, { backgroundColor: cfg.color + '30' }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 32,
    marginTop: 2,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginTop: 2,
  },
});
