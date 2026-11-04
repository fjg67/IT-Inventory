import { createRequire } from 'node:module';
import { join } from 'node:path';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { MovementListItem, MovementPage } from '../web/src/types/inventory';

const mockGetPage = jest.fn();
const mockGetAll = jest.fn();
const mockBotActions = {
  play: jest.fn(), say: jest.fn(), setBase: jest.fn(), setLook: jest.fn(), dismissBubble: jest.fn(), stop: jest.fn(),
};
const mockItems: MovementListItem[] = [];
const renderedPages: TestRenderer.ReactTestRenderer[] = [];

jest.mock('../web/src/services/movementService', () => ({
  movementService: {
    getPage: (...args: unknown[]) => mockGetPage(...args),
    getAll: (...args: unknown[]) => mockGetAll(...args),
    create: jest.fn(),
  },
}));
jest.mock('../web/src/services/apiClient', () => ({ apiMessage: () => 'Erreur de chargement.' }));
jest.mock('../web/src/pages/DashboardPage', () => ({
  DataError: () => null,
  DataNotice: () => null,
}));
jest.mock('../web/src/components/movements/MovementInsightsPanel', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return {
    MovementInsightsPanel: ({ onSelectDate }: { onSelectDate: (date: string | null) => void }) =>
      Runtime.createElement('button', { 'data-select-day': true, onClick: () => onSelectDate('2026-11-04') }, 'Filtrer par jour'),
  };
});
jest.mock('../web/src/components/movements/MovementCreateDrawer', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return {
    MovementCreateDrawer: ({ siteId, onCancel, onSaved, onSavingChange }: {
      siteId: string;
      onCancel: () => void;
      onSaved: () => void;
      onSavingChange: (saving: boolean) => void;
    }) => Runtime.createElement('section', { 'data-movement-drawer': siteId },
      Runtime.createElement('button', { 'data-close-drawer': true, onClick: onCancel }, 'Fermer'),
      Runtime.createElement('button', { 'data-save-drawer': true, onClick: onSaved }, 'Enregistrer'),
      Runtime.createElement('button', { 'data-start-saving': true, onClick: () => onSavingChange(true) }, 'Enregistrement en cours'),
      Runtime.createElement('button', { 'data-stop-saving': true, onClick: () => onSavingChange(false) }, 'Enregistrement terminé'),
    ),
  };
});
jest.mock('../web/src/components/data/DataPagination', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return {
    DataPagination: ({ pageIndex, pageCount, onPageChange }: {
      pageIndex: number;
      pageCount: number;
      onPageChange: (page: number) => void;
    }) => Runtime.createElement('div', null,
      Runtime.createElement('span', { 'data-page': true }, `${pageIndex + 1}/${pageCount}`),
      Runtime.createElement('button', { 'data-next-page': true, onClick: () => onPageChange(pageIndex + 1) }, 'Suivant'),
    ),
    usePaginationScroll: jest.fn(),
  };
});
jest.mock('../web/src/components/data/DataTableSkeleton', () => ({ DataTableSkeleton: () => null }));
jest.mock('../web/src/components/data/DataToast', () => ({ DataToast: () => null }));
jest.mock('../web/src/components/data/useStickyTable', () => {
  const Runtime = jest.requireActual<typeof import('react')>('react');
  return { useStickyTable: () => Runtime.useRef(null) };
});
jest.mock('../web/src/components/invenbot/useInvenBot', () => ({
  ...jest.requireActual('../web/src/components/invenbot/useInvenBot'),
  useInvenBotActions: () => mockBotActions,
}));
jest.mock('../web/src/components/invenbot/InvenBot', () => ({ useMotionReduced: () => true }));
jest.mock('../web/src/components/motion/useOnScreenAndVisible', () => ({ useOnScreenAndVisible: () => true }));

const webReact = createRequire(join(__dirname, '../web/package.json')).resolve('react');
const testReact = createRequire(__filename).resolve('react');
if (webReact !== testReact) jest.doMock(webReact, () => jest.requireActual('react'));
const {
  MovementsPage,
  createMovementsCsv,
}: typeof import('../web/src/pages/MovementsPage') = require('../web/src/pages/MovementsPage');

function makeMovement(
  id: string,
  type: string,
  quantity: number,
  occurredAt = '2026-11-04T10:00:00.000Z',
  userName = 'Technicien',
): MovementListItem {
  return {
    id,
    type,
    quantity,
    reason: null,
    articleName: `Article ${id}`,
    articleReference: `REF-${id}`,
    userName,
    fromSiteName: type === 'ENTRY' ? null : 'Atelier',
    toSiteName: type === 'ENTRY' ? 'Atelier' : null,
    occurredAt,
  };
}

function makePage(items = mockItems, page = 0, pageSize = 25): MovementPage {
  const start = page * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

async function renderPage(props: Partial<React.ComponentProps<typeof MovementsPage>> = {}) {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<MovementsPage siteId="site-a" currentUserName="Technicien" {...props} />);
  });
  renderedPages.push(renderer!);
  return renderer!;
}

beforeEach(() => {
  mockItems.splice(0, mockItems.length,
    makeMovement('1', 'ENTRY', 3),
    makeMovement('2', 'EXIT', -2, '2026-11-04T09:00:00.000Z', 'Autre technicien'),
    makeMovement('3', 'ADJUSTMENT', 1, '2026-11-03T08:00:00.000Z'),
    ...Array.from({ length: 27 }, (_, index) => makeMovement(String(index + 4), 'ENTRY', 1, '2026-11-03T08:00:00.000Z')),
  );
  mockGetPage.mockReset().mockImplementation((_siteId: string, options: { page: number; pageSize: number }) =>
    Promise.resolve(makePage(mockItems, options.page, options.pageSize)));
  mockGetAll.mockReset().mockImplementation((_siteId: string, options: { type: string }) =>
    Promise.resolve(options.type === 'all' ? [...mockItems] : mockItems.filter((item) => item.type === options.type)));
  Object.values(mockBotActions).forEach((action) => action.mockClear());
});

afterEach(() => {
  act(() => renderedPages.splice(0).forEach((renderer) => renderer.unmount()));
});

describe('movement history', () => {
  it('offers a prominent creation button even when the history is empty', async () => {
    mockItems.splice(0, mockItems.length);
    const renderer = await renderPage();
    const heading = renderer.root.findByProps({ className: 'page-heading movements-heading' });
    const createButton = heading.findByType('button');

    expect(createButton.props.className).toContain('button--primary');
    expect(createButton.props['aria-haspopup']).toBe('dialog');
    expect(createButton.props.disabled).toBe(false);
    expect(createButton.children).toContain(' Créer un mouvement');

    await act(async () => createButton.props.onClick());
    expect(renderer.root.findByProps({ 'data-movement-drawer': 'site-a' })).toBeDefined();
    await act(async () => renderer.root.findByProps({ 'data-close-drawer': true }).props.onClick());
    expect(renderer.root.findAllByProps({ 'data-movement-drawer': 'site-a' })).toHaveLength(0);
  });

  it('keeps creation available when the journal cannot be loaded', async () => {
    mockGetPage.mockRejectedValueOnce(new Error('Journal indisponible'));
    const renderer = await renderPage();
    const createButton = renderer.root.findByProps({ className: 'page-heading movements-heading' }).findByType('button');

    expect(createButton.props.disabled).toBe(false);
    await act(async () => createButton.props.onClick());
    expect(renderer.root.findByProps({ 'data-movement-drawer': 'site-a' })).toBeDefined();
  });

  it('opens a requested creation only when a site is available and acknowledges it', async () => {
    const onHandled = jest.fn();
    const renderer = await renderPage({ siteId: undefined, createRequested: true, onCreateRequestHandled: onHandled });
    expect(onHandled).not.toHaveBeenCalled();

    await act(async () => renderer.update(
      <MovementsPage siteId="site-a" createRequested onCreateRequestHandled={onHandled} />,
    ));
    expect(onHandled).toHaveBeenCalledTimes(1);
    expect(renderer.root.findByProps({ 'data-movement-drawer': 'site-a' })).toBeDefined();
  });

  it('prevents closing while saving and refreshes the journal after success', async () => {
    const renderer = await renderPage();
    await act(async () => renderer.root.findByProps({ className: 'page-heading movements-heading' }).findByType('button').props.onClick());
    await act(async () => renderer.root.findByProps({ 'data-start-saving': true }).props.onClick());
    await act(async () => renderer.root.findByProps({ 'data-close-drawer': true }).props.onClick());
    expect(renderer.root.findByProps({ 'data-movement-drawer': 'site-a' })).toBeDefined();

    await act(async () => renderer.root.findByProps({ 'data-save-drawer': true }).props.onClick());
    expect(renderer.root.findAllByProps({ 'data-movement-drawer': 'site-a' })).toHaveLength(0);
    expect(mockGetPage).toHaveBeenCalledTimes(2);
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it('keeps server pagination and caches the full filtered summary independently', async () => {
    const renderer = await renderPage();
    expect(mockGetPage.mock.calls[0][1]).toEqual({ period: '30days', type: 'all', page: 0, pageSize: 25 });
    expect(mockGetAll).toHaveBeenCalledTimes(1);

    await act(async () => renderer.root.findByProps({ 'data-next-page': true }).props.onClick());
    expect(mockGetPage.mock.calls.at(-1)?.[1]).toEqual({ period: '30days', type: 'all', page: 1, pageSize: 25 });
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('filters a selected chart day locally and highlights the current technician', async () => {
    const renderer = await renderPage();
    await act(async () => renderer.root.findByProps({ 'data-select-day': true }).props.onClick());

    expect(mockGetPage).toHaveBeenCalledTimes(1);
    const rows = renderer.root.findByType('tbody').children;
    expect(rows).toHaveLength(2);
    expect(rows.some((row) => String(row.props.className ?? '').includes('movement-row--mine'))).toBe(true);
    expect(renderer.root.findAllByType('time').every((time) => time.props.dateTime.startsWith('2026-11-04'))).toBe(true);
  });

  it('resets the page and refetches summary data when the type changes', async () => {
    const renderer = await renderPage();
    await act(async () => renderer.root.findByProps({ 'data-next-page': true }).props.onClick());
    await act(async () => renderer.root.findAllByType('select')[1].props.onChange({ currentTarget: { value: 'EXIT' } }));

    expect(mockGetPage.mock.calls.at(-1)?.[1]).toEqual({ period: '30days', type: 'EXIT', page: 0, pageSize: 25 });
    expect(mockGetAll.mock.calls.at(-1)?.[1]).toMatchObject({ period: '30days', type: 'EXIT' });
    expect(mockGetPage.mock.calls[0][2].aborted).toBe(true);
  });
});

describe('movement CSV', () => {
  it('preserves the original columns, formula protection and delimiter escaping', () => {
    const item = makeMovement('1', 'ADJUSTMENT', -2, '2026-11-04T10:00:00.000Z');
    item.articleName = '=formule';
    item.reason = 'comptage; vérifié';
    const csv = createMovementsCsv([item]);

    expect(csv).toBe(
      'Date;Type;Référence article;Article;Quantité;Site d’origine;Site de destination;Utilisateur;Motif\r\n' +
      '2026-11-04T10:00:00.000Z;Ajustement;REF-1;\'=formule;-2;Atelier;;Technicien;"comptage; vérifié"',
    );
  });
});
