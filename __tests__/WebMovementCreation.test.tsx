import { createRequire } from 'node:module';
import { join } from 'node:path';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { ArticleListItem } from '../web/src/types/inventory';

const mockGetArticles = jest.fn();
const mockGetSites = jest.fn();
const mockCreateMovement = jest.fn();
const renderedForms: TestRenderer.ReactTestRenderer[] = [];

jest.mock('../web/src/services/articleService', () => ({
  articleService: { getAll: (...args: unknown[]) => mockGetArticles(...args) },
}));
jest.mock('../web/src/services/siteService', () => ({
  siteService: { getAvailableSites: (...args: unknown[]) => mockGetSites(...args) },
}));
jest.mock('../web/src/services/movementService', () => ({
  movementService: { create: (...args: unknown[]) => mockCreateMovement(...args) },
}));
jest.mock('../web/src/services/apiClient', () => ({
  apiMessage: (error: Error) => error.message,
}));

const webReact = createRequire(join(__dirname, '../web/package.json')).resolve('react');
const testReact = createRequire(__filename).resolve('react');
if (webReact !== testReact) jest.doMock(webReact, () => jest.requireActual('react'));
const { MovementCreateForm }: typeof import('../web/src/pages/MovementCreateForm') = require('../web/src/pages/MovementCreateForm');

const article: ArticleListItem = {
  id: 'article-a',
  reference: 'CB-01',
  name: 'Câble HDMI',
  family: null,
  quantity: 5,
  minimumStock: 1,
  unit: 'pièce',
  location: 'Atelier',
  barcode: null,
};

async function renderForm() {
  const onCancel = jest.fn();
  const onSaved = jest.fn();
  const onSavingChange = jest.fn();
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <MovementCreateForm siteId="site-a" onCancel={onCancel} onSaved={onSaved} onSavingChange={onSavingChange} />,
    );
  });
  renderedForms.push(renderer!);
  return { renderer: renderer!, onCancel, onSaved, onSavingChange };
}

function buttonWithText(root: TestRenderer.ReactTestInstance, text: string) {
  const button = root.findAllByType('button').find((item) =>
    item.children.some((child) => typeof child === 'string' && child === text),
  );
  if (!button) throw new Error(`Button not found: ${text}`);
  return button;
}

async function selectType(renderer: TestRenderer.ReactTestRenderer, label: string) {
  await act(async () => buttonWithText(renderer.root, 'Continuer').props.onClick());
  const typeButton = renderer.root.findAllByProps({ className: 'movement-create-type' }).find((button) =>
    button.findByType('strong').children.includes(label),
  );
  if (!typeButton) throw new Error(`Movement type not found: ${label}`);
  await act(async () => typeButton.props.onClick());
}

beforeEach(() => {
  mockGetArticles.mockReset().mockResolvedValue([article]);
  mockGetSites.mockReset().mockResolvedValue([
    { id: 'site-a', name: 'Atelier', parentSiteId: null },
    { id: 'site-b', name: 'Bureau', parentSiteId: 'site-a' },
    { id: 'site-c', name: 'Autre site', parentSiteId: null },
  ]);
  mockCreateMovement.mockReset().mockResolvedValue({ movementIds: ['movement-a'], quantity: 3 });
});

afterEach(() => {
  act(() => renderedForms.splice(0).forEach((renderer) => renderer.unmount()));
});

describe('movement creation', () => {
  it.each([
    ['Entrée', 'ENTRY', '3', 3],
    ['Sortie', 'EXIT', '2', 2],
    ['Ajustement', 'ADJUSTMENT', '0', 0],
    ['Transfert', 'TRANSFER', '2', 2],
  ])('submits a valid %s with the expected payload', async (label, type, inputQuantity, quantity) => {
    const { renderer, onSaved, onSavingChange } = await renderForm();
    expect(mockGetArticles).toHaveBeenCalledWith(
      'site-a',
      { search: '', stock: 'all', scope: 'movement' },
      expect.any(Object),
    );
    await selectType(renderer, label);
    const numberInput = renderer.root.findByProps({ type: 'number' });
    await act(async () => numberInput.props.onChange({ currentTarget: { value: inputQuantity } }));
    await act(async () => renderer.root.findByType('textarea').props.onChange({ currentTarget: { value: '  Test  ' } }));

    if (type === 'TRANSFER') {
      const options = renderer.root.findByType('select').findAllByType('option');
      expect(options.map((option) => option.props.value)).toEqual(['site-b']);
    }

    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault: jest.fn() }));
    expect(mockCreateMovement).toHaveBeenCalledWith({
      articleId: 'article-a',
      type,
      quantity,
      reason: 'Test',
      ...(type === 'TRANSFER' ? { destinationSiteId: 'site-b' } : {}),
    });
    expect(onSavingChange.mock.calls).toEqual([[true], [false]]);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('prevents removing more than the available stock', async () => {
    const { renderer, onSaved } = await renderForm();
    await selectType(renderer, 'Sortie');
    await act(async () => renderer.root.findByProps({ type: 'number' }).props.onChange({ currentTarget: { value: '6' } }));

    expect(buttonWithText(renderer.root, 'Confirmer le mouvement').props.disabled).toBe(true);
    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault: jest.fn() }));
    expect(mockCreateMovement).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ role: 'alert' }).children.join('')).toContain('stock disponible');
  });

  it('shows a server error without claiming the movement was saved', async () => {
    mockCreateMovement.mockRejectedValueOnce(new Error('Enregistrement impossible.'));
    const { renderer, onSaved, onSavingChange } = await renderForm();
    await selectType(renderer, 'Entrée');

    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault: jest.fn() }));
    expect(renderer.root.findByProps({ role: 'alert' }).children.join('')).toBe('Enregistrement impossible.');
    expect(onSaved).not.toHaveBeenCalled();
    expect(onSavingChange.mock.calls).toEqual([[true], [false]]);
  });
});
