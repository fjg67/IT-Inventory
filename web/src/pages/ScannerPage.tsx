import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArticlePage as ArticlePageData } from '../types/inventory';
import { articleService } from '../services/articleService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';
import { CameraScanner } from '../components/scanner/CameraScanner';
import { ManualScanner } from '../components/scanner/ManualScanner';
import { MovementCreateDrawer } from '../components/movements/MovementCreateDrawer';
import { QuickScanToggle } from '../components/scanner/QuickScanToggle';
import { ScanModeSwitch } from '../components/scanner/ScanModeSwitch';
import { ScanViewport } from '../components/scanner/ScanViewport';
import { ScannerOperationSwitch } from '../components/scanner/ScannerOperationSwitch';
import { WedgeScanner } from '../components/scanner/WedgeScanner';
import { getMovementType, readQuickScanPreference, saveQuickScanPreference, type ScannerOperation, type ScannerMovementType } from '../components/scanner/scannerOperations';
import { readScanModePreference, saveScanModePreference, type ScanMode } from '../components/scanner/scanMode';
import { useBarcodeWedge } from '../components/scanner/useBarcodeWedge';
import { useCamera } from '../components/scanner/useCamera';
import '../components/scanner/scanner.css';

export function ScannerPage({ siteId, canCreateMovements = false }: { siteId?: string; canCreateMovements?: boolean }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<ArticlePageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [operation, setOperation] = useState<ScannerOperation>('search');
  const [quickScan, setQuickScan] = useState(readQuickScanPreference);
  const [scanMode, setScanMode] = useState<ScanMode>(readScanModePreference);
  const [movementRequest, setMovementRequest] = useState<{ barcode: string; type: ScannerMovementType } | null>(null);
  const [savingMovement, setSavingMovement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const submitLabel = operation === 'entry'
    ? 'Préparer une entrée'
    : operation === 'exit'
      ? 'Préparer une sortie'
      : 'Rechercher';
  const submitCode = useCallback((value: string) => {
    const code = value.trim();
    if (code.length < 2) {
      setError('Saisissez au moins 2 caractères pour rechercher une référence.');
      setResult(null);
      return;
    }
    setError(null);
    setSearch(code);
  }, []);
  const handleScannedCode = useCallback((value: string) => {
    const code = value.trim();
    if (code.length < 2) {
      submitCode(code);
      return;
    }
    if (operation === 'search') {
      setScanNotice('Recherche lancée.');
      submitCode(code);
      return;
    }
    const type = getMovementType(operation);
    if (!canCreateMovements || !type) {
      setScanNotice('Votre compte ne peut pas créer des mouvements depuis le scanner.');
      return;
    }
    setError(null);
    setScanNotice(`Code détecté. Vérifiez les détails avant de confirmer ${type === 'ENTRY' ? 'l’entrée' : 'la sortie'}.`);
    setSearch('');
    setResult(null);
    setQuery('');
    setMovementRequest({ barcode: code, type });
  }, [canCreateMovements, operation, submitCode]);
  const onWedgeScan = useCallback((code: string, wasRapid: boolean) => {
    setQuery(code);
    handleScannedCode(code);
    if (operation === 'search') setScanNotice(wasRapid ? 'Code reçu de la douchette.' : 'Lecture terminée.');
  }, [handleScannedCode, operation]);
  const camera = useCamera(scanMode === 'camera' && movementRequest === null, handleScannedCode);
  const wedge = useBarcodeWedge(scanMode === 'wedge' && movementRequest === null, onWedgeScan);

  function changeScanMode(nextMode: ScanMode) {
    setScanMode(nextMode);
    saveScanModePreference(nextMode);
    setScanNotice(null);
  }

  function changeOperation(nextOperation: ScannerOperation) {
    setOperation(nextOperation);
    setQuery('');
    setSearch('');
    setResult(null);
    setError(null);
    setScanNotice(null);
  }

  function changeQuickScan(enabled: boolean) {
    setQuickScan(enabled);
    saveQuickScanPreference(enabled);
  }

  function handleMovementCancel() {
    if (savingMovement) return;
    setMovementRequest(null);
    setQuery('');
    setScanNotice('Mouvement annulé. Vous pouvez scanner un autre article.');
  }

  function handleMovementSaved() {
    const scannedCode = movementRequest?.barcode ?? '';
    setMovementRequest(null);
    setSavingMovement(false);
    setReload((value) => value + 1);
    setError(null);
    if (quickScan) {
      setQuery('');
      setSearch('');
      setResult(null);
      setScanNotice('Mouvement enregistré. Prêt pour le scan suivant.');
      return;
    }
    setQuery('');
    setSearch(scannedCode);
    setScanNotice('Mouvement enregistré. Le stock a été actualisé.');
  }

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
    if (movementRequest || scanMode !== 'wedge') return;
    const frame = window.requestAnimationFrame(() => wedge.focusInput());
    return () => window.cancelAnimationFrame(frame);
  }, [movementRequest, scanMode, wedge.focusInput]);

  useEffect(() => {
    if (movementRequest || scanMode !== 'manual') return;
    const frame = window.requestAnimationFrame(() => manualInputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [movementRequest, scanMode]);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Le scanner recherche une référence uniquement dans le stock du site actif et de ses sous-sites." />;
  }

  const matches = result?.items.slice().sort((left, right) => {
    const leftExact = left.barcode?.toLocaleLowerCase() === search.toLocaleLowerCase() ? 0 : 1;
    const rightExact = right.barcode?.toLocaleLowerCase() === search.toLocaleLowerCase() ? 0 : 1;
    return leftExact - rightExact;
  });

  return (
    <section className="data-page scanner-page" aria-labelledby="scanner-heading">
      <div className="page-heading scanner-heading">
        <div>
          <span className="eyebrow">RECHERCHE PAR CODE</span>
          <h2 id="scanner-heading">Scanner</h2>
          <p>Un poste unique pour la caméra, la douchette ou la saisie manuelle.</p>
        </div>
        <span className="scanner-heading__status"><i aria-hidden="true" />Site actif</span>
      </div>

      <section className="panel scanner-workstation" aria-label="Poste de scan">
        <div className="scanner-workstation__top">
          <div className="scanner-workstation__title">
            <strong>Action du scanner</strong>
            <span>Choisissez la recherche ou le type de mouvement à préparer.</span>
          </div>
          <div className="scanner-workstation__operation">
            <ScannerOperationSwitch value={operation} canCreateMovements={canCreateMovements} onChange={changeOperation} />
            {!canCreateMovements && <small id="scanner-operation-help">Votre compte peut rechercher des articles, mais ne peut pas créer de mouvements.</small>}
          </div>
        </div>

        <div className="scanner-workstation__tools">
          <div className="scanner-workstation__scan-mode">
            <span>Moyen de scan</span>
            <ScanModeSwitch value={scanMode} onChange={changeScanMode} />
          </div>
          {operation !== 'search' && (
            <div className="scanner-workstation__quick-scan">
              <QuickScanToggle enabled={quickScan} onChange={changeQuickScan} descriptionId="scanner-quick-scan-help" />
              <small id="scanner-quick-scan-help">Après confirmation, efface le code pour le scan suivant. La caméra doit être rouverte manuellement.</small>
            </div>
          )}
        </div>

        {scanMode === 'camera' && <CameraScanner camera={camera} />}
        {scanMode === 'wedge' && (
          <>
            <ScanViewport mode="wedge" state="scanning">
              <div className="scan-standby">
                <span aria-hidden="true"><BarcodeIcon /></span>
                <strong>Prêt à recevoir un code</strong>
                <small>Présentez une étiquette à la douchette.</small>
              </div>
            </ScanViewport>
            <WedgeScanner
              value={query}
              inputRef={wedge.inputRef}
              onKeyDown={wedge.onKeyDown}
              onChange={setQuery}
              onSearch={() => handleScannedCode(query)}
              submitLabel={submitLabel}
            />
          </>
        )}
        {scanMode === 'manual' && (
          <>
            <ScanViewport mode="manual" state="idle">
              <div className="scan-standby">
                <span aria-hidden="true"><BarcodeIcon /></span>
                <strong>Saisir une recherche</strong>
                <small>Code-barres, référence ou nom de l’article.</small>
              </div>
            </ScanViewport>
            <ManualScanner value={query} inputRef={manualInputRef} onChange={setQuery} onSearch={() => handleScannedCode(query)} submitLabel={submitLabel} onClear={() => {
              setQuery('');
              setSearch('');
              setError(null);
            }} />
          </>
        )}
        {scanNotice && <div className="scanner-message" role="status">{scanNotice}</div>}
      </section>

      {movementRequest && (
        <MovementCreateDrawer
          siteId={siteId}
          saving={savingMovement}
          initialBarcode={movementRequest.barcode}
          initialType={movementRequest.type}
          onCancel={handleMovementCancel}
          onSaved={handleMovementSaved}
          onSavingChange={setSavingMovement}
        />
      )}

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
    <svg viewBox="0 0 24 24" fill="none" focusable="false">
      <path d="M3 5v14m3-14v14m3-14v14m4-14v14m3-14v14m3-14v14m3-14v14" />
    </svg>
  );
}
