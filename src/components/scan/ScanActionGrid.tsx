import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SCAN_ACTION_COLORS, ScanActionTone, SCAN_COLORS } from './tokens';

export type ScanActionItem = {
  key: string;
  tone: ScanActionTone;
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
};

type ScanActionGridProps = {
  actions: ScanActionItem[];
};

export const ScanActionGrid: React.FC<ScanActionGridProps> = ({ actions }) => {
  return (
    <View style={styles.grid}>
      {actions.map((action) => {
        const tone = SCAN_ACTION_COLORS[action.tone];
        return (
          <TouchableOpacity
            key={action.key}
            style={styles.item}
            activeOpacity={0.86}
            onPress={action.onPress}
            disabled={action.disabled}
          >
            <LinearGradient
              colors={[tone.dark, tone.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, action.disabled && styles.cardDisabled]}
            >
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                <View style={styles.iconInner}>
                  <Icon name={action.icon || tone.icon} size={19} color={tone.color} />
                </View>
              </View>
              <Text style={styles.label}>{action.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  item: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    minHeight: 116,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.25,
    elevation: 8,
  },
  cardDisabled: {
    opacity: 0.42,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconInner: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: SCAN_COLORS.text_primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
