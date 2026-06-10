// components/add-pc/PCSuccessActions.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PCSuccessActionsProps {
  statusColor: string;
  trigger: boolean;
  onAddAnother: () => void;
  onViewParc: () => void;
}

export const PCSuccessActions: React.FC<PCSuccessActionsProps> = ({
  statusColor,
  trigger,
  onAddAnother,
  onViewParc,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (!trigger) return;

    opacity.value = 0;
    translateY.value = 10;

    opacity.value = withDelay(820, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(820, withSpring(0, { damping: 14 }));

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.row, containerStyle]}>
      {/* Ajouter un autre PC */}
      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={onAddAnother}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un autre PC"
      >
        <Icon name="plus" size={16} color="#86EFAC" />
        <Text style={styles.btnSecondaryText}>Nouveau PC</Text>
      </TouchableOpacity>

      {/* Voir le parc */}
      <TouchableOpacity
        style={[styles.btnPrimary, { backgroundColor: statusColor }]}
        onPress={onViewParc}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Voir le parc PC"
      >
        <Icon name="laptop" size={16} color="white" />
        <Text style={styles.btnPrimaryText}>Voir le parc</Text>
        <Icon name="arrow-right" size={14} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#16231A',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#86EFAC',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
});
