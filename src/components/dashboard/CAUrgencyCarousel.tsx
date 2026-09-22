import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation, FadeInRight } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PredictiveAlert } from '@/services/predictiveService';
import { CA_THEME } from '@/constants/caTheme';

interface CAUrgencyCarouselProps {
  alerts: PredictiveAlert[];
  onPressAlert: (articleId: number) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

export const CAUrgencyCarousel: React.FC<CAUrgencyCarouselProps> = ({ alerts, onPressAlert }) => {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Focus du jour</Text>
      </View>
      
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {alerts.map((alert, index) => {
          // Calcul du style de parallaxe et scale
          const animatedStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ];
            
            const scale = interpolate(
              scrollX.value,
              inputRange,
              [0.9, 1, 0.9],
              Extrapolation.CLAMP
            );
            
            return {
              transform: [{ scale }],
            };
          });

          const isRuptureImminente = alert.daysRemaining <= 7;
          
          return (
            <Animated.View 
              key={alert.articleId} 
              entering={FadeInRight.delay(index * 100).springify()}
              style={[styles.cardWrapper, animatedStyle]}
            >
              <Pressable onPress={() => onPressAlert(alert.articleId)}>
                <LinearGradient
                  colors={isRuptureImminente ? ['#FEF2F2', '#FEE2E2'] : ['#FFFBEB', '#FEF3C7']}
                  style={styles.card}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Bordure colorée */}
                  <View style={[styles.cardBorder, { backgroundColor: isRuptureImminente ? CA_THEME.danger : CA_THEME.warning }]} />
                  
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: isRuptureImminente ? '#FECACA' : '#FDE68A' }]}>
                      <Icon name="alert-decagram" size={20} color={isRuptureImminente ? CA_THEME.danger : '#D97706'} />
                    </View>
                    <View style={styles.badge}>
                      <Text style={[styles.badgeText, { color: isRuptureImminente ? CA_THEME.danger : '#D97706' }]}>
                        {alert.daysRemaining} jours restants
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <Text style={styles.articleName} numberOfLines={1}>{alert.articleNom}</Text>
                    <Text style={styles.articleStats}>Stock : {alert.currentStock} • Conso : -{alert.velocity.toFixed(1)}/j</Text>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <Text style={[styles.actionText, { color: isRuptureImminente ? CA_THEME.danger : '#D97706' }]}>
                      Voir l'article <Icon name="arrow-right" size={14} />
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: CA_THEME.fontFamilyBold,
    color: CA_THEME.textPrimary,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: SPACING,
    shadowColor: CA_THEME.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  cardBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: CA_THEME.fontFamilyBold,
  },
  cardBody: {
    marginBottom: 12,
  },
  articleName: {
    fontSize: 16,
    fontFamily: CA_THEME.fontFamilyBold,
    color: CA_THEME.textPrimary,
    marginBottom: 4,
  },
  articleStats: {
    fontSize: 13,
    fontFamily: CA_THEME.fontFamilyMedium,
    color: CA_THEME.textSecondary,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 13,
    fontFamily: CA_THEME.fontFamilyBold,
  },
});
