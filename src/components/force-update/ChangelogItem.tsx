import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

type ChangelogItemProps = {
  text: string;
  delay: number;
};

export const ChangelogItem: React.FC<ChangelogItemProps> = ({ text, delay }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(240)} style={styles.row}>
      <Icon name="check-circle" size={15} color="#22C55E" />
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#86EFAC',
  },
});
