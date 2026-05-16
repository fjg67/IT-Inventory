import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MovementStatCard } from './MovementStatCard';
import { MOVEMENT_TYPE_COLORS, MovementTypeKey } from '@/constants/movementTypes';

interface MovementStatCardsProps {
  counts: Record<MovementTypeKey, number>;
  onTypePress: (type: MovementTypeKey) => void;
}

export const MovementStatCards: React.FC<MovementStatCardsProps> = ({ counts, onTypePress }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
    {(['entree', 'sortie', 'ajustement', 'transfert'] as const).map((type, index) => (
      <View key={type} style={index === 0 ? styles.first : undefined}>
        <MovementStatCard meta={MOVEMENT_TYPE_COLORS[type]} value={counts[type]} index={index} onPress={() => onTypePress(type)} />
      </View>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingRight: 4,
  },
  first: {
    marginLeft: 0,
  },
});
