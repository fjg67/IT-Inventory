import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { QuickActionCard } from './QuickActionCard';
import { SectionHeader } from './SectionHeader';

interface QuickActionsGridProps {
  isSuperviseur: boolean;
  onEntree: () => void;
  onSortie: () => void;
  onAjustement: () => void;
  onTransfert: () => void;
}

const QuickActionsGridComponent: React.FC<QuickActionsGridProps> = ({
  isSuperviseur,
  onEntree,
  onSortie,
  onAjustement,
  onTransfert,
}) => {
  return (
    <View style={styles.container}>
      <SectionHeader title="ACTIONS RAPIDES" />

      <View style={styles.grid}>
        {!isSuperviseur ? (
          <QuickActionCard
            title="Entree"
            icon="arrow-down-circle-outline"
            color={OBSIDIAN_COLORS.green_primary}
            subtleColor={OBSIDIAN_COLORS.green_subtle}
            onPress={onEntree}
          />
        ) : null}

        {!isSuperviseur ? (
          <QuickActionCard
            title="Sortie"
            icon="arrow-up-circle-outline"
            color={OBSIDIAN_COLORS.danger}
            subtleColor={OBSIDIAN_COLORS.danger_subtle}
            onPress={onSortie}
          />
        ) : null}

        <QuickActionCard
          title="Ajustement"
          icon="tune-variant"
          color={OBSIDIAN_COLORS.warning}
          subtleColor={OBSIDIAN_COLORS.warning_subtle}
          onPress={onAjustement}
        />

        {!isSuperviseur ? (
          <QuickActionCard
            title="Transfert"
            icon="swap-horizontal"
            color={OBSIDIAN_COLORS.purple}
            subtleColor={OBSIDIAN_COLORS.purple_subtle}
            onPress={onTransfert}
          />
        ) : null}
      </View>
    </View>
  );
};

export const QuickActionsGrid = React.memo(QuickActionsGridComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  grid: {
    gap: 12,
    marginTop: 2,
  },
});
