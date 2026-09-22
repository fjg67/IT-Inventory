import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  withDelay, 
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { CA_THEME } from '@/constants/caTheme';

interface CAHealthRingsProps {
  totalArticles: number;
  articlesAlerte: number;
  size?: number;
  strokeWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CAHealthRings: React.FC<CAHealthRingsProps> = ({
  totalArticles,
  articlesAlerte,
  size = 120,
  strokeWidth = 12,
}) => {
  const center = size / 2;
  const radiusOuter = center - strokeWidth / 2;
  const radiusInner = radiusOuter - strokeWidth - 4;
  const circumferenceOuter = 2 * Math.PI * radiusOuter;
  const circumferenceInner = 2 * Math.PI * radiusInner;
  
  // Outer ring (Capacity/Total) - We just animate it fully to 100% to represent "Stock Total"
  const progressOuter = useSharedValue(0);
  
  // Inner ring (Alertes) - ratio of alerts vs total
  const progressInner = useSharedValue(0);
  
  const alertRatio = totalArticles > 0 ? articlesAlerte / totalArticles : 0;
  // If there are alerts but it's a small ratio, at least show a minimum so it's visible
  const displayRatio = articlesAlerte > 0 ? Math.max(alertRatio, 0.05) : 0;

  useEffect(() => {
    progressOuter.value = 0;
    progressInner.value = 0;
    
    progressOuter.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) });
    progressInner.value = withDelay(400, withTiming(displayRatio, { duration: 1500, easing: Easing.out(Easing.cubic) }));
  }, [totalArticles, displayRatio, progressOuter, progressInner]);

  const animatedPropsOuter = useAnimatedProps(() => ({
    strokeDashoffset: circumferenceOuter * (1 - progressOuter.value),
  }));

  const animatedPropsInner = useAnimatedProps(() => ({
    strokeDashoffset: circumferenceInner * (1 - progressInner.value),
    stroke: interpolateColor(
      progressInner.value,
      [0, 0.5, 1],
      [CA_THEME.green, CA_THEME.warning, CA_THEME.danger]
    )
  }));

  const isHealthy = articlesAlerte === 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background rings */}
        <Circle
          cx={center}
          cy={center}
          r={radiusOuter}
          stroke={CA_THEME.lightGray}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radiusInner}
          stroke={CA_THEME.lightGray}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Outer Ring (Total) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radiusOuter}
          stroke={CA_THEME.green}
          strokeWidth={strokeWidth}
          strokeDasharray={circumferenceOuter}
          animatedProps={animatedPropsOuter}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
        
        {/* Inner Ring (Alerts) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radiusInner}
          stroke={CA_THEME.danger}
          strokeWidth={strokeWidth}
          strokeDasharray={circumferenceInner}
          animatedProps={animatedPropsInner}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      
      <View style={styles.centerContent}>
        <Text style={[styles.centerText, { color: isHealthy ? CA_THEME.green : CA_THEME.danger }]}>
          {isHealthy ? '100%' : `${(100 - (alertRatio * 100)).toFixed(0)}%`}
        </Text>
        <Text style={styles.centerLabel}>Santé</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 22,
    fontFamily: CA_THEME.fontFamilyBold,
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: CA_THEME.fontFamily,
    color: CA_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
