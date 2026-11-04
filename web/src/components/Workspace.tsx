import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { AuthSession } from '../types/auth';
import { Brand } from './Brand';
import { InvenBot, type InvenBotLook } from './InvenBot';
import { InvenBotProvider } from './invenbot/InvenBotProvider';
import { ArticlesPage } from '../pages/ArticlesPage';
import { DashboardPage, DataNotice } from '../pages/DashboardPage';
import { MovementsPage } from '../pages/MovementsPage';
import { ComputersPage } from '../pages/ComputersPage';
import { ScannerPage } from '../pages/ScannerPage';
import { StockMapPage } from '../pages/StockMapPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SiteSwitcher } from './SiteSwitcher';

const sections = [
  { key: 'dashboard', title: 'Dashboard', permission: 'dashboard:read', icon: 'grid' },
  { key: 'articles', title: 'Articles', permission: 'articles:read', icon: 'box' },
  { key: 'scanner', title: 'Scanner', permission: 'scanner:use', icon: 'scan' },
  { key: 'computers', title: 'Parc PC', permission: 'computers:read', icon: 'laptop' },
  { key: 'movements', title: 'Flux', permission: 'movements:read', icon: 'arrows' },
  { key: 'map', title: 'Cartographie', permission: 'stock-map:read', icon: 'map' },
  { key: 'analytics', title: 'Analyse avancée', permission: 'analytics:read', icon: 'chart' },
  { key: 'settings', title: 'Paramètres', permission: 'settings:read', icon: 'settings' },
] as const;

export function Workspace({
  session,
  signingOut,
  error,
  onSelectSite,
  onSignOut,
}: {
  session: AuthSession;
  signingOut: boolean;
  error: string | null;
  onSelectSite: (siteId: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
}) {
  const [activeKey, setActiveKey] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [movementCreateRequested, setMovementCreateRequested] = useState(false);
  const allowedSections = useMemo(
    () => sections.filter((section) => session.user.permissions.includes(section.permission)),
    [session.user.permissions],
  );
  const dashboardActions = useMemo(() => {
    const actionDetails: Record<string, { description: string; icon: string }> = {
      articles: { description: 'Consulter les références', icon: 'box' },
      scanner: { description: 'Rechercher un équipement', icon: 'scan' },
      computers: { description: 'Consulter le parc', icon: 'laptop' },
      movements: { description: 'Voir le journal et créer', icon: 'arrows' },
    };
    return ['scanner', 'movements', 'articles', 'computers']
      .map((key) => {
        const section = allowedSections.find((candidate) => candidate.key === key);
        return section ? { key, label: key === 'movements' ? 'Nouvelle opération' : section.title, ...actionDetails[key] } : null;
      })
      .filter((action): action is NonNullable<typeof action> => action !== null);
  }, [allowedSections]);
  const activeSection = allowedSections.find((section) => section.key === activeKey) ?? allowedSections[0];
  const assistantRef = useRef<HTMLButtonElement>(null);
  const [miniLook, setMiniLook] = useState<InvenBotLook>(null);
  const lookAtNavItem = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const bot = assistantRef.current?.querySelector('.invenbot');
    if (!bot) return;
    const item = event.currentTarget.getBoundingClientRect();
    const origin = bot.getBoundingClientRect();
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    setMiniLook({
      x: clamp((item.left + item.width / 2 - (origin.left + origin.width / 2)) / 140),
      y: clamp((item.top + item.height / 2 - (origin.top + origin.height / 2)) / 260),
    });
  }, []);
  const stopLooking = useCallback(() => setMiniLook(null), []);
  const navigateToSection = useCallback((key: string) => {
    setMovementCreateRequested(false);
    setActiveKey(key);
    setAssistantOpen(false);
  }, []);
  const requestMovementCreation = useCallback(() => {
    setMovementCreateRequested(true);
    setActiveKey('movements');
    setAssistantOpen(false);
  }, []);
  const acknowledgeMovementCreationRequest = useCallback(() => setMovementCreateRequested(false), []);

  return (
    <InvenBotProvider userName={session.user.name}>
    <div className={`workspace${collapsed ? ' workspace--collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="sidebar__brand">
          <Brand compact={collapsed} />
          <button
            className="icon-button sidebar__collapse"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Développer la navigation' : 'Réduire la navigation'}
            title={collapsed ? 'Développer' : 'Réduire'}
          >
            <Icon name="chevron" />
          </button>
        </div>

        <p className="sidebar__caption">{!collapsed && 'ESPACE DE TRAVAIL'}</p>
        <nav
          className="sidebar__nav"
          style={{ '--active-index': Math.max(0, allowedSections.findIndex((section) => section.key === activeSection?.key)) } as React.CSSProperties}
        >
          {allowedSections.map((section) => (
            <button
              className={`nav-item${activeSection?.key === section.key ? ' nav-item--active' : ''}`}
              key={section.key}
              type="button"
              onClick={() => navigateToSection(section.key)}
              onPointerEnter={lookAtNavItem}
              onPointerLeave={stopLooking}
              aria-current={activeSection?.key === section.key ? 'page' : undefined}
              aria-label={section.title}
              title={collapsed ? section.title : undefined}
            >
              <Icon name={section.icon} />
              {!collapsed && <span>{section.title}</span>}
            </button>
          ))}
          {allowedSections.length === 0 && !collapsed && (
            <p className="sidebar__empty">Aucun module accessible pour cette session.</p>
          )}
        </nav>

        <div className="sidebar__assistant">
          <button ref={assistantRef} className="sidebar__assistant-trigger" type="button" aria-expanded={assistantOpen} aria-controls="assistant-quick-actions" onClick={() => setAssistantOpen((open) => !open)}>
            <InvenBot size="mini" lookAt={miniLook} />
            <span><strong>InvenBot</strong><small>Assistant prêt</small></span>
          </button>
          {assistantOpen && (
            <section className="assistant-popover" id="assistant-quick-actions" aria-label="Raccourcis InvenBot">
              <div className="assistant-popover__heading"><strong>Accès rapides</strong><button type="button" onClick={() => setAssistantOpen(false)} aria-label="Fermer les raccourcis">×</button></div>
              <p>Raccourcis vers les modules disponibles.</p>
              {dashboardActions.map((action) => (
                <button className="assistant-popover__action" type="button" key={action.key} onClick={() => action.key === 'movements' ? requestMovementCreation() : navigateToSection(action.key)}>
                  <Icon name={action.icon} /><span>{action.label}</span><Icon name="chevron" />
                </button>
              ))}
            </section>
          )}
        </div>
      </aside>

      <div className="workspace__main">
        <header className="topbar">
          <div className="topbar__title">
            <span className="topbar__eyebrow">IT-INVENTORY</span>
            <h1>{activeSection?.title ?? 'Espace de travail'}</h1>
          </div>
          <div className="topbar__right">
            <SiteSwitcher
              activeSite={session.activeSite}
              disabled={signingOut}
              error={error}
              onSelectSite={onSelectSite}
            />
            <span className="topbar__divider" />
            <div className="user-chip">
              <span className="user-chip__avatar">{initials(session.user.name)}</span>
              <span className="user-chip__details">
                <strong>{session.user.name}</strong>
                <small>{session.user.role}</small>
              </span>
            </div>
            <button
              className="icon-button topbar__logout"
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>

        <main className="workspace__content">
          {error && <div className="notice notice--error workspace__notice" role="alert">{error}</div>}
          {activeKey === 'dashboard' && (
            <DashboardPage
              siteId={session.activeSite?.id}
              siteName={session.activeSite?.name}
              actions={dashboardActions}
              onNavigate={navigateToSection}
              onCreateMovement={requestMovementCreation}
            />
          )}
          {activeKey === 'articles' && <ArticlesPage siteId={session.activeSite?.id} />}
          {activeKey === 'movements' && (
            <MovementsPage
              siteId={session.activeSite?.id}
              currentUserName={session.activeTechnician?.name ?? session.user.name}
              createRequested={movementCreateRequested}
              onCreateRequestHandled={acknowledgeMovementCreationRequest}
            />
          )}
          {activeKey === 'computers' && <ComputersPage siteId={session.activeSite?.id} />}
          {activeKey === 'scanner' && <ScannerPage siteId={session.activeSite?.id} />}
          {activeKey === 'map' && <StockMapPage siteId={session.activeSite?.id} />}
          {activeKey === 'analytics' && <AnalyticsPage siteId={session.activeSite?.id} />}
          {activeKey === 'settings' && <SettingsPage session={session} signingOut={signingOut} onSignOut={onSignOut} />}
          {activeSection && !['dashboard', 'articles', 'movements', 'computers', 'scanner', 'map', 'analytics', 'settings'].includes(activeKey) && (
            <DataNotice
              title={`${activeSection.title} — phase suivante`}
              message="Cette vue sera activée avec son service métier et ses permissions serveur. Aucune donnée n’est simulée."
            />
          )}
          {!activeSection && <DataNotice title="Aucun module accessible" message="Votre compte n’a actuellement accès à aucun module Web." />}
          <section className="workspace__footnote">
            <span className="workspace__footnote-dot" />
            Les accès visibles dans la navigation ne remplacent jamais les contrôles de permissions côté serveur.
          </section>
        </main>
      </div>
    </div>
    </InvenBotProvider>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    box: <><path d="m12 3 8.5 4.6v8.8L12 21l-8.5-4.6V7.6L12 3Z" /><path d="M12 12v9M3.8 7.8 12 12l8.2-4.2" /></>,
    scan: <><path d="M7 4H4v3m13-3h3v3M4 17v3h3m13-3v3h-3M7 8v8m3-8v8m4-8v8m3-8v8M3 12h18" /></>,
    laptop: <><rect x="5" y="4" width="14" height="12" rx="1.5" /><path d="M2.5 19h19l-2-3H4.5l-2 3Z" /></>,
    arrows: <><path d="M4 7h15l-3-3m4 13H5l3 3" /><path d="M16 4 19 7l-3 3M8 14l-3 3 3 3" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
    chart: <><path d="M4 20V11m5 9V5m5 15v-7m5 7V8" /><path d="M2 20h20" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.7Z" transform="translate(-1 -1)" /></>,
    site: <><path d="M4 20V5l8-3v18m0-12h8v12M2 20h20" /><path d="M7 7h2m-2 4h2m-2 4h2m6-3h2m-2 4h2" /></>,
    logout: <><path d="M10 4H5v16h5m4-4 4-4-4-4m4 4H9" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[name] ?? paths.grid}
    </svg>
  );
}
