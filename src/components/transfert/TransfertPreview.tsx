import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Article } from '@/types';

interface Props {
  article: Article;
  fromSite: string;
  toSite: string;
  qty: number;
  fromBefore: number;
  fromAfter: number;
}

export const TransfertPreview: React.FC<Props> = ({
  article,
  fromSite,
  toSite,
  qty,
  fromBefore,
  fromAfter,
}) => {
  const arrowX = useSharedValue(-2);

  useEffect(() => {
    arrowX.value = withRepeat(withSequence(withTiming(2, { duration: 800 }), withTiming(-2, { duration: 800 })), -1, true);
  }, [arrowX]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.photoFallback}>
          <Icon name="package-variant-closed" size={18} color="#8B5CF6" />
        </View>
        <View style={styles.main}>
          <Text style={styles.name} numberOfLines={1}>{article.nom}</Text>
          <View style={styles.siteRow}>
            <Text style={styles.site}>{fromSite}</Text>
            <Animated.View style={arrowStyle}>
              <Icon name="arrow-right" size={14} color="#8B5CF6" />
            </Animated.View>
            <Text style={styles.site}>{toSite}</Text>
          </View>
          <Text style={styles.qty}>{fromBefore} pcs  -{qty} pcs  ->  {fromAfter} pcs</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    backgroundColor: 'rgba(139,92,246,0.08)',
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  photoFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  main: {
    flex: 1,
  },
  name: {
    color: '#F0FDF4',
    fontSize: 14,
    fontWeight: '700',
  },
  siteRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  site: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  qty: {
    marginTop: 4,
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '700',
  },
});
