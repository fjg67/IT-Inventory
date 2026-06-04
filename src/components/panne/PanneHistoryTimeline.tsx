import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PCPanne, REPARATION_CONFIG, PANNE_TYPE_CONFIG, PRIORITE_CONFIG } from '@/types/pc.types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { formatDate } from '@/utils/dateUtils';

interface PanneHistoryTimelineProps {
  pannes: PCPanne[];
}

interface TimelineEvent {
  type: 'declared' | 'repair_started' | 'resolved' | 'irreparable';
  label: string;
  description?: string;
  date: string;
  author: string;
  color: string;
}

const buildTimelineEvents = (pannes: PCPanne[]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  for (const panne of pannes) {
    const typeConfig = PANNE_TYPE_CONFIG[panne.type_panne];
    const prioriteConfig = PRIORITE_CONFIG[panne.priorite];
    const reparationConfig = REPARATION_CONFIG[panne.statut_reparation];

    // Déclaration initiale
    events.push({
      type: 'declared',
      label: `${typeConfig.label} - ${prioriteConfig.label}`,
      description: panne.description,
      date: panne.declared_at,
      author: panne.technicien_id ?? 'Utilisateur',
      color: typeConfig.color,
    });

    // Mise en réparation
    if (panne.statut_reparation === 'en_reparation') {
      events.push({
        type: 'repair_started',
        label: 'Mise en réparation',
        description: panne.ticket_sav ? `Ticket: ${panne.ticket_sav}` : undefined,
        date: panne.updated_at,
        author: panne.technicien_id ?? 'Utilisateur',
        color: '#F59E0B',
      });
    }

    // Résolution
    if (panne.statut_reparation === 'resolu' && panne.resolu_at) {
      events.push({
        type: 'resolved',
        label: 'Résolu',
        description: panne.note_resolution,
        date: panne.resolu_at,
        author: panne.resolu_par ?? 'Utilisateur',
        color: '#22C55E',
      });
    }

    // Irréparable
    if (panne.statut_reparation === 'irreparable' && panne.resolu_at) {
      events.push({
        type: 'irreparable',
        label: 'Déclaré irréparable',
        description: panne.note_resolution,
        date: panne.resolu_at,
        author: panne.resolu_par ?? 'Utilisateur',
        color: '#6B7280',
      });
    }
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const PanneHistoryTimeline: React.FC<PanneHistoryTimelineProps> = ({ pannes }) => {
  const events = useMemo(() => buildTimelineEvents(pannes), [pannes]);

  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="calendar-blank-outline" size={32} color={OBSIDIAN_COLORS.text_muted} />
        <Text style={styles.emptyText}>Aucun événement</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => (
        <View key={`${event.date}-${event.type}`} style={styles.item}>
          <View style={styles.leftCol}>
            <View style={[styles.dot, { backgroundColor: event.color }]} />
            {index < events.length - 1 && <View style={styles.line} />}
          </View>

          <View style={styles.content}>
            <Text style={[styles.eventLabel, { color: event.color }]}>{event.label}</Text>
            {event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
            <Text style={styles.eventMeta}>
              {formatDate(event.date)} · {event.author}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  leftCol: {
    alignItems: 'center',
    width: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 3,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 4,
  },
  eventLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  eventMeta: {
    fontSize: 10,
    color: '#374151',
    marginTop: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.text_muted,
  },
});
