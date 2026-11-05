import { ScanViewport } from './ScanViewport';
import type { ScannerCameraController } from './useCamera';

export function CameraScanner({ camera }: { camera: ScannerCameraController }) {
  return (
    <div className="scan-camera">
      <ScanViewport mode="camera" state={camera.scanState}>
        <video
          className={`scan-camera__video${camera.stream ? ' is-live' : ''}`}
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Caméra de lecture des codes-barres"
        />
        {!camera.stream && (
          <div className="scan-camera__empty">
            <span className="scan-camera__reticle" aria-hidden="true"><i /><i /><i /><i /></span>
            <strong>{camera.isStarting ? 'Préparation du poste de scan…' : camera.error ? 'Caméra indisponible' : 'Ouvrez la caméra pour commencer'}</strong>
            <span>La caméra reste arrêtée jusqu’à votre demande.</span>
            <button className="button button--primary" type="button" onClick={() => void camera.start()} disabled={camera.isStarting}>
              {camera.isStarting ? 'Ouverture…' : 'Ouvrir la caméra'}
            </button>
          </div>
        )}
      </ScanViewport>

      {camera.error && <div className="scanner-message" role="alert">{camera.error}</div>}

      {camera.stream && (
        <>
          <div className="scan-camera__toolbar">
            {camera.devices.length > 1 && (
              <label>
                <span>Caméra</span>
                <select value={camera.selectedDeviceId} onChange={(event) => void camera.selectCamera(event.currentTarget.value)}>
                  {camera.devices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Caméra ${index + 1}`}</option>
                  ))}
                </select>
              </label>
            )}
            {camera.torchAvailable && (
              <button className="scan-camera__toggle" type="button" aria-pressed={camera.torchOn} onClick={() => void camera.setTorch(!camera.torchOn)}>
                {camera.torchOn ? 'Éteindre la lampe' : 'Allumer la lampe'}
              </button>
            )}
            <button className="scan-camera__toggle scan-camera__toggle--stop" type="button" onClick={camera.stop}>Arrêter la caméra</button>
          </div>
          {camera.zoomRange && camera.zoom !== null && (
            <label className="scan-camera__zoom">
              <span>Zoom</span>
              <input
                type="range"
                min={camera.zoomRange.min}
                max={camera.zoomRange.max}
                step={camera.zoomRange.step || 0.1}
                value={camera.zoom}
                onChange={(event) => void camera.setZoom(Number(event.currentTarget.value))}
              />
            </label>
          )}
        </>
      )}
    </div>
  );
}
