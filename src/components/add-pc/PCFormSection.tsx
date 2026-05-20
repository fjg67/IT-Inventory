import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';

interface PCFormSectionProps {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}

const PCFormSection: React.FC<PCFormSectionProps> = ({ title, required = false, children }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <View style={styles.bar} />
        <Text style={styles.title}>
          {title}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: OBSIDIAN_COLORS.green_primary,
  },
  title: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 13,
    fontWeight: '600',
  },
  required: {
    color: OBSIDIAN_COLORS.danger,
  },
});

export default PCFormSection;
