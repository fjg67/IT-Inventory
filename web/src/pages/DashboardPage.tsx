import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { DashboardSummary, RecentMovement } from '../types/inventory';
import { apiMessage } from '../services/apiClient';
import { dashboardService } from '../services/dashboardService';
import { InvenBot } from '../components/InvenBot';
import { InvenBotStage } from '../components/invenbot/InvenBotStage';
import { InvenBotDebugPanel, isInvenBotDebug } from '../components/invenbot/InvenBotDebug';
import { useInvenBot } from '../components/invenbot/useInvenBot';
import { KpiCard } from '../components/dashboard/KpiCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { SplitWords } from '../components/dashboard/SplitWords';
import { spawnRipple } from '../components/dashboard/ripple';
import { useParallax } from '../components/dashboard/useParallax';
import { useRevealGroup } from '../components/dashboard/useInView';
import { usePointerEffects } from '../components/dashboard/usePageMotion';
import '../components/dashboard/dashboard.css';

const waveSessionKey = 'it-inventory-web-invenbot-waved';
let wavedWithoutStorage = false;

/** Coucou une seule fois par session de navigateur. */
function shouldWave(): boolean {
  try {
    if (window.sessionStorage.getItem(waveSessionKey) === '1') return false;
    window.sessionStorage.setItem(waveSessionKey, '1');
    return true;
  } catch {
    if (wavedWithoutStorage) return false;
    wavedWithoutStorage = true;
    return true;
  }
}

const numberFormat = new Intl.NumberFormat('fr-FR');
const greetingDuration = 2200;

type DashboardAction = {
  key: string;
  label: string;
  description: string;
  icon: string;
};

export function DashboardPage({
  siteId,
  siteName,
  actions,
  onNavigate,
  onCreateMovement,
}: {
  siteId?: string;
  siteName?: string;
  actions: DashboardAction[];
  onNavigate: (key: string) => void;
  onCreateMovement: () => void;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const previouslyLoadedSite = useRef<string | null>(null);
  const bot = useInvenBot();
  const botRef = useRef(bot);
  botRef.current = bot;
  const heroBotRef = useRef<HTMLSpanElement>(null);
  const refreshRequested = useRef(false);
  const greetedAt = useRef<number | null>(null);
  const debug = useMemo(isInvenBotDebug, []);
  const [pointing, setPointing] = useState(false);
  const pointerEffects = usePointerEffects();
  const parallax = useParallax<HTMLElement>(pointerEffects);
  const pageRef = useRevealGroup<HTMLElement>([summary, loading, error]);

  const retry = useCallback(() => {
    setAnnouncement(null);
    setReload((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!siteId) {
      setSummary(null);
      setError(null);
      setLoading(false);
      previouslyLoadedSite.current = null;
      return;
    }

    if (previouslyLoadedSite.current && previouslyLoadedSite.current !== siteId) {
      setSummary(null);
      setAnnouncement(null);
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    dashboardService.getSummary(siteId, controller.signal)
      .then((result) => {
        setSummary(result);
        setAnnouncement(previouslyLoadedSite.current === siteId ? 'Données actualisées.' : 'Analyse terminée.');
        previouslyLoadedSite.current = siteId;
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId, reload]);

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  const { setBase, setLook } = bot;
  const lowStock = summary?.lowStockArticles ?? 0;
  useEffect(() => {
    setBase(loading ? 'checking' : error || lowStock > 0 ? 'warning' : 'idle');
  }, [setBase, loading, error, lowStock]);

  useEffect(() => () => {
    botRef.current.setBase('idle');
    botRef.current.setLook(null);
  }, []);

  useEffect(() => {
    if (!siteId || !shouldWave()) return;
    const { play, say, firstName } = botRef.current;
    greetedAt.current = performance.now();
    play('wave');
    say(firstName ? `Salut ${firstName} 👋` : 'Salut 👋', { priority: 3, duration: greetingDuration });
  }, [siteId]);

  useEffect(() => {
    if (!summary || loading) return;
    const refreshed = refreshRequested.current;
    refreshRequested.current = false;
    // Laisse le coucou se terminer avant de réagir aux données.
    const delay = greetedAt.current === null ? 0 : Math.max(0, greetingDuration + 200 - (performance.now() - greetedAt.current));
    const timer = window.setTimeout(() => {
      const { play, say } = botRef.current;
      if (refreshed) {
        play('success');
        say('Données à jour ✓', { priority: 2 });
      } else if (summary.lowStockArticles > 0) {
        const count = summary.lowStockArticles;
        play('warning');
        setPointing(true);
        say(`${numberFormat.format(count)} référence${count > 1 ? 's' : ''} sous le seuil, on regarde ?`, { priority: 2 });
      } else if (summary.movementsToday === 0) {
        say('Calme plat aujourd’hui 😴', { priority: 1 });
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [summary, loading]);

  useEffect(() => {
    if (!pointing) return;
    const timer = window.setTimeout(() => setPointing(false), 2400);
    return () => window.clearTimeout(timer);
  }, [pointing]);

  const lookToward = useCallback((target: HTMLElement | null) => {
    const origin = heroBotRef.current?.getBoundingClientRect();
    if (!target || !origin) {
      setLook(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    setLook({
      x: clamp((rect.left + rect.width / 2 - (origin.left + origin.width / 2)) / 600),
      y: clamp((rect.top + rect.height / 2 - (origin.top + origin.height / 2)) / 400),
    });
  }, [setLook]);

  function refresh() {
    refreshRequested.current = true;
    retry();
  }

  const alertMessage = useMemo(() => {
    if (!summary) return '';
    return summary.lowStockArticles > 0
      ? `${new Intl.NumberFormat('fr-FR').format(summary.lowStockArticles)} référence${summary.lowStockArticles > 1 ? 's' : ''} sous le seuil minimum.`
      : 'Aucune référence sous le seuil minimum.';
  }, [summary]);
  const canOpenArticles = actions.some((action) => action.key === 'articles');
  const canOpenMovements = actions.some((action) => action.key === 'movements');

  if (!siteId) {
    return <DataNotice title="Sélectionnez un site" message="Aucun site actif n’est associé à cette session. Connectez-vous à un site pour consulter son inventaire." />;
  }

  return (
    <section className="data-page dashboard-page" ref={pageRef} aria-labelledby="dashboard-heading" aria-busy={loading}>
      <section className={`dashboard-hero${pointerEffects ? ' dashboard-hero--parallax' : ''}`} ref={parallax.ref} {...parallax.handlers} data-reveal="" style={{ '--reveal-index': 0 } as CSSProperties}>
        <span className="dashboard-hero__mesh" aria-hidden="true"><i /><i /><i /></span>
        <span className="dashboard-hero__grain" aria-hidden="true" />
        <div className="dashboard-hero__copy">
          <span className="eyebrow">CENTRE DE SUPERVISION</span>
          <h2 id="dashboard-heading"><SplitWords lines={['Votre inventaire,', 'en un coup d’œil.']} delay={120} /></h2>
          <p>Suivez votre stock, votre parc et vos mouvements depuis un seul espace.</p>
          <div className="dashboard-hero__meta">
            <span className="dashboard-site-badge"><span aria-hidden="true" />{siteName || 'Site actif'}</span>
            <button className="dashboard-refresh" type="button" onClick={refresh} disabled={loading} aria-label="Actualiser les données du tableau de bord">
              <MiniIcon name="refresh" />
              {loading && summary ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
        </div>
        <div className="dashboard-hero__visual">
          <div className="dashboard-hero__orbit dashboard-hero__orbit--outer" aria-hidden="true" />
          <div className="dashboard-hero__orbit dashboard-hero__orbit--inner" aria-hidden="true" />
          <div className="dashboard-hero__tablet-wrap" aria-hidden="true">
            <div className="dashboard-hero__tablet">
              <span className="dashboard-hero__tablet-heading"><i /> SYNTHÈSE</span>
              <span className="dashboard-hero__tablet-chart" key={reload}>
                {[0, 1, 2, 3, 4, 5, 6].map((bar) => <i key={bar} style={{ '--bar-index': bar } as CSSProperties} />)}
              </span>
              <span className="dashboard-hero__tablet-line" />
            </div>
          </div>
          <span className="dashboard-hero__mascot" ref={heroBotRef}><InvenBotStage /></span>
          <span className="dashboard-hero__scan" aria-hidden="true" />
        </div>
        <div className="dashboard-hero__footer">
          <span className="dashboard-live-dot" />
          <span>{error ? 'Vérification nécessaire' : loading ? 'Analyse du stock…' : summary ? 'Données du site actif' : 'Préparation du tableau de bord'}</span>
          {announcement && <span className="dashboard-announcement">{announcement}</span>}
        </div>
      </section>

      {loading && !summary && (
        <div className="dashboard-loading" aria-live="polite">
          <InvenBot size="small" state="checking" />
          <div><strong>Analyse du stock…</strong><span>Les indicateurs vont apparaître dès réception des données.</span></div>
          <div className="dashboard-skeleton" aria-hidden="true"><i /><i /><i /></div>
        </div>
      )}
      {loading && !summary && <DashboardSkeleton />}
      {error && <DataError message={error} onRetry={retry} />}

      {summary && (
        <>
          <div className="kpi-grid dashboard-kpis" key={reload} aria-label="Indicateurs principaux">
            <KpiCard index={0} onLook={lookToward} label="Articles suivis" value={summary.totalArticles} icon={<MiniIcon name="box" />} arrow={<MiniIcon name="arrow" />} tone="green" caption="Dans le stock actif" onClick={canOpenArticles ? () => onNavigate('articles') : undefined} />
            <KpiCard index={1} onLook={lookToward} label="Stocks faibles" value={summary.lowStockArticles} icon={<MiniIcon name="alert" />} arrow={<MiniIcon name="arrow" />} tone="amber" alert={summary.lowStockArticles > 0} pointed={pointing} caption={summary.lowStockArticles > 0 ? 'Sous le seuil minimum' : 'Aucune référence sous le seuil'} onClick={canOpenArticles ? () => onNavigate('articles') : undefined} />
            <KpiCard index={2} onLook={lookToward} label="Mouvements aujourd’hui" value={summary.movementsToday} icon={<MiniIcon name="arrows" />} arrow={<MiniIcon name="arrow" />} tone="purple" caption="Activité du jour" onClick={canOpenMovements ? () => onNavigate('movements') : undefined} />
          </div>

          <div className="dashboard-grid">
            <section className="panel movement-panel dashboard-movements" aria-labelledby="recent-movements" data-reveal="" style={{ '--reveal-index': 4 } as CSSProperties}>
              <div className="panel__heading">
                <div><span className="eyebrow">ACTIVITÉ DU SITE</span><h3 id="recent-movements">Mouvements récents</h3></div>
                {canOpenMovements && <button className="dashboard-text-link" type="button" onClick={() => onNavigate('movements')}>Voir le journal <MiniIcon name="arrow" /></button>}
              </div>
              {summary.recentMovements.length === 0 ? (
                <div className="empty-state dashboard-empty">
                  <InvenBot size="small" state={summary.movementsToday === 0 ? 'sleep' : 'idle'} />
                  <div>
                    <strong>Aucun mouvement récent</strong>
                    <span>Tout est calme sur ce site. Le prochain mouvement enregistré apparaîtra ici.</span>
                    {canOpenMovements && (
                      <button className="button dashboard-empty__cta" type="button" onClick={onCreateMovement}>
                        <MiniIcon name="plus" /> Créer un mouvement
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="movement-list dashboard-timeline">
                  {summary.recentMovements.map((movement, index) => (
                    <MovementRow movement={movement} key={movement.id} index={index} />
                  ))}
                </div>
              )}
            </section>

            <aside className="dashboard-aside" aria-label="Alertes et raccourcis">
              <section className={`panel dashboard-alert${summary.lowStockArticles > 0 ? ' dashboard-alert--warning' : ' dashboard-alert--clear'}`} aria-labelledby="dashboard-alert-title" data-reveal="" style={{ '--reveal-index': 5 } as CSSProperties}>
                <div className="dashboard-alert__top">
                  <span className="dashboard-alert__icon"><MiniIcon name="alert" /></span>
                  <span className="dashboard-alert__status">{summary.lowStockArticles > 0 ? 'À surveiller' : 'Sous contrôle'}</span>
                </div>
                <span className="eyebrow">ÉTAT DU STOCK</span>
                <h3 id="dashboard-alert-title">Stocks faibles</h3>
                <p>{alertMessage}</p>
                {canOpenArticles && <button className="dashboard-text-link" type="button" onClick={() => onNavigate('articles')}>
                  Consulter les articles <MiniIcon name="arrow" />
                </button>}
              </section>

              {actions.length > 0 && (
                <section className="panel dashboard-actions" aria-labelledby="dashboard-actions-title" data-reveal="" style={{ '--reveal-index': 6 } as CSSProperties}>
                  <div className="dashboard-actions__heading">
                    <span className="eyebrow">ACCÈS RAPIDE</span>
                    <h3 id="dashboard-actions-title">Actions rapides</h3>
                  </div>
                  <div className="dashboard-actions__list">
                    {actions.slice(0, 4).map((action) => (
                      <button className={`dashboard-action dashboard-action--${action.key}`} type="button" key={action.key} onPointerDown={spawnRipple} onClick={() => action.key === 'movements' ? onCreateMovement() : onNavigate(action.key)}>
                        <span className={`dashboard-action__icon dashboard-action__icon--${action.key}`}><MiniIcon name={action.icon} /></span>
                        <span><strong>{action.label}</strong><small>{action.description}</small></span>
                        <span className="dashboard-action__arrow" aria-hidden="true"><MiniIcon name="arrow" /></span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="dashboard-insight" role="status" data-reveal="" style={{ '--reveal-index': 7 } as CSSProperties}>
                <InvenBot size="small" state={summary.lowStockArticles > 0 ? 'warning' : 'idle'} />
                <span>
                  <strong>{summary.lowStockArticles > 0 ? 'Un point à vérifier' : 'Analyse terminée'}</strong>
                  <small>{summary.lowStockArticles > 0 ? alertMessage : `${summary.movementsToday} mouvement${summary.movementsToday === 1 ? '' : 's'} enregistré${summary.movementsToday === 1 ? '' : 's'} aujourd’hui.`}</small>
                </span>
              </div>
            </aside>
          </div>
        </>
      )}
      {debug && <InvenBotDebugPanel />}
    </section>
  );
}

function MovementRow({ movement, index }: { movement: RecentMovement; index: number }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.classList.add('is-visible');
      observer.disconnect();
    }, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <article className={`movement-row movement-row--${movement.type.toLowerCase()}`} ref={ref} style={{ '--row-index': index } as CSSProperties}>
      <span className={`movement-type movement-type--${movement.type.toLowerCase()}`} aria-hidden="true"><MovementIcon type={movement.type} /></span>
      <div className="movement-row__article">
        <strong>{movement.articleName}</strong>
        <span>{movement.siteName} <i aria-hidden="true">·</i> {movement.userName}</span>
        <small>{movementLabel(movement.type)}</small>
      </div>
      <span className={`movement-row__quantity${movement.quantity < 0 ? ' movement-row__quantity--negative' : ''}`}>
        {movement.quantity > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR').format(movement.quantity)}
      </span>
      <time className="movement-row__date" dateTime={movement.occurredAt}>{formatDate(movement.occurredAt)}</time>
    </article>
  );
}

function MovementIcon({ type }: { type: string }) {
  if (type === 'ENTRY') return <MiniIcon name="plus" />;
  if (type === 'EXIT') return <MiniIcon name="minus" />;
  if (type === 'TRANSFER') return <MiniIcon name="arrows" />;
  return <MiniIcon name="adjust" />;
}

function movementLabel(type: string): string {
  if (type === 'ENTRY') return 'Entrée';
  if (type === 'EXIT') return 'Sortie';
  if (type === 'TRANSFER') return 'Transfert';
  if (type === 'ADJUSTMENT') return 'Ajustement';
  return 'Mouvement';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="notice notice--error data-error" role="alert">
      <span className="notice__icon" aria-hidden="true">!</span>
      <span>{message}</span>
      <button className="text-button" type="button" onClick={onRetry}>Réessayer</button>
    </div>
  );
}

export function DataNotice({ title, message }: { title: string; message: string }) {
  return <div className="data-notice"><InvenBot size="small" /><div><strong>{title}</strong><p>{message}</p></div></div>;
}

export function MiniIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    box: <><path d="m12 3 8.5 4.6v8.8L12 21l-8.5-4.6V7.6L12 3Z" /><path d="M12 12v9M3.8 7.8 12 12l8.2-4.2" /></>,
    alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
    arrows: <><path d="M4 7h15l-3-3m4 13H5l3 3" /><path d="M16 4 19 7l-3 3M8 14l-3 3 3 3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    adjust: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" /><circle cx="15" cy="12" r="1.5" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name] ?? paths.box}</svg>;
}
