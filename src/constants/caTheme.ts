export const CA_THEME = {
  // Verts CA officiels (Nouveau Teal CA)
  green:         '#007D70',   // Teal principal CA (header, boutons primaires)
  greenDark:     '#006359',   // Teal foncé (hover, pressed)
  greenLight:    '#00A391',   // Teal clair (accents, highlights)
  greenBg:       '#E5F2F0',   // Teal très clair (backgrounds cartes OK)
  greenBg2:      '#B2DFD9',   // Teal moyen (bordures, dividers)
  greenText:     '#00544B',   // Teal texte (labels sur fond clair)

  // Fonds
  white:         '#FFFFFF',   // fond cartes, header vert clair
  lightGray:     '#F5F5F0',   // fond page (légèrement chaud comme CA.fr)
  borderGray:    '#E0E0D8',   // bordures (même ton chaud)

  // Textes
  textPrimary:   '#1A1A1A',   // texte principal
  textSecondary: '#5A5A55',   // texte secondaire
  textMuted:     '#888880',   // texte discret

  // Sémantiques
  danger:        '#D32F2F',   // rouge (alertes, sorties)
  dangerBg:      '#FFEBEE',   // rouge clair (backgrounds alertes)
  dangerText:    '#7F1D1D',   // texte rouge foncé
  warning:       '#E65100',   // orange (ajustements, warnings)
  warningBg:     '#FFF3E0',   // orange clair
  warningText:   '#7C2D12',   // texte orange foncé
  info:          '#1565C0',   // bleu (consultation, info)
  infoBg:        '#E3F2FD',   // bleu clair
  infoText:      '#1E3A8A',   // texte bleu foncé
  purple:        '#6B21A8',   // violet (transferts)
  purpleBg:      '#F3E8FF',   // violet clair
  purpleText:    '#4C1D95',   // texte violet foncé

  // Typographie
  fontFamilyRegular:   'Montserrat_400Regular',
  fontFamilyMedium:    'Montserrat_500Medium',
  fontFamilySemiBold:  'Montserrat_600SemiBold',
  fontFamilyBold:      'Montserrat_700Bold',

  fontRegular:   400,
  fontMedium:    500,
  fontSemiBold:  600,
  fontBold:      700,
} as const;

export const PC_STATUS_CA = {
  a_chaud: {
    color:     CA_THEME.green,
    subtle:    CA_THEME.greenBg,
    border:    CA_THEME.greenBg2,
    textDark:  CA_THEME.greenText,
    icon:      'flash',
    label:     'À chaud',
  },
  a_reusiner: {
    color:     CA_THEME.warning,
    subtle:    CA_THEME.warningBg,
    border:    'rgba(230,81,0,0.25)',
    textDark:  CA_THEME.warningText,
    icon:      'wrench',
    label:     'À reusiner',
  },
  en_usinage: {
    color:     CA_THEME.warning,
    subtle:    CA_THEME.warningBg,
    border:    'rgba(230,81,0,0.20)',
    textDark:  CA_THEME.warningText,
    icon:      'cog',
    label:     'En usinage',
  },
  disponible: {
    color:     CA_THEME.info,
    subtle:    CA_THEME.infoBg,
    border:    'rgba(21,101,192,0.25)',
    textDark:  CA_THEME.infoText,
    icon:      'check-circle',
    label:     'Disponible',
  },
  en_panne: {
    color:     CA_THEME.danger,
    subtle:    CA_THEME.dangerBg,
    border:    'rgba(211,47,47,0.25)',
    textDark:  CA_THEME.dangerText,
    icon:      'laptop-off',
    label:     'En panne',
  },
  envoye: {
    color:     CA_THEME.purple,
    subtle:    CA_THEME.purpleBg,
    border:    'rgba(107,33,168,0.22)',
    textDark:  CA_THEME.purpleText,
    icon:      'send',
    label:     'Envoyé',
  },
} as const;

export const MOVEMENT_TYPE_CA = {
  entree: {
    color:     CA_THEME.green,
    subtle:    CA_THEME.greenBg,
    border:    CA_THEME.greenBg2,
    textDark:  CA_THEME.greenText,
    icon:      'arrow-down-circle',
    label:     'Entrée',
    prefix:    '+',
  },
  sortie: {
    color:     CA_THEME.danger,
    subtle:    CA_THEME.dangerBg,
    border:    'rgba(211,47,47,0.25)',
    textDark:  CA_THEME.dangerText,
    icon:      'arrow-up-circle',
    label:     'Sortie',
    prefix:    '-',
  },
  ajustement: {
    color:     CA_THEME.warning,
    subtle:    CA_THEME.warningBg,
    border:    'rgba(230,81,0,0.22)',
    textDark:  CA_THEME.warningText,
    icon:      'tune-variant',
    label:     'Ajustement',
    prefix:    '±',
  },
  transfert: {
    color:     CA_THEME.purple,
    subtle:    CA_THEME.purpleBg,
    border:    'rgba(107,33,168,0.20)',
    textDark:  CA_THEME.purpleText,
    icon:      'swap-horizontal',
    label:     'Transfert',
    prefix:    '~',
  },
} as const;
