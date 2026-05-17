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
