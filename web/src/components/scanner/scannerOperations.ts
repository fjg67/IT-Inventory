export type ScannerOperation = 'search' | 'entry' | 'exit';
export type ScannerMovementType = 'ENTRY' | 'EXIT';

const quickScanStorageKey = 'it-inventory-web-scanner-quick-scan';

export function getMovementType(operation: ScannerOperation): ScannerMovementType | null {
  if (operation === 'entry') return 'ENTRY';
  if (operation === 'exit') return 'EXIT';
  return null;
}

export function readQuickScanPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(quickScanStorageKey) === 'true';
  } catch {
    return false;
  }
}

export function saveQuickScanPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(quickScanStorageKey, String(enabled));
  } catch {
    // Keep the choice for the current page when storage is unavailable.
  }
}
