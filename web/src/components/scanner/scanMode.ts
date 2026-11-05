export type ScanMode = 'camera' | 'wedge' | 'manual';

const scanModeStorageKey = 'it-inventory-web-scan-mode';

export function getDefaultScanMode(isMobile: boolean): ScanMode {
  return isMobile ? 'camera' : 'wedge';
}

export function isScanMode(value: string | null): value is ScanMode {
  return value === 'camera' || value === 'wedge' || value === 'manual';
}

export function readScanModePreference(): ScanMode {
  if (typeof window === 'undefined') return 'wedge';
  try {
    const stored = window.localStorage.getItem(scanModeStorageKey);
    if (isScanMode(stored)) return stored;
  } catch {
    // Private browsing may disable local storage.
  }
  const isMobile = typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 760px)').matches);
  return getDefaultScanMode(isMobile);
}

export function saveScanModePreference(mode: ScanMode): void {
  try {
    window.localStorage.setItem(scanModeStorageKey, mode);
  } catch {
    // The selected mode remains available for the current page.
  }
}
