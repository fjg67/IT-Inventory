// components/add-pc/PCSuccessCard.tsx
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { PC_STATUS_UI } from '@/constants/pcStatusColors';
import { PCStatus } from '@/types/pc.types';
import { PCCategory } from '@/hooks/useAddPCForm';

const CATEGORY_LABEL: Record<PCCategory, string> = {
  portable_siege: 'Siège',
  portable_agence: 'Agence',
};

const CATEGORY_ICON: Record<PCCategory, string> = {
  portable_siege: 'laptop',
  portable_agence: 'laptop-chromebook',
};

interface PCSuccessCardProps {
  hostname: string;
  model: string;
  asset: string;
  category: PCCategory;
  status: PCStatus;
  trigger: boolean;
}

export const PCSuccessCard: React.FC<PCSuccessCardProps> = ({
  hostname,
  model,
  asset,
  category,
  status,
  trigger,
}) => {
  const config = PC_STATUS_UI[status];
  const translateY = useSharedValue(18);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;

    translateY.value = 18;
    opacity.value = 0;

    translateY.value = withDelay(650, withSpring(0, { damping: 14, stiffness: 160 }));
    opacity.value = withDelay(650, withTiming(1, { duration: 250 }));

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        cardStyle,
        { borderLeftColor: config.color },
      ]}
    >
      {/* Top row : avatar + hostname + modèle + badge statut */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: config.subtle, borderColor: config.border },
          ]}
        >
          <Icon name={CATEGORY_ICON[category]} size={18} color={config.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.hostname} numberOfLines={1}>
            {hostname}
          </Text>
          <Text style={styles.model} numberOfLines={1}>
            {model}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: config.subtle, borderColor: config.border },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
          <Text style={[styles.statusLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* Pills */}
      <View style={styles.pillsRow}>
        <View
          style={[
            styles.pill,
            { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
          ]}
        >
          <Icon name="barcode" size={10} color="#8FA39C" />
          <Text style={styles.pillText}>{asset || '—'}</Text>
        </View>
        <View
          style={[
            styles.pill,
            { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
          ]}
        >
          <Icon name={CATEGORY_ICON[category]} size={10} color="#8FA39C" />
          <Text style={styles.pillText}>{CATEGORY_LABEL[category]}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111A14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.08)',
    borderLeftWidth: 4,
    padding: 14,
    width: 260,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  hostname: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0FDF4',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  model: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    color: '#8FA39C',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
