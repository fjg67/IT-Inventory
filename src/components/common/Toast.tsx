import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  SlideInDown,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastProps extends ToastConfig {
  onDismiss: (id: string) => void;
}

const TYPE_CFG: Record<ToastType, {
  icon: string;
  gradient: [string, string];
  border: string;
}> = {
  success: { icon: 'check-circle-outline', gradient: ['#10B981', '#059669'], border: '#10B981' },
  error:   { icon: 'alert-circle-outline', gradient: ['#EF4444', '#DC2626'], border: '#EF4444' },
  warning: { icon: 'alert-outline',        gradient: ['#F59E0B', '#D97706'], border: '#F59E0B' },
  info:    { icon: 'information-outline',  gradient: ['#3B82F6', '#2563EB'], border: '#3B82F6' },
};

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const cfg = TYPE_CFG[type];
  const progress = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => onDismiss(id), [id, onDismiss]);

  useEffect(() => {
    // Animate progress bar
    progress.value = withTiming(0, {
      duration,
      easing: Easing.linear,
    });
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, duration, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18).stiffness(200)}
      exiting={FadeOutUp.duration(250)}
      style={[
        styles.wrapper,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? cfg.border + '30' : cfg.border + '25',
          shadowColor: cfg.gradient[0],
        },
      ]}
    >
      {/* Left accent */}
      <LinearGradient
        colors={cfg.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accent}
      />

      {/* Icon */}
      <LinearGradient
        colors={cfg.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <View style={styles.iconInner}>
          <Icon name={cfg.icon} size={16} color={cfg.gradient[0]} />
        </View>
      </LinearGradient>

      {/* Message */}
      <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>

      {/* Close */}
      <Pressable onPress={dismiss} hitSlop={8} style={styles.closeBtn}>
        <Icon name="close" size={14} color={colors.textMuted} />
      </Pressable>

      {/* Progress bar at bottom */}
      <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : cfg.border + '15' }]}>
        <Animated.View style={[styles.progressBar, { backgroundColor: cfg.border }, progressStyle]} />
      </View>
    </Animated.View>
  );
};

// ─── Toast Container ───────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastConfig[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </View>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

import { useState } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
    alignItems: 'stretch',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default Toast;
