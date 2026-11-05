import { getDefaultScanMode, isScanMode, readScanModePreference, saveScanModePreference } from '../web/src/components/scanner/scanMode';
import { getMovementType, readQuickScanPreference, saveQuickScanPreference } from '../web/src/components/scanner/scannerOperations';
import { isRapidBarcodeSequence } from '../web/src/components/scanner/useBarcodeWedge';

describe('modes de scan Web', () => {
  it('choisit la caméra sur mobile et la douchette sur poste fixe', () => {
    expect(getDefaultScanMode(true)).toBe('camera');
    expect(getDefaultScanMode(false)).toBe('wedge');
  });

  it('n’accepte que les modes connus', () => {
    expect(isScanMode('camera')).toBe(true);
    expect(isScanMode('wedge')).toBe(true);
    expect(isScanMode('manual')).toBe(true);
    expect(isScanMode('unknown')).toBe(false);
    expect(isScanMode(null)).toBe(false);
  });

  it('associe les actions du scanner aux types de mouvement existants', () => {
    expect(getMovementType('entry')).toBe('ENTRY');
    expect(getMovementType('exit')).toBe('EXIT');
    expect(getMovementType('search')).toBeNull();
  });
});

describe('préférence du mode de scan', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => values.get(key) ?? null,
          setItem: (key: string, value: string) => values.set(key, value),
        },
        matchMedia: () => ({ matches: false }),
      },
    });
  });

  afterAll(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  });

  it('conserve le mode choisi entre les visites', () => {
    saveScanModePreference('manual');
    expect(readScanModePreference()).toBe('manual');
  });

  it('conserve le réglage de scan rapide', () => {
    expect(readQuickScanPreference()).toBe(false);
    saveQuickScanPreference(true);
    expect(readQuickScanPreference()).toBe(true);
  });
});

describe('détection de saisie douchette', () => {
  it('identifie une séquence rapide terminée par Entrée', () => {
    expect(isRapidBarcodeSequence({ firstAt: 100, lastAt: 500, count: 8 }, 620)).toBe(true);
  });

  it('ignore une saisie trop lente ou une séquence d’une seule touche', () => {
    expect(isRapidBarcodeSequence({ firstAt: 100, lastAt: 350, count: 8 }, 610)).toBe(false);
    expect(isRapidBarcodeSequence({ firstAt: 100, lastAt: 500, count: 1 }, 620)).toBe(false);
  });
});
