import { createRequire } from 'node:module';
import { join } from 'node:path';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { AuthSession } from '../web/src/types/auth';

const mockGetDashboard = jest.fn();
const renderedWorkspaces: TestRenderer.ReactTestRenderer[] = [];

jest.mock('../web/src/services/dashboardService', () => ({
  dashboardService: { getSummary: (...args: unknown[]) => mockGetDashboard(...args) },
}));
jest.mock('../web/src/services/apiClient', () => ({ apiMessage: () => 'Erreur de chargement.' }));
jest.mock('../web/src/components/invenbot/InvenBotProvider', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return { InvenBotProvider: ({ children }: { children: React.ReactNode }) => Runtime.createElement(Runtime.Fragment, null, children) };
});
jest.mock('../web/src/components/InvenBot', () => ({ InvenBot: () => null }));
jest.mock('../web/src/components/invenbot/InvenBotStage', () => ({ InvenBotStage: () => null }));
jest.mock('../web/src/components/invenbot/InvenBotDebug', () => ({ InvenBotDebugPanel: () => null, isInvenBotDebug: () => false }));
jest.mock('../web/src/components/dashboard/KpiCard', () => ({ KpiCard: () => null }));
jest.mock('../web/src/components/dashboard/DashboardSkeleton', () => ({ DashboardSkeleton: () => null }));
jest.mock('../web/src/components/dashboard/SplitWords', () => ({ SplitWords: () => null }));
jest.mock('../web/src/components/dashboard/usePageMotion', () => ({ usePointerEffects: () => false }));
jest.mock('../web/src/components/dashboard/useInView', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return { useRevealGroup: () => Runtime.useRef(null) };
});
jest.mock('../web/src/components/dashboard/useParallax', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return { useParallax: () => ({ ref: Runtime.useRef(null), handlers: {} }) };
});
jest.mock('../web/src/components/SiteSwitcher', () => ({ SiteSwitcher: () => null }));
jest.mock('../web/src/pages/ArticlesPage', () => ({ ArticlesPage: () => null }));
jest.mock('../web/src/pages/ComputersPage', () => ({ ComputersPage: () => null }));
jest.mock('../web/src/pages/ScannerPage', () => ({ ScannerPage: () => null }));
jest.mock('../web/src/pages/StockMapPage', () => ({ StockMapPage: () => null }));
jest.mock('../web/src/pages/AnalyticsPage', () => ({ AnalyticsPage: () => null }));
jest.mock('../web/src/pages/SettingsPage', () => ({ SettingsPage: () => null }));
jest.mock('../web/src/pages/MovementsPage', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return {
    MovementsPage: ({ createRequested, onCreateRequestHandled }: {
      createRequested: boolean;
      onCreateRequestHandled: () => void;
    }) => Runtime.createElement('section', { 'data-create-requested': String(createRequested) },
      Runtime.createElement('button', { 'data-acknowledge-create': true, onClick: onCreateRequestHandled }, 'Accuser réception'),
    ),
  };
});

const webReact = createRequire(join(__dirname, '../web/package.json')).resolve('react');
const testReact = createRequire(__filename).resolve('react');
if (webReact !== testReact) jest.doMock(webReact, () => jest.requireActual('react'));
const { Workspace }: typeof import('../web/src/components/Workspace') = require('../web/src/components/Workspace');

const session: AuthSession = {
  authMode: 'user',
  user: { id: 'user-a', name: 'Technicien', role: 'technicien', permissions: ['dashboard:read', 'movements:read', 'movements:write'] },
  activeSite: { id: 'site-a', name: 'Atelier' },
  activeTechnician: null,
};

async function renderWorkspace() {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <Workspace session={session} signingOut={false} error={null} onSelectSite={async () => true} onSignOut={async () => undefined} />,
    );
  });
  renderedWorkspaces.push(renderer!);
  return renderer!;
}

beforeEach(() => {
  mockGetDashboard.mockReset().mockResolvedValue({
    totalArticles: 0,
    lowStockArticles: 0,
    movementsToday: 0,
    recentMovements: [],
  });
});

afterEach(() => {
  act(() => renderedWorkspaces.splice(0).forEach((renderer) => renderer.unmount()));
});

describe('movement creation navigation', () => {
  it('opens creation from the empty dashboard and does not reopen it during normal navigation', async () => {
    const renderer = await renderWorkspace();
    await act(async () => renderer.root.findByProps({ className: 'button dashboard-empty__cta' }).props.onClick());
    expect(renderer.root.findByProps({ 'data-create-requested': 'true' })).toBeDefined();

    await act(async () => renderer.root.findByProps({ 'data-acknowledge-create': true }).props.onClick());
    expect(renderer.root.findByProps({ 'data-create-requested': 'false' })).toBeDefined();
    await act(async () => renderer.root.findByProps({ 'aria-label': 'Dashboard' }).props.onClick());
    await act(async () => renderer.root.findByProps({ 'aria-label': 'Flux' }).props.onClick());
    expect(renderer.root.findByProps({ 'data-create-requested': 'false' })).toBeDefined();
  });

  it('opens creation from the dashboard quick action', async () => {
    const renderer = await renderWorkspace();
    await act(async () => renderer.root.findByProps({ className: 'dashboard-action dashboard-action--movements' }).props.onClick());
    expect(renderer.root.findByProps({ 'data-create-requested': 'true' })).toBeDefined();
  });

  it('opens creation from the assistant while already in Flux', async () => {
    const renderer = await renderWorkspace();
    await act(async () => renderer.root.findByProps({ 'aria-label': 'Flux' }).props.onClick());
    await act(async () => renderer.root.findByProps({ className: 'sidebar__assistant-trigger' }).props.onClick());
    const action = renderer.root.findAllByProps({ className: 'assistant-popover__action' }).find((button) =>
      button.findAllByType('span').some((span) => span.children.includes('Nouvelle opération')),
    );
    expect(action).toBeDefined();
    await act(async () => action!.props.onClick());
    expect(renderer.root.findByProps({ 'data-create-requested': 'true' })).toBeDefined();
    expect(renderer.root.findAllByProps({ className: 'assistant-popover' })).toHaveLength(0);
  });

  it('opens only the journal when requested from the dashboard', async () => {
    const renderer = await renderWorkspace();
    await act(async () => renderer.root.findByProps({ className: 'dashboard-text-link' }).props.onClick());
    expect(renderer.root.findByProps({ 'data-create-requested': 'false' })).toBeDefined();
  });
});
