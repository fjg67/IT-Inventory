import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ADC } from './articleDetailColors';
import { QuickActionCard } from './QuickActionCard';

interface QuickAction {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  disabled?: boolean;
  hint?: string;
}

interface QuickActionsSectionProps {
  actions: QuickAction[];
  title?: string;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  actions,
  title = 'Actions rapides',
}) => (
  <Animated.View entering={FadeInDown.delay(400).duration(300)}>
    <View style={styles.sectionHeader}>
      <View style={styles.accentBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.grid}>
      {actions.map((action, idx) => (
        <QuickActionCard
          key={action.label}
          icon={action.icon}
          label={action.label}
          color={action.color}
          bg={action.bg}
          onPress={action.onPress}
          disabled={action.disabled}
          hint={action.hint}
          delay={idx * 60}
        />
      ))}
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  accentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: ADC.green_primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ADC.text_primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
