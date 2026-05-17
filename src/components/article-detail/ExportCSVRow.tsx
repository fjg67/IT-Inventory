import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ADC } from './articleDetailColors';

interface ExportCSVRowProps {
  onPress: () => void;
  loading?: boolean;
}

export const ExportCSVRow: React.FC<ExportCSVRowProps> = ({ onPress, loading }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onPress();
  };

  return (
    <Animated.View entering={FadeIn.delay(350).duration(300)} style={animStyle}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={loading}
      >
        <View style={styles.leftBorder} />
        <View style={[styles.iconBox, { backgroundColor: ADC.info_subtle }]}>
          {loading ? (
            <ActivityIndicator size="small" color={ADC.info} />
          ) : (
            <Icon name="file-download-outline" size={22} color={ADC.info} />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{loading ? 'Export en cours...' : 'Exporter en CSV'}</Text>
          <Text style={styles.sub}>Premium, Analytics ou Comptable</Text>
        </View>
        {!loading && (
          <Icon name="chevron-right" size={18} color={ADC.text_dim} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: ADC.bg_card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADC.border_subtle,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: ADC.info,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: ADC.text_primary,
  },
  sub: {
    fontSize: 12,
    color: ADC.text_muted,
  },
});
