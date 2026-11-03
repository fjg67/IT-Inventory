import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { ArticlePage as ArticlePageData } from '../types/inventory';
import { articleService } from '../services/articleService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = new () => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

export function ScannerPage({ siteId }: { siteId?: string }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<ArticlePageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [reload, setReload] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    cameraRef.current?.getTracks().forEach((track) => track.stop());
    cameraRef.current = null;
    setCameraStream(null);
  }, []);

  useEffect(() => {
    if (!siteId || !search) {
      setResult(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    articleService.getPage(siteId, { search, stock: 'all', page: 0, pageSize: 25 }, controller.signal)
      .then(setResult)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, search, reload]);

  useEffect(() => {
    if (!cameraStream) return;
    const Detector = window.BarcodeDetector;
    const video = videoRef.current;
    if (!Detector || !video) return;
    video.srcObject = cameraStream;
    let stopped = false;
    let timer = 0;
    const detector = new Detector();

    async function scanFrame() {
      if (stopped || !video) return;
      try {
        const detected = await detector.detect(video);
        const code = detected.find((item) => item.rawValue.trim())?.rawValue.trim();
        if (code) {
          setQuery(code);
          setSearch(code);
          setCameraMessage('Code détecté. Recherche dans le stock…');
          stopCamera();
          return;
        }
      } catch {
        if (!stopped) setCameraMessage('La lecture caméra a échoué. Vous pouvez saisir le code manuellement.');
        stopCamera();
        return;
      }
      if (!stopped) timer = window.setTimeout(scanFrame, 250);
    }

    void video.play().then(scanFrame).catch(() => {
      setCameraMessage('Impossible de démarrer la caméra. Vérifiez son autorisation ou saisissez le code manuellement.');
      stopCamera();
    });
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      cameraStream.getTracks().forEach((track) => track.stop());
      if (video.srcObject === cameraStream) video.srcObject = null;
    };
  }, [cameraStream, stopCamera]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  useEffect(() => () => {
    cameraRequestRef.current += 1;
    cameraRef.current?.getTracks().forEach((track) => track.stop());
    cameraRef.current = null;
  }, []);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Le scanner recherche une référence uniquement dans le stock du site actif et de ses sous-sites." />;
  }

  async function startCamera() {
    setCameraMessage(null);
    if (!window.BarcodeDetector) {
      setCameraMessage('La lecture caméra n’est pas prise en charge par ce navigateur. Saisissez le code-barres ci-dessous.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('La caméra n’est pas disponible dans ce contexte. Saisissez le code-barres ci-dessous.');
      return;
    }
    const requestId = ++cameraRequestRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      cameraRef.current = stream;
      setCameraStream(stream);
    } catch {
      setCameraMessage('Accès caméra refusé ou indisponible. Vérifiez les autorisations du navigateur, ou saisissez le code manuellement.');
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = query.trim();
    if (code.length < 2) {
      setError('Saisissez au moins 2 caractères pour rechercher une référence.');
      setResult(null);
      return;
    }
    stopCamera();
    setCameraMessage(null);
    setError(null);
    setSearch(code);
  }

  const matches = result?.items.slice().sort((left, right) => {
    const leftExact = left.barcode?.toLocaleLowerCase() === search.toLocaleLowerCase() ? 0 : 1;
    const rightExact = right.barcode?.toLocaleLowerCase() === search.toLocaleLowerCase() ? 0 : 1;
    return leftExact - rightExact;
  });

  return (
    <section className="data-page" aria-labelledby="scanner-heading">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECHERCHE PAR CODE</span>
          <h2 id="scanner-heading">Scanner</h2>
          <p>Scannez ou saisissez un code-barres pour retrouver l’article dans le stock.</p>
        </div>
        <span className="data-source"><span /> Site actif</span>
      </div>

      <section className="panel scanner-panel">
        <div className="scanner-panel__intro">
          <span className="scanner-panel__icon" aria-hidden="true"><BarcodeIcon /></span>
          <div><strong>Identifier un article</strong><p>La recherche porte sur le code-barres, la référence ou le nom.</p></div>
        </div>
        {cameraStream && <video className="scanner-video" ref={videoRef} autoPlay muted playsInline aria-label="Caméra de lecture des codes-barres" />}
        <div className="scanner-actions">
          {cameraStream
            ? <button className="button button--subtle" type="button" onClick={() => { stopCamera(); setCameraMessage(null); }}>Arrêter la caméra</button>
            : <button className="button button--subtle" type="button" onClick={() => void startCamera()}>Ouvrir la caméra</button>}
          <span className="scanner-actions__hint">La caméra nécessite une connexion sécurisée (HTTPS).</span>
        </div>
        {cameraMessage && <div className="scanner-message" role="status">{cameraMessage}</div>}
        <form className="scanner-search" onSubmit={submitSearch} role="search">
          <label htmlFor="scanner-code">Code-barres ou référence</label>
          <div>
            <input
              id="scanner-code"
              autoComplete="off"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex. 123456789"
            />
            <button className="button button--primary" type="submit" disabled={loading}>Rechercher</button>
          </div>
        </form>
      </section>

      {error && <DataError message={error} onRetry={() => setReload((value) => value + 1)} />}
      {loading && <div className="loading-card loading-card--table" aria-live="polite"><span className="spinner spinner--green" aria-hidden="true" />Recherche dans le stock…</div>}
      {result && !loading && result.items.length === 0 && (
        <div className="empty-state"><strong>Aucun article trouvé</strong><span>Aucun article de ce site ne correspond au code, à la référence ou au nom saisi.</span></div>
      )}
      {matches && matches.length > 0 && !loading && (
        <section className="panel scanner-results" aria-label="Articles trouvés" aria-live="polite">
          <div className="scanner-results__heading">
            <strong>{matches.length} résultat{matches.length > 1 ? 's' : ''}</strong>
            <span>Recherche : {search}</span>
          </div>
          {matches.map((article) => (
            <article className="scanner-result" key={article.id}>
              <span className="scanner-result__icon" aria-hidden="true"><BarcodeIcon /></span>
              <div className="scanner-result__details">
                <strong>{article.name}</strong>
                <span>Réf. {article.reference}{article.barcode ? ` · Code ${article.barcode}` : ''}</span>
                {article.family && <small>{article.family}</small>}
              </div>
              <div className="scanner-result__quantity">
                <strong>{new Intl.NumberFormat('fr-FR').format(article.quantity)}</strong>
                <span>{article.unit} en stock</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 5v14m3-14v14m3-14v14m4-14v14m3-14v14m3-14v14m3-14v14" />
    </svg>
  );
}
