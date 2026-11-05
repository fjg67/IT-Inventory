import type { BarcodeFormat } from 'barcode-detector/ponyfill';

export type DetectedBarcode = { rawValue: string };
export type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorOptions = { formats?: BarcodeFormat[] };
type BarcodeDetectorConstructor = new (options?: BarcodeDetectorOptions) => BarcodeDetectorLike;
type NativeBarcodeDetectorConstructor = BarcodeDetectorConstructor & {
  getSupportedFormats?: () => Promise<readonly BarcodeFormat[]>;
};
type PonyfillBarcodeDetector = typeof import('barcode-detector/ponyfill').BarcodeDetector;

declare global {
  interface Window {
    BarcodeDetector?: NativeBarcodeDetectorConstructor;
  }
}

const scannerFormats: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'code_128',
  'code_39',
  'qr_code',
  'upc_a',
  'upc_e',
];
let ponyfillConstructor: Promise<PonyfillBarcodeDetector> | null = null;

export async function createBarcodeDetector(): Promise<BarcodeDetectorLike> {
  const NativeDetector = typeof window === 'undefined' ? undefined : window.BarcodeDetector;
  if (NativeDetector) {
    const supported = await NativeDetector.getSupportedFormats?.();
    const supportedScannerFormats = supported
      ? scannerFormats.filter((format) => supported.includes(format))
      : undefined;
    if (supported && supportedScannerFormats?.length === 0) {
      return createPonyfillDetector();
    }
    return new NativeDetector(supportedScannerFormats ? { formats: supportedScannerFormats } : undefined);
  }
  return createPonyfillDetector();
}

async function createPonyfillDetector(): Promise<BarcodeDetectorLike> {
  if (!ponyfillConstructor) ponyfillConstructor = loadPonyfillConstructor();
  let BarcodeDetector: PonyfillBarcodeDetector;
  try {
    BarcodeDetector = await ponyfillConstructor;
  } catch (error) {
    ponyfillConstructor = null;
    throw error;
  }
  return new BarcodeDetector({ formats: scannerFormats });
}

async function loadPonyfillConstructor(): Promise<PonyfillBarcodeDetector> {
  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]);
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => path.endsWith('.wasm') ? wasmUrl : `${prefix}${path}`,
    },
  });
  return BarcodeDetector;
}
