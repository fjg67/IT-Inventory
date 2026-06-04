export const SITE_COLORS = {
  epinal: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: 'pine-tree', label: 'Epinal' },
  stock5: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: 'archive-outline', label: 'Stock 5eme' },
  stock8: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'archive-outline', label: 'Stock 8eme' },
  tcs: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: 'tools', label: 'TCS' },
  strasgen: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'city-variant-outline', label: 'Strasbourg General' },
  agences: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: 'map-marker-outline', label: 'Agences' },
} as const;

export type SiteColorKey = keyof typeof SITE_COLORS;

export type SiteVisual = {
  color: string;
  bg: string;
  icon: string;
  label: string;
};

const FALLBACK_SITE_VISUAL: SiteVisual = {
  color: '#22C55E',
  bg: 'rgba(34,197,94,0.12)',
  icon: 'map-marker-outline',
  label: 'Site',
};

export const resolveSiteVisual = (name: string): SiteVisual => {
  const normalized = name.toLowerCase().trim();

  if (normalized.includes('epinal')) return SITE_COLORS.epinal;
  if (normalized.includes('stock 5')) return SITE_COLORS.stock5;
  if (normalized.includes('stock 8')) return SITE_COLORS.stock8;
  if (normalized.includes('tcs')) return SITE_COLORS.tcs;
  if (normalized.includes('strasbourg') || normalized.includes('siege')) return SITE_COLORS.strasgen;
  if (normalized.includes('agence')) return SITE_COLORS.agences;

  return { ...FALLBACK_SITE_VISUAL, label: name || FALLBACK_SITE_VISUAL.label };
};

export interface StockPickerSiteConfig {
  label: string;
  subtitle: string;
  color: string;
  subtle: string;
  border: string;
  icon: string;
  abbr: string;
}

export const STOCK_PICKER_SITE_CONFIG: Record<'epinal' | 'stock_5' | 'stock_8' | 'tcs', StockPickerSiteConfig> = {
  epinal: {
    label: 'Epinal',
    subtitle: 'Epinal, Vosges',
    color: '#22C55E',
    subtle: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.25)',
    icon: 'pine-tree',
    abbr: 'EP',
  },
  stock_5: {
    label: 'Stock 5eme',
    subtitle: '5eme etage, batiment siege',
    color: '#22C55E',
    subtle: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.25)',
    icon: 'office-building',
    abbr: 'S5',
  },
  stock_8: {
    label: 'Stock 8eme',
    subtitle: '8eme etage, batiment siege',
    color: '#F59E0B',
    subtle: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
    icon: 'office-building',
    abbr: 'S8',
  },
  tcs: {
    label: 'TCS',
    subtitle: 'Strasbourg',
    color: '#EF4444',
    subtle: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.25)',
    icon: 'wrench',
    abbr: 'TC',
  },
};

const DEFAULT_STOCK_PICKER_CONFIG: StockPickerSiteConfig = {
  label: 'Site',
  subtitle: 'Site de travail',
  color: '#22C55E',
  subtle: 'rgba(34,197,94,0.10)',
  border: 'rgba(34,197,94,0.25)',
  icon: 'warehouse',
  abbr: 'ST',
};

const toAbbr = (rawName: string): string => {
  const cleaned = rawName
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return DEFAULT_STOCK_PICKER_CONFIG.abbr;
  const chunks = cleaned.split(' ');
  if (chunks.length >= 2) {
    return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
};

export const resolveStockPickerSiteConfig = (siteName: string): StockPickerSiteConfig => {
  const normalized = siteName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (normalized.includes('epinal')) {
    return { ...STOCK_PICKER_SITE_CONFIG.epinal, label: siteName || STOCK_PICKER_SITE_CONFIG.epinal.label };
  }
  if (normalized.includes('stock 5') || normalized.includes('5eme')) {
    return { ...STOCK_PICKER_SITE_CONFIG.stock_5, label: siteName || STOCK_PICKER_SITE_CONFIG.stock_5.label };
  }
  if (normalized.includes('stock 8') || normalized.includes('8eme')) {
    return { ...STOCK_PICKER_SITE_CONFIG.stock_8, label: siteName || STOCK_PICKER_SITE_CONFIG.stock_8.label };
  }
  if (normalized.includes('tcs')) {
    return { ...STOCK_PICKER_SITE_CONFIG.tcs, label: siteName || STOCK_PICKER_SITE_CONFIG.tcs.label };
  }

  return {
    ...DEFAULT_STOCK_PICKER_CONFIG,
    label: siteName || DEFAULT_STOCK_PICKER_CONFIG.label,
    abbr: toAbbr(siteName),
  };
};
