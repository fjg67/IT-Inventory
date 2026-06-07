import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { SlideContent } from '../components/SlideContent';

type SlideMultiSiteProps = {
  isActive: boolean;
};

type SiteNodeItem = {
  abbr: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  size: number;
  isActive: boolean;
};

const SITES: SiteNodeItem[] = [
  {
    abbr: 'EP',
    label: 'Epinal',
    color: '#F59E0B',
    subtle: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    size: 56,
    isActive: false,
  },
  {
    abbr: 'S5',
    label: 'Stock 5eme',
    color: '#22C55E',
    subtle: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.45)',
    size: 72,
    isActive: true,
  },
  {
    abbr: 'S8',
    label: 'Stock 8eme',
    color: '#3B82F6',
    subtle: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.30)',
    size: 56,
    isActive: false,
  },
];

const SiteNode: React.FC<{ site: SiteNodeItem; active: boolean }> = ({ site, active }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(pulse);

    if (!active || !site.isActive) {
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [active, pulse, site.isActive]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.siteNodeWrap, nodeStyle]}>
      {site.isActive ? <View style={[styles.activeRing, { borderColor: site.border }]} /> : null}
      <View
        style={[
          styles.siteBubble,
          {
            width: site.size,
            height: site.size,
            borderRadius: site.size / 2,
            borderColor: site.border,
            backgroundColor: site.subtle,
          },
        ]}
      >
        <Text style={[styles.siteAbbr, { color: site.color }]}>{site.abbr}</Text>
      </View>
      <Text style={[styles.siteLabel, { color: site.color }]}>{site.label}</Text>
      {site.isActive ? (
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Actif</Text>
        </View>
      ) : null}
    </Animated.View>
  );
};

export const SlideMultiSite: React.FC<SlideMultiSiteProps> = ({ isActive }) => (
  <OnboardingSlide>
    <View style={styles.illustrationWrap}>
      <View style={styles.nodesRow}>
        {SITES.map((site, i) => (
          <React.Fragment key={site.abbr}>
            {i > 0 ? (
              <View style={styles.connectorWrap}>
                <View style={styles.connector} />
              </View>
            ) : null}
            <SiteNode site={site} active={isActive} />
          </React.Fragment>
        ))}
      </View>

      <View style={styles.transferBadge}>
        <Icon name="source-branch" size={13} color="#FCD34D" />
        <Text style={styles.transferText}>Transferts entre sites simplifies</Text>
      </View>
    </View>

    <SlideContent
      title="Gestion multi-sites"
      description="Passez d'un stock a un autre simplement pour synchroniser vos mouvements sans friction."
    />
  </OnboardingSlide>
);

const styles = StyleSheet.create({
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  nodesRow: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  connectorWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 34,
  },
  connector: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(245,158,11,0.24)',
  },
  siteNodeWrap: {
    alignItems: 'center',
    minWidth: 86,
  },
  activeRing: {
    position: 'absolute',
    top: -8,
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    opacity: 0.55,
  },
  siteBubble: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteAbbr: {
    fontWeight: '800',
    fontSize: 21,
    letterSpacing: -0.3,
  },
  siteLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  activePill: {
    marginTop: 4,
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#86EFAC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.24)',
  },
  transferText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCD34D',
  },
});
