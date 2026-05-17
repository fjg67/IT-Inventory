import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MovementIdentity } from './movementTheme';
import { StockSiteChip } from './StockSiteChip';

interface SiteItem {
  id: string | number;
  nom: string;
}

interface Props {
  title: string;
  identity: MovementIdentity;
  sites: SiteItem[];
  selectedSiteId?: string | number | null;
  onSelectSite: (id: string | number) => void;
}

export const StockSiteGrid: React.FC<Props> = ({
  title,
  identity,
  sites,
  selectedSiteId,
  onSelectSite,
}) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.accent, { backgroundColor: identity.color }]} />
        <Text style={[styles.title, { color: identity.color }]}>{title}</Text>
      </View>
      <View style={styles.grid}>
        {sites.map((site) => (
          <View key={String(site.id)} style={styles.col}>
            <StockSiteChip
              label={site.nom}
              selected={String(site.id) === String(selectedSiteId)}
              identity={identity}
              onPress={() => onSelectSite(site.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  col: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
});
