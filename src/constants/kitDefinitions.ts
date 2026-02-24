// ============================================
// KIT DEFINITIONS - IT-Inventory Application
// Définition des kits prédéfinis et de leurs articles
// ============================================

export interface KitArticle {
  /** Référence (code barre) de l'article dans Supabase */
  reference: string;
  /** Label affiché dans l'écran kit */
  label: string;
  /** Quantité nécessaire par kit */
  quantite: number;
}

export interface KitDefinition {
  id: string;
  nom: string;
  description: string;
  icon: string;
  color: string;
  gradient: readonly [string, string];
  emoji: string;
  articles: KitArticle[];
}

export const KIT_DEFINITIONS: KitDefinition[] = [
  {
    id: 'kit_audio',
    nom: 'Kit Audio',
    description: 'Casque EPOS + Dongle EPOS',
    icon: 'headset',
    color: '#EC4899',
    gradient: ['#F472B6', '#EC4899'],
    emoji: '🎧',
    articles: [
      { reference: '1100007', label: 'Casque EPOS', quantite: 1 },
      { reference: '1100004', label: 'Dongle EPOS', quantite: 1 },
    ],
  },
  {
    id: 'kit_audio_v2',
    nom: 'Kit Audio',
    description: 'Casque V2 + Dongle Plantronics',
    icon: 'headset',
    color: '#EC4899',
    gradient: ['#F472B6', '#EC4899'],
    emoji: '🎧',
    articles: [
      { reference: '1100006', label: 'Casque V2', quantite: 1 },
      { reference: '1000021', label: 'Dongle Plantronics', quantite: 1 },
    ],
  },
  {
    id: 'kit_audio_v1',
    nom: 'Kit Audio',
    description: 'Casque V1 + Dongle Plantronics',
    icon: 'headset',
    color: '#EC4899',
    gradient: ['#F472B6', '#EC4899'],
    emoji: '🎧',
    articles: [
      { reference: '1100001', label: 'Casque V1', quantite: 1 },
      { reference: '1000021', label: 'Dongle Plantronics', quantite: 1 },
    ],
  },
  {
    id: 'kit_complet',
    nom: 'Kit Complet',
    description: 'Souris filaire + Mickey + USB-C + Casque V1 + Dongle Plantronics',
    icon: 'package-variant',
    color: '#10B981',
    gradient: ['#34D399', '#10B981'],
    emoji: '📦',
    articles: [
      { reference: '1000002', label: 'Souris filaire', quantite: 1 },
      { reference: '1400001', label: 'Mickey (HUB USB)', quantite: 1 },
      { reference: '1200007', label: 'Câble USB-C', quantite: 1 },
      { reference: '1100001', label: 'Casque V1', quantite: 1 },
      { reference: '1000021', label: 'Dongle Plantronics', quantite: 1 },
    ],
  },
  {
    id: 'kit_clavier_souris_cherry',
    nom: 'Kit Clavier Souris CHERRY',
    description: 'Souris SF + Clavier SF CHERRY',
    icon: 'keyboard-variant',
    color: '#CC0000',
    gradient: ['#EF4444', '#CC0000'],
    emoji: '⌨️',
    articles: [
      { reference: '1000002', label: 'Souris SF', quantite: 1 },
      { reference: '1000005', label: 'Clavier SF CHERRY', quantite: 1 },
    ],
  },
  {
    id: 'kit_clavier_souris_dell',
    nom: 'Kit Clavier Souris DELL',
    description: 'Souris SF + Clavier SF DELL',
    icon: 'keyboard-variant',
    color: '#0076CE',
    gradient: ['#3B82F6', '#0076CE'],
    emoji: '⌨️',
    articles: [
      { reference: '1000002', label: 'Souris SF', quantite: 1 },
      { reference: '1000005', label: 'Clavier SF DELL', quantite: 1 },
    ],
  },
  {
    id: 'kit_clavier_souris_urban',
    nom: 'Kit Clavier Souris Urban Factory',
    description: 'Souris SF + Clavier SF Urban Factory',
    icon: 'keyboard-variant',
    color: '#E11D48',
    gradient: ['#FB7185', '#E11D48'],
    emoji: '⌨️',
    articles: [
      { reference: '1000002', label: 'Souris SF', quantite: 1 },
      { reference: '1000020', label: 'Clavier SF Urban Factory', quantite: 1 },
    ],
  },
];
