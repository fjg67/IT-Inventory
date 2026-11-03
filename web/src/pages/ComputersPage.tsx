import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ComputerPage as ComputerPageData, PCState } from '../types/inventory';
import { computerService } from '../services/computerService';
import { apiMessage } from '../services/apiClient';
import { DataError, DataNotice } from './DashboardPage';
import { useStickyTable } from '../components/data/useStickyTable';
import { formatBrandModel } from '../components/parcpc/formatBrandModel';
import { StatePipeline } from '../components/parcpc/StatePipeline';
import { computerStates, computerStateLabels } from '../components/parcpc/computerStates';
import { DataToolbar, type SearchFeedback } from '../components/data/DataToolbar';
import { DataToast } from '../components/data/DataToast';
import { useInvenBotActions } from '../components/invenbot/useInvenBot';
import { InvenBotDebugPanel, isInvenBotDebug } from '../components/invenbot/InvenBotDebug';
import type { InvenBotBaseState } from '../components/invenbot/invenBotQueue';
import { SplitWords } from '../components/dashboard/SplitWords';
import { InvenBot, useMotionReduced } from '../components/invenbot/InvenBot';
import { isMotionReduced } from '../components/invenbot/motion';
import { useOnScreenAndVisible } from '../components/motion/useOnScreenAndVisible';
import { ComputerRow } from '../components/parcpc/ComputerRow';
import { DataPagination, usePaginationScroll } from '../components/data/DataPagination';
import { DataTableSkeleton } from '../components/data/DataTableSkeleton';
import '../components/parcpc/parcpc.css';

const PAGE_SIZE = 25;
const headers = ['Poste', 'Hostname', 'Marque / modèle', 'Type', 'Emplacement', 'État', 'Modifié'];
const stateOptions: { value: PCState | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les états' },
  ...computerStates.map((value) => ({ value, label: computerStateLabels[value] })),
];

export function ComputersPage({ siteId }: { siteId?: string }) {
  const [search, setSearch] = useState('');
  const [state, setState] = useState<PCState | 'all'>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<ComputerPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [queryReset, setQueryReset] = useState(0);
  const [searchFeedback, setSearchFeedback] = useState<SearchFeedback | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [gearUp, setGearUp] = useState(false);
  const [resultVersion, setResultVersion] = useState(0);
  const [enterRows, setEnterRows] = useState(false);
  const [pageDirection, setPageDirection] = useState<'next' | 'previous'>('next');
  const exportController = useRef<AbortController | null>(null);
  const panelRef = useStickyTable(Boolean(siteId));
  const pageRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const active = useOnScreenAndVisible(pageRef);
  const reduced = useMotionReduced();
  usePaginationScroll(tableRef, pageIndex);
  const botActions = useInvenBotActions();
  const technicianRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const resultRef = useRef(result);
  stateRef.current = state;
  resultRef.current = result;
  const greeted = useRef(false);
  const pendingSearch = useRef(false);
  const feedbackId = useRef(0);
  const hostnameHint = useRef(false);
  const easterTimer = useRef(0);
  const lastLook = useRef(0);

  const restoreBase = useCallback(() => {
    botActions.setBase(baseForSelection(stateRef.current, resultRef.current?.counts.en_panne ?? 0));
  }, [botActions]);
  const reactToBrokenCount = useCallback((broken: number) => {
    botActions.stop();
    botActions.dismissBubble();
    botActions.setBase(broken > 0 ? 'fixing-alert' : 'idle');
    if (broken === 0) {
      botActions.play('success');
      botActions.say('Aucune panne, l’atelier tourne ✓', { priority: 2 });
    }
  }, [botActions]);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    botActions.stop();
    botActions.setBase('idle');
    botActions.dismissBubble();
    return () => {
      botActions.stop();
      window.clearTimeout(easterTimer.current);
      botActions.setBase('idle');
      botActions.setLook(null);
      botActions.dismissBubble();
    };
  }, [botActions]);

  useEffect(() => {
    if (!result || greeted.current) return;
    greeted.current = true;
    try {
      if (sessionStorage.getItem('it-inventory-pc-greeting') === '1') return;
      sessionStorage.setItem('it-inventory-pc-greeting', '1');
    } catch {
      // L'accueil reste disponible une fois par montage sans stockage.
    }
    setGearUp(true);
    const counts = result.counts;
    const parts = [
      counts.en_usinage > 0 ? `${counts.en_usinage} poste${counts.en_usinage > 1 ? 's' : ''} en usinage` : '',
      counts.disponible > 0 ? `${counts.disponible} prêt${counts.disponible > 1 ? 's' : ''} à partir` : '',
    ].filter(Boolean);
    botActions.say(parts.length ? `${parts.join(', ')}.` : `${counts.total} poste${counts.total > 1 ? 's' : ''} dans l’atelier. Prêt à t’aider !`, { priority: 1 });
  }, [result, botActions]);

  useEffect(() => {
    if (!gearUp) return;
    const timer = window.setTimeout(() => setGearUp(false), 900);
    return () => window.clearTimeout(timer);
  }, [gearUp]);

  useEffect(() => () => exportController.current?.abort(), [siteId]);

  useEffect(() => {
    if (!siteId) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    computerService.getPage(siteId, { search, state, page: pageIndex, pageSize: PAGE_SIZE }, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        if (state === 'en_panne' && page.counts.en_panne !== resultRef.current?.counts.en_panne) {
          reactToBrokenCount(page.counts.en_panne);
        }
        setResult(page);
        setResultVersion((version) => version + 1);
        setEnterRows(typeof document !== 'undefined' && !document.hidden && !isMotionReduced());
        if (pendingSearch.current) {
          pendingSearch.current = false;
          setSearchFeedback({ id: ++feedbackId.current, found: page.total > 0 });
          if (!easterTimer.current) botActions.setBase(baseForSelection(state, page.counts.en_panne));
          if (search.toLocaleLowerCase('fr-FR') !== 'atelier') {
            botActions.play(page.total > 0 ? 'found' : 'confused');
            botActions.say(page.total > 0 ? `${page.total} poste${page.total > 1 ? 's' : ''} trouvé${page.total > 1 ? 's' : ''} ✓` : 'Ce poste reste introuvable. Essaie un autre critère.', { priority: 2 });
          }
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(apiMessage(reason));
          restoreBase();
          if (pendingSearch.current) {
            pendingSearch.current = false;
            setSearchFeedback({ id: ++feedbackId.current, found: false });
            botActions.play('confused');
            botActions.say(apiMessage(reason), { priority: 2 });
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, search, state, pageIndex, reload, botActions, restoreBase, reactToBrokenCount]);

  const submitSearch = useCallback((value: string) => {
    botActions.stop();
    pendingSearch.current = true;
    setPageIndex(0);
    if (search === value && pageIndex === 0) setReload((current) => current + 1);
    setSearch(value);
    botActions.setBase('searching');
    botActions.setLook(null);
  }, [search, pageIndex, botActions]);

  const selectState = useCallback((value: string) => {
    const option = stateOptions.find((item) => item.value === value);
    if (!option) return;
    botActions.stop();
    setState(option.value);
    setPageIndex(0);
    botActions.setLook(null);
    const broken = resultRef.current?.counts.en_panne ?? 0;
    botActions.setBase(baseForSelection(option.value, broken));
    if (option.value === 'envoye') botActions.play('shipping');
    if (option.value === 'a_reusiner') botActions.say('Hmm… inspection du matériel, on regarde ça ensemble.', { priority: 2 });
    if (option.value === 'en_panne') reactToBrokenCount(broken);
  }, [botActions, reactToBrokenCount]);

  const onTyping = useCallback((value: string) => {
    botActions.stop();
    botActions.setBase('typing');
    if (/^KSAO/i.test(value)) {
      if (!hostnameHint.current) botActions.say('Je cherche ce poste…', { priority: 2 });
      hostnameHint.current = true;
    } else hostnameHint.current = false;
    if (value.trim().toLocaleLowerCase('fr-FR') !== 'atelier') {
      window.clearTimeout(easterTimer.current);
      easterTimer.current = 0;
    }
  }, [botActions]);
  const onTypingEnd = useCallback(() => {
    if (!pendingSearch.current && !easterTimer.current) restoreBase();
  }, [restoreBase]);
  const easterEgg = useCallback(() => {
    window.clearTimeout(easterTimer.current);
    botActions.setBase('repairing');
    botActions.say('Une petite réparation… et c’est reparti !', { priority: 2 });
    easterTimer.current = window.setTimeout(() => {
      easterTimer.current = 0;
      restoreBase();
      botActions.play('celebrate');
    }, 1300);
  }, [botActions, restoreBase]);

  const lookAtRow = useCallback((event: ReactPointerEvent<HTMLTableRowElement>, broken: boolean) => {
    const now = performance.now();
    if (now - lastLook.current < 80) return;
    lastLook.current = now;
    const bot = technicianRef.current?.getBoundingClientRect();
    const row = event.currentTarget.getBoundingClientRect();
    if (!bot) return;
    botActions.setLook({
      x: Math.max(-1, Math.min(1, (row.left + row.width / 2 - bot.left - bot.width / 2) / (innerWidth * .4))),
      y: Math.max(-1, Math.min(1, (row.top + row.height / 2 - bot.top - bot.height / 2) / (innerHeight * .4))),
      curious: broken,
    });
  }, [botActions]);
  const clearLook = useCallback(() => botActions.setLook(null), [botActions]);
  const copyValue = useCallback(async (value: string, kind: 'Hostname' | 'Référence') => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setToast(`${kind} copié${kind === 'Référence' ? 'e' : ''}`);
      botActions.play('found');
    } catch {
      setToast('Impossible de copier cette valeur depuis ce navigateur.');
    }
  }, [botActions]);

  const clearFilters = useCallback(() => {
    botActions.stop();
    setSearch('');
    setQueryReset((value) => value + 1);
    setState('all');
    setPageIndex(0);
    botActions.setBase('idle');
    botActions.setLook(null);
  }, [botActions]);

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Aucun site actif n’est associé à cette session. Le parc informatique est consulté par site." />;
  }

  const pageCount = result ? Math.ceil(result.total / result.pageSize) : 0;
  async function exportComputers() {
    if (!siteId || !result || result.total === 0 || exporting) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setExportError(null);
    botActions.stop();
    botActions.setBase('exporting');
    botActions.setLook(null);
    try {
      const computers = await computerService.getAll(siteId, { search, state }, controller.signal);
      if (controller.signal.aborted) return;
      const csv = createComputersCsv(computers);
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `parc_pc_${state}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      restoreBase();
      botActions.play('success');
      setToast(`CSV prêt : ${computers.length} postes`);
    } catch (reason) {
      if (!controller.signal.aborted) {
        setExportError(apiMessage(reason));
        restoreBase();
        botActions.play('confused');
        botActions.say(apiMessage(reason), { priority: 2 });
      }
    } finally {
      if (exportController.current === controller) exportController.current = null;
      setExporting(false);
    }
  }

  return (
    <section ref={pageRef} className="data-page computers-page" aria-labelledby="computers-heading"
      data-animated={active && !reduced} data-reduced={reduced}>
      <div className="page-heading computers-heading">
        <div>
          <span className="eyebrow">INVENTAIRE MATÉRIEL</span>
          <h2 id="computers-heading"><SplitWords lines={['Parc PC']} /></h2>
          <p>Postes présents dans le stock du site et de ses sous-sites actifs.</p>
        </div>
        <span className="data-source"><span /> Données du site actif</span>
      </div>

      {result && (
        <StatePipeline counts={result.counts} selected={state} disabled={loading || exporting} onSelect={selectState}
          technicianRef={technicianRef} gearUp={gearUp} />
      )}

      <section ref={panelRef} className="panel articles-panel data-table-panel">
        <DataToolbar inputId="computer-search" searchLabel="Rechercher un poste" placeholder="Nom, hostname, référence, modèle…"
          appliedSearch={search} resetQuery={queryReset} total={result?.total ?? null} noun="poste"
          loading={loading} exporting={exporting} searchFeedback={searchFeedback} workshop disableSearchDuringExport
          onSearch={submitSearch} onExport={() => void exportComputers()} onTyping={onTyping} onTypingEnd={onTypingEnd}
          easterEgg="atelier" onEasterEgg={easterEgg}>
          <label className="movement-filter computer-state-filter">
            <span>État du poste</span>
            <select value={state} onChange={(event) => selectState(event.currentTarget.value)} disabled={loading || exporting}>
              {stateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </DataToolbar>

        {error && <DataError message={error} onRetry={() => setReload((value) => value + 1)} />}
        {exportError && <DataError message={exportError} onRetry={() => void exportComputers()} />}
        {exporting && <div className="scanner-message" role="status">Préparation du CSV pour les {new Intl.NumberFormat('fr-FR').format(result?.total ?? 0)} postes filtrés…</div>}
        {loading && (!result || result.items.length === 0) && <DataTableSkeleton label="Chargement des postes" headers={headers} />}
        {result && result.items.length === 0 && !loading && (
          <div className="empty-state articles-empty pc-empty">
            <InvenBot size="small" workshop state={search || state !== 'all' ? 'confused' : 'sleep'} />
            <strong>{search || state !== 'all' ? 'Pas de poste sur cette piste' : 'L’atelier est au calme'}</strong><span>{search || state !== 'all' ? 'Essaie un autre hostname ou repars de tous les états.' : 'Aucun poste n’est présent dans le stock de ce site.'}</span>
            <button className="button button--subtle" type="button" onClick={clearFilters}>Réinitialiser les filtres</button>
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <div ref={tableRef} className={`table-scroll articles-table-wrap${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
              <table className="articles-table computers-table">
                <caption className="sr-only">Postes du site actif et de ses sous-sites</caption>
                <thead><tr>{headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead>
                <tbody key={resultVersion}>
                  {result.items.map((computer, index) => (
                    <ComputerRow key={computer.id} computer={computer} index={index} direction={pageDirection} entering={enterRows}
                      onLook={lookAtRow} onLeave={clearLook} onCopy={copyValue} />
                  ))}
                </tbody>
              </table>
            </div>
            <DataPagination pageIndex={pageIndex} pageSize={PAGE_SIZE} pageCount={pageCount} total={result.total} loading={loading}
              onPageChange={(index) => { setPageDirection(index > pageIndex ? 'next' : 'previous'); setPageIndex(index); }} />
          </>
        )}
      </section>
      <DataToast message={toast} onDismiss={dismissToast} />
      {isInvenBotDebug() && <InvenBotDebugPanel />}
    </section>
  );
}

function baseForSelection(state: PCState | 'all', broken: number): InvenBotBaseState {
  const bases: Record<PCState | 'all', InvenBotBaseState> = {
    all: 'idle', a_chaud: 'hot', a_reusiner: 'inspecting', en_usinage: 'repairing',
    disponible: 'ready', envoye: 'idle', en_panne: broken > 0 ? 'fixing-alert' : 'idle',
  };
  return bases[state];
}

function labelForState(state: PCState): string {
  const option = stateOptions.find((item) => item.value === state);
  return option?.label ?? state;
}

export function createComputersCsv(computers: ComputerPageData['items']): string {
  const columns = ['Nom', 'Hostname', 'Référence', 'Code-barres', 'Marque', 'Modèle', 'Type', 'Emplacement', 'État', 'Quantité', 'Dernière modification'];
  const rows = computers.map((computer) => {
    const brand = formatBrandModel(computer.brand, null);
    const model = formatBrandModel(computer.brand, computer.model).slice(brand.length).trimStart();
    return [
      computer.name,
      computer.hostname,
      computer.reference,
      computer.barcode ?? '',
      brand,
      model,
      computer.allocation,
      computer.location ?? '',
      labelForState(computer.state),
      computer.quantity,
      computer.updatedAt,
    ];
  });
  return [columns, ...rows]
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\r\n');
}

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  const safeValue = typeof value === 'string' && /^[\s]*[=+\-@]/.test(value) ? `'${text}` : text;
  return /[;"\r\n]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
}
