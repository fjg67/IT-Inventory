import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTablet as checkIsTablet } from '../../../utils/responsive';
import AnimatedCounter from '../../Dashboard/components/effects/AnimatedCounter';
import {
  premiumColors,
  premiumTypography,
  premiumSpacing,
  premiumBorderRadius,
} from '../../../constants/premiumTheme';

interface MiniStatProps {
  value: number;
  label: string;
  color?: string;
}

const MiniStatCard: React.FC<MiniStatProps> = ({ value, label, color }) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);
  return (
  <View style={[miniStyles.card, tablet && { paddingVertical: premiumSpacing.md, paddingHorizontal: premiumSpacing.sm }]}>
    <AnimatedCounter
      value={value}
      style={{
        fontSize: tablet ? 28 : 22,
        fontWeight: '700',
        color: color || '#FFFFFF',
      }}
    />
    <Text style={[miniStyles.label, tablet && { fontSize: 13 }]}>{label}</Text>
  </View>
);
};

const miniStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: premiumBorderRadius.md,
    paddingVertical: premiumSpacing.sm,
    paddingHorizontal: premiumSpacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
});

interface PremiumArticleHeaderProps {
  totalArticles: number;
  stockOK: number;
  alertes: number;
  onAdd: () => void;
  onBack?: () => void;
}

const PremiumArticleHeader: React.FC<PremiumArticleHeaderProps> = ({
  totalArticles,
  stockOK,
  alertes,
  onAdd,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const tablet = checkIsTablet(width);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <LinearGradient
        colors={[...premiumColors.gradients.scanButton]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, tablet && { paddingTop: premiumSpacing.xxl, paddingBottom: premiumSpacing.xl, paddingHorizontal: premiumSpacing.xl }]}
      >
        {/* Top Row */}
        <View style={styles.topRow}>
          {onBack ? (
            <TouchableOpacity
              onPress={() => { Vibration.vibrate(10); onBack(); }}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={tablet ? 28 : 24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}

          <Text style={[styles.title, tablet && { fontSize: 28 }]}>Articles</Text>

          <View style={styles.iconButton} />
        </View>

        {/* Mini Stats */}
        <View style={styles.statsRow}>
          <MiniStatCard value={totalArticles} label="Total" />
          <MiniStatCard
            value={stockOK}
            label="Stock OK"
            color={premiumColors.success.light}
          />
          <MiniStatCard
            value={alertes}
            label="Alertes"
            color={premiumColors.warning.light}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: premiumSpacing.xl,
    paddingBottom: premiumSpacing.lg,
    paddingHorizontal: premiumSpacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: premiumSpacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...premiumTypography.h1,
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: premiumSpacing.sm,
  },
});

export default PremiumArticleHeader;
