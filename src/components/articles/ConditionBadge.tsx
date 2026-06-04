import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArticleCondition, CONDITION_CONFIG } from '@/types/article.types';

interface ConditionBadgeProps {
  condition: ArticleCondition;
  defectiveCount?: number;
  size?: 'sm' | 'md';
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({
  condition,
  defectiveCount = 0,
  size = 'md',
}) => {
  const config = CONDITION_CONFIG[condition];
  const isDefective = condition === 'defectueux';

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: config.subtle, borderColor: config.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: config.color }]}>
        {isDefective && defectiveCount > 0 ? `${defectiveCount} defectueux` : config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
  },
});
