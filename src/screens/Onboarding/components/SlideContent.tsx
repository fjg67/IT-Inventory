import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SlideContentProps = {
  title: string;
  description: string;
};

export const SlideContent: React.FC<SlideContentProps> = ({ title, description }) => (
  <View style={styles.content}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F0FDF4',
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
