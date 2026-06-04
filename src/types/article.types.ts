export type ArticleCondition = 'bon_etat' | 'defectueux';

export interface ConditionConfig {
  label: string;
  labelShort: string;
  color: string;
  subtle: string;
  border: string;
  icon: string;
  badgeText: (count?: number) => string;
}

export const CONDITION_CONFIG: Record<ArticleCondition, ConditionConfig> = {
  bon_etat: {
    label: 'Bon etat',
    labelShort: 'Bon etat',
    color: '#22C55E',
    subtle: 'rgba(34, 197, 94, 0.10)',
    border: 'rgba(34, 197, 94, 0.30)',
    icon: 'check-circle-outline',
    badgeText: () => 'Bon etat',
  },
  defectueux: {
    label: 'Defectueux',
    labelShort: 'Defectueux',
    color: '#EF4444',
    subtle: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
    icon: 'alert-circle-outline',
    badgeText: (count) => (count && count > 0 ? `${count} defectueux` : 'Defectueux'),
  },
};
