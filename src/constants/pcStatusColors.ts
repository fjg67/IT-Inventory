import { PCStatus } from '@/types/pc.types';
import { CA_THEME, PC_STATUS_CA } from './caTheme';

export interface PCStatusUIConfig {
  color: string;
  subtle: string;
  border: string;
  heroGlow: string;
  icon: string;
  label: string;
  buttonColor: string;
}

export const PC_STATUS_UI: Record<PCStatus, PCStatusUIConfig> = {
  a_chaud: {
    color: PC_STATUS_CA.a_chaud.color,
    subtle: PC_STATUS_CA.a_chaud.subtle,
    border: PC_STATUS_CA.a_chaud.border,
    heroGlow: 'rgba(0,125,112,0.1)',
    icon: PC_STATUS_CA.a_chaud.icon,
    label: PC_STATUS_CA.a_chaud.label,
    buttonColor: CA_THEME.greenDark,
  },
  a_reusiner: {
    color: PC_STATUS_CA.a_reusiner.color,
    subtle: PC_STATUS_CA.a_reusiner.subtle,
    border: PC_STATUS_CA.a_reusiner.border,
    heroGlow: 'rgba(230,81,0,0.1)',
    icon: PC_STATUS_CA.a_reusiner.icon,
    label: PC_STATUS_CA.a_reusiner.label,
    buttonColor: '#E65100', // CA warning base color
  },
  en_usinage: {
    color: PC_STATUS_CA.en_usinage.color,
    subtle: PC_STATUS_CA.en_usinage.subtle,
    border: PC_STATUS_CA.en_usinage.border,
    heroGlow: 'rgba(230,81,0,0.08)',
    icon: PC_STATUS_CA.en_usinage.icon,
    label: PC_STATUS_CA.en_usinage.label,
    buttonColor: '#E65100',
  },
  disponible: {
    color: PC_STATUS_CA.disponible.color,
    subtle: PC_STATUS_CA.disponible.subtle,
    border: PC_STATUS_CA.disponible.border,
    heroGlow: 'rgba(21,101,192,0.1)',
    icon: PC_STATUS_CA.disponible.icon,
    label: PC_STATUS_CA.disponible.label,
    buttonColor: '#1565C0',
  },
  envoye: {
    color: PC_STATUS_CA.envoye.color,
    subtle: PC_STATUS_CA.envoye.subtle,
    border: PC_STATUS_CA.envoye.border,
    heroGlow: 'rgba(107,33,168,0.1)',
    icon: PC_STATUS_CA.envoye.icon,
    label: PC_STATUS_CA.envoye.label,
    buttonColor: '#6B21A8',
  },
  en_panne: {
    color: PC_STATUS_CA.en_panne.color,
    subtle: PC_STATUS_CA.en_panne.subtle,
    border: PC_STATUS_CA.en_panne.border,
    heroGlow: 'rgba(211,47,47,0.1)',
    icon: PC_STATUS_CA.en_panne.icon,
    label: PC_STATUS_CA.en_panne.label,
    buttonColor: '#D32F2F',
  },
};

export const PC_DEFAULT_UI: PCStatusUIConfig = {
  color: CA_THEME.green,
  subtle: CA_THEME.greenBg,
  border: CA_THEME.greenBg2,
  heroGlow: 'rgba(0,125,112,0.10)',
  icon: 'laptop',
  label: 'Sélectionner un statut',
  buttonColor: CA_THEME.greenDark,
};
