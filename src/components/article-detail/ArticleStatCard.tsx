import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ADC } from './articleDetailColors';

interface ArticleStatCardProps {
  icon: string;
  value: number;
  label: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  delay?: number;
  showAlert?: boolean;
}

export const ArticleStatCard: React.FC<ArticleStatCardProps> = React.memo(({
  icon, value, label, iconBg, iconColor, valueColor, delay = 0, showAlert,
}) => {
  const displayValue = useSharedValue(0);
  const borderAnim = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      displayValue.value = withTiming(value, { duration: 700 });
      if (showAlert) {
        borderAnim.value = withSpring(1, { damping: 12 });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay, showAlert]);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: showAlert
      ? `rgba(239, 68, 68, ${0.15 + borderAnim.value * 0.2})`
      : ADC.border_subtle,
    backgroundColor: showAlert
      ? `rgba(239, 68, 68, ${0.05 + borderAnim.value * 0.05})`
      : ADC.bg_card,
  }));

  return (
    <Animated.View
      entering={ZoomIn.delay(delay).duration(350).springify()}
      style={[styles.card, cardStyle]}
    >
      {showAlert && (
        <View style={styles.alertDot} />
      )}
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: valueColor ?? ADC.text_primary }]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: ADC.text_muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  alertDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ADC.danger,
  },
});
