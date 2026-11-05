import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getCameraCapabilityMessage, getCameraErrorMessage, queryCameraPermission } from './cameraErrors';
import { createBarcodeDetector, type BarcodeDetectorLike } from './useBarcodeDecoder';
import type { ScanVisualState } from './ScanViewport';
import { isMotionReduced } from '../invenbot/motion';

type ScannerRange = { min: number; max: number; step?: number };
type ScannerTrackCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  zoom?: ScannerRange;
};
type ScannerTrackSettings = MediaTrackSettings & { zoom?: number };
type TorchConstraint = MediaTrackConstraintSet & { torch: boolean };
type ZoomConstraint = MediaTrackConstraintSet & { zoom: number };

export interface ScannerCameraController {
  videoRef: RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isStarting: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  torchAvailable: boolean;
  torchOn: boolean;
  zoomRange: ScannerRange | null;
  zoom: number | null;
  scanState: ScanVisualState;
  start: (deviceId?: string) => Promise<void>;
  stop: () => void;
  selectCamera: (deviceId: string) => Promise<void>;
  setTorch: (enabled: boolean) => Promise<void>;
  setZoom: (value: number) => Promise<void>;
}

export function useCamera(enabled: boolean, onCode: (code: string) => void): ScannerCameraController {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const requestIdRef = useRef(0);
  const onCodeRef = useRef(onCode);
  const lastCodeRef = useRef({ code: '', detectedAt: 0 });
  const flashUntilRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getCameraCapabilityMessage(window.isSecureContext, Boolean(navigator.mediaDevices?.getUserMedia));
  });
  const [isStarting, setIsStarting] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomRange, setZoomRange] = useState<ScannerRange | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [scanState, setScanState] = useState<ScanVisualState>('idle');

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setStream(null);
    setIsStarting(false);
    setTorchAvailable(false);
    setTorchOn(false);
    setZoomRange(null);
    setZoom(null);
    setScanState('idle');
  }, []);

  const start = useCallback(async (deviceId = selectedDeviceId) => {
    stop();
    const requestId = ++requestIdRef.current;
    setError(null);
    setIsStarting(true);
    const capabilityMessage = getCameraCapabilityMessage(
      window.isSecureContext,
      Boolean(navigator.mediaDevices?.getUserMedia),
    );
    if (capabilityMessage) {
      setError(capabilityMessage);
      setIsStarting(false);
      return;
    }

    if (await queryCameraPermission() === 'denied') {
      if (requestId === requestIdRef.current) {
        setError(getCameraErrorMessage({ name: 'NotAllowedError' }));
        setIsStarting(false);
      }
      return;
    }
    if (requestId !== requestIdRef.current) return;

    let acquiredStream: MediaStream | null = null;
    try {
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } },
      });
      if (requestId !== requestIdRef.current) {
        acquiredStream.getTracks().forEach((track) => track.stop());
        return;
      }
      let detector: BarcodeDetectorLike;
      try {
        detector = await createBarcodeDetector();
      } catch {
        acquiredStream.getTracks().forEach((track) => track.stop());
        if (requestId === requestIdRef.current) {
          setError('Le décodeur de codes-barres n’a pas pu être chargé. Vérifiez votre connexion ou réessayez.');
          setIsStarting(false);
        }
        return;
      }
      if (requestId !== requestIdRef.current) {
        acquiredStream.getTracks().forEach((track) => track.stop());
        return;
      }
      const activeTrack = acquiredStream.getVideoTracks()[0];
      const settings = activeTrack?.getSettings() as ScannerTrackSettings | undefined;
      let capabilities: ScannerTrackCapabilities | undefined;
      try {
        capabilities = activeTrack?.getCapabilities?.() as ScannerTrackCapabilities | undefined;
      } catch {
        capabilities = undefined;
      }
      streamRef.current = acquiredStream;
      detectorRef.current = detector;
      setStream(acquiredStream);
      setSelectedDeviceId(settings?.deviceId ?? deviceId);
      setTorchAvailable(capabilities?.torch === true);
      const range = capabilities?.zoom ?? null;
      setZoomRange(range);
      setZoom(range ? settings?.zoom ?? range.min : null);
      setIsStarting(false);
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const availableDevices = (await navigator.mediaDevices.enumerateDevices()).filter((item) => item.kind === 'videoinput');
          if (requestId === requestIdRef.current) setDevices(availableDevices);
        } catch {
          if (requestId === requestIdRef.current) {
            setError('La caméra fonctionne, mais la liste des caméras disponibles n’a pas pu être chargée.');
          }
        }
      }
    } catch (cause) {
      acquiredStream?.getTracks().forEach((track) => track.stop());
      if (requestId === requestIdRef.current) {
        setError(getCameraErrorMessage(cause));
        setIsStarting(false);
      }
    }
  }, [selectedDeviceId, stop]);

  const selectCamera = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await start(deviceId);
  }, [start]);

  const setTorch = useCallback(async (enabled: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled } as TorchConstraint] });
      setTorchOn(enabled);
      setError(null);
    } catch {
      setError('La lampe de cette caméra n’a pas pu être activée.');
    }
  }, []);

  const setZoomValue = useCallback(async (value: number) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value } as ZoomConstraint] });
      setZoom(value);
      setError(null);
    } catch {
      setError('Le zoom de cette caméra n’a pas pu être modifié.');
    }
  }, []);

  useEffect(() => {
    if (enabled) return;
    stop();
  }, [enabled, stop]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [stop]);

  useEffect(() => () => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!stream || !detectorRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    const activeVideo: HTMLVideoElement = video;
    const activeDetector = detectorRef.current;
    activeVideo.srcObject = stream;
    let stopped = false;
    let scanTimer = 0;
    let resetTimer = 0;
    let detectionInProgress = false;

    async function scan() {
      if (stopped) return;
      if (detectionInProgress || activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        scanTimer = window.setTimeout(() => void scan(), 180);
        return;
      }
      detectionInProgress = true;
      if (Date.now() >= flashUntilRef.current) setScanState('scanning');
      try {
        const codes = await activeDetector.detect(activeVideo);
        const code = codes.find((item) => item.rawValue.trim())?.rawValue.trim();
        const now = Date.now();
        if (code && (code !== lastCodeRef.current.code || now - lastCodeRef.current.detectedAt >= 2000)) {
          lastCodeRef.current = { code, detectedAt: now };
          if (isMotionReduced()) {
            flashUntilRef.current = 0;
            window.clearTimeout(resetTimer);
            setScanState('scanning');
          } else {
            flashUntilRef.current = now + 700;
            setScanState('success');
            window.clearTimeout(resetTimer);
            resetTimer = window.setTimeout(() => {
              flashUntilRef.current = 0;
              setScanState('scanning');
            }, 700);
            navigator.vibrate?.(45);
          }
          onCodeRef.current(code);
        }
      } catch {
        if (!stopped) {
          setError('La lecture du code a échoué. Vérifiez qu’il est visible, puis réessayez.');
          stop();
          setScanState('error');
        }
        return;
      } finally {
        detectionInProgress = false;
      }
      if (!stopped) scanTimer = window.setTimeout(() => void scan(), 180);
    }

    void activeVideo.play().then(() => scan()).catch((cause: unknown) => {
      if (!stopped) {
        setError(getCameraErrorMessage(cause));
        stop();
        setScanState('error');
      }
    });
    return () => {
      stopped = true;
      window.clearTimeout(scanTimer);
      window.clearTimeout(resetTimer);
      stream.getTracks().forEach((track) => track.stop());
      if (activeVideo.srcObject === stream) activeVideo.srcObject = null;
    };
  }, [stream, stop]);

  return {
    videoRef,
    stream,
    error,
    isStarting,
    devices,
    selectedDeviceId,
    torchAvailable,
    torchOn,
    zoomRange,
    zoom,
    scanState,
    start,
    stop,
    selectCamera,
    setTorch,
    setZoom: setZoomValue,
  };
}
