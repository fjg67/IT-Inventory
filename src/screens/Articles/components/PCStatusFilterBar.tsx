import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { premiumSpacing } from '../../../constants/premiumTheme';

type PCStatus = 'À chaud' | 'À reusiner' | 'En usinage' | 'Disponible' | 'Envoyé';

interface PCStatusConfig {
  icon: string;
  color: string;
  bg: string;
  bgDark: string;
  label: string;
}

interface PCStatusFilterBarProps {
  activeStatus: PCStatus | null;
  onStatusChange: (status: PCStatus | null) => void;
}

const STATUS_CONFIGS: Record<PCStatus, PCStatusConfig> = {
  'À chaud': {
    icon: 'flash-outline',
    color: '#059669',
    bg: '#ECFDF5',
    bgDark: 'rgba(16, 185, 129, 0.15)',
    label: 'À chaud',
  },
  'À reusiner': {
    icon: 'wrench-outline',
    color: '#D97706',
    bg: '#FFFBEB',
    bgDark: 'rgba(217, 119, 6, 0.15)',
    label: 'À reusiner',
  },
  'En usinage': {
    icon: 'cog-play-outline',
    color: '#EA580C',
    bg: '#FFF7ED',
    bgDark: 'rgba(249, 115, 22, 0.15)',
    label: 'En usinage',
  },
  'Disponible': {
    icon: 'check-circle-outline',
    color: '#2563EB',
    bg: '#DBEAFE',
    bgDark: 'rgba(37, 99, 235, 0.15)',
    label: 'Disponible',
  },
  'Envoyé': {
    icon: 'send-outline',
    color: '#BE123C',
    bg: '#FFF1F2',
    bgDark: 'rgba(225, 29, 72, 0.15)',
    label: 'Envoyé',
  },
};

const STATUSES: PCStatus[] = ['À chaud', 'À reusiner', 'En usinage', 'Disponible', 'Envoyé'];

const PCStatusFilterChip: React.FC<{
  status: PCStatus;
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
  index: number;
}> = ({ status, isActive, isDark, onPress, index }) => {
  const config = STATUS_CONFIGS[status];
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.94, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 120 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(350).springify()}
      style={[styles.chipWrap, styles.chipWrapHalf, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: isActive
              ? isDark
                ? config.bgDark
                : config.bg
              : isDark
                ? 'rgba(15, 23, 42, 0.55)'
                : 'rgba(255, 255, 255, 0.86)',
            borderColor: isActive ? config.color : 'rgba(148, 163, 184, 0.2)',
          },
        ]}
      >
        <Icon
          name={config.icon}
          size={16}
          color={isActive ? config.color : '#94A3B8'}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.chipText,
            {
              color: isActive ? config.color : '#64748B',
              fontWeight: isActive ? '700' : '600',
            },
          ]}
        >
          {config.label}
        </Text>
        {isActive && (
          <View
            style={[
              styles.chipCheckmark,
              { backgroundColor: config.color },
            ]}
          >
            <Icon name="check" size={10} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const PCStatusFilterBar: React.FC<PCStatusFilterBarProps> = ({
  activeStatus,
  onStatusChange,
}) => {
  const { isDark } = useTheme();

  const handleStatusToggle = (status: PCStatus) => {
    if (activeStatus === status) {
      onStatusChange(null);
    } else {
      onStatusChange(status);
    }
  };

  const hasActiveFilter = useMemo(() => activeStatus !== null, [activeStatus]);

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(400).springify()}
      style={[styles.container]}
    >
      <LinearGradient
        colors={isDark ? ['rgba(15,23,42,0.72)', 'rgba(15,23,42,0.52)'] : ['#F8FAFC', '#EEF2F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wrapGradient}
      >
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <Icon name="filter-outline" size={14} color="#94A3B8" />
          <Text style={styles.headerText}>État du parc</Text>
        </View>
        {hasActiveFilter && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onStatusChange(null)}
            style={styles.clearButton}
          >
            <Icon name="close" size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.chipGrid}>
        {STATUSES.map((status, index) => (
          <PCStatusFilterChip
            key={status}
            status={status}
            isActive={activeStatus === status}
            isDark={isDark}
            onPress={() => handleStatusToggle(status)}
            index={index}
          />
        ))}
      </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: premiumSpacing.sm,
    backgroundColor: 'transparent',
  },
  wrapGradient: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: premiumSpacing.md,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearButton: {
    padding: 6,
    borderRadius: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    rowGap: 9,
  },
  chipWrap: {
    marginBottom: 0,
  },
  chipWrapHalf: {
    width: '48.6%',
  },
  chip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1.5,
    minHeight: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chipCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

export default PCStatusFilterBar;
