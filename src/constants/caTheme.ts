export const CA_THEME = {
  // Verts CA officiels (Vert Forêt CA - credit-agricole.fr)
  green:         '#1E6B52',   // Vert principal CA (header, boutons primaires)
  greenDark:     '#145540',   // Vert foncé (hover, pressed)
  greenLight:    '#3D8B6E',   // Vert clair (accents, highlights)
  greenBg:       '#E8F5EF',   // Vert très clair (backgrounds cartes OK)
  greenBg2:      '#B5D9C6',   // Vert moyen (bordures, dividers)
  greenText:     '#145540',   // Vert texte (labels sur fond clair)

  // Fonds
  white:         '#FFFFFF',   // fond cartes, header vert clair
  lightGray:     '#F4F5F7',   // fond page (Gris perle)
  borderGray:    '#E0E0E0',   // bordures

  // Textes
  textPrimary:   '#1A1A1A',   // texte principal
  textSecondary: '#5A5A55',   // texte secondaire
  textMuted:     '#888880',   // texte discret

  // Sémantiques
  danger:        '#E52454',   // rouge (alertes, sorties)
  dangerBg:      '#FDEDF1',   // rouge clair (backgrounds alertes)
  dangerText:    '#A0193B',   // texte rouge foncé
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
