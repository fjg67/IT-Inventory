import { createRequire } from 'node:module';
import { join } from 'node:path';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { ArticleListItem } from '../web/src/types/inventory';

const mockGetArticles = jest.fn();
const mockGetSites = jest.fn();
const mockCreateMovement = jest.fn();
const mockBotActions = { play: jest.fn(), say: jest.fn(), setBase: jest.fn() };
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
jest.mock('../web/src/components/invenbot/useInvenBot', () => ({
  useInvenBotActions: () => mockBotActions,
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
  Object.values(mockBotActions).forEach((action) => action.mockReset());
});

afterEach(() => {
  act(() => renderedForms.splice(0).forEach((renderer) => renderer.unmount()));
});

describe('movement creation', () => {
  it('uses neutral Safari autofill metadata and exposes an article combobox', async () => {
    const { renderer } = await renderForm();
    const query = renderer.root.findByProps({ id: 'movement-article-query' });

    expect(query.props.name).toBe('movement-article-query');
    expect(query.props.type).toBe('search');
    expect(query.props.autoComplete).toBe('off');
    expect(query.props.autoCorrect).toBe('off');
    expect(query.props.autoCapitalize).toBe('off');
    expect(query.props.spellCheck).toBe(false);
    expect(query.props.role).toBe('combobox');
    expect(query.props['aria-autocomplete']).toBe('list');
    expect(query.props['aria-controls']).toBe('movement-article-options');
    expect(query.props['aria-describedby']).toBe('movement-article-search-help');
    expect(query.props['aria-activedescendant']).toBe('movement-article-option-article-a');
    expect(renderer.root.findByProps({ id: 'movement-article-options' }).props.role).toBe('listbox');
    expect(renderer.root.findByProps({ role: 'option' }).props['aria-selected']).toBe(true);
    expect(renderer.root.findByType('label').findByType('span').children.join('')).toBe('Article, référence ou code-barres');
  });

  it('does not reference a selected article hidden by the search filter', async () => {
    mockGetArticles.mockResolvedValueOnce([
      article,
      { ...article, id: 'article-b', reference: 'CB-02', name: 'Souris USB' },
    ]);
    const { renderer } = await renderForm();
    const query = renderer.root.findByProps({ id: 'movement-article-query' });

    await act(async () => query.props.onChange({ currentTarget: { value: 'CB-02' } }));

    expect(renderer.root.findByProps({ id: 'movement-article-query' }).props['aria-activedescendant'])
      .toBe('movement-article-option-article-b');
    expect(renderer.root.findByProps({ id: 'movement-article-option-article-b' }).props.role).toBe('option');
  });

  it('supports arrow-key navigation and selecting an exact barcode scan', async () => {
    mockGetArticles.mockResolvedValueOnce([
      article,
      { ...article, id: 'article-b', reference: 'CB-02', name: 'Souris USB', barcode: '123456789' },
    ]);
    const { renderer } = await renderForm();
    const query = renderer.root.findByProps({ id: 'movement-article-query' });
    const preventDefault = jest.fn();

    await act(async () => query.props.onKeyDown({ key: 'ArrowDown', preventDefault }));
    expect(renderer.root.findByProps({ id: 'movement-article-query' }).props['aria-activedescendant'])
      .toBe('movement-article-option-article-b');

    await act(async () => renderer.root.findByProps({ id: 'movement-article-query' }).props.onChange({
      currentTarget: { value: '123456789' },
    }));
    await act(async () => renderer.root.findByProps({ id: 'movement-article-query' }).props.onKeyDown({ key: 'Enter', preventDefault }));

    expect(renderer.root.findByProps({ id: 'movement-article-option-article-b' }).props['aria-selected']).toBe(true);
    expect(renderer.root.findAllByProps({ 'aria-pressed': true }).some((item) =>
      item.children.some((child) => typeof child === 'string' && child.includes('Souris USB')),
    )).toBe(true);
    expect(mockBotActions.play).toHaveBeenCalledWith('found');
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it('shows article photos and stock gauges throughout the guided form', async () => {
    mockGetArticles.mockResolvedValueOnce([{ ...article, imageUrl: 'https://example.test/article.png' }]);
    const { renderer } = await renderForm();

    expect(renderer.root.findAllByType('img').some((image) => image.props.src === 'https://example.test/article.png')).toBe(true);
    expect(renderer.root.findByProps({ role: 'img', 'aria-label': 'Stock : 5, seuil minimum : 1' })).toBeDefined();

    await selectType(renderer, 'Entrée');
    expect(renderer.root.findByProps({ 'aria-label': 'Agrandir la photo de Câble HDMI' })).toBeDefined();
  });

  it('starts with no operation selected and allows returning to a completed step', async () => {
    const { renderer } = await renderForm();
    await act(async () => buttonWithText(renderer.root, 'Continuer').props.onClick());

    expect(renderer.root.findAllByProps({ className: 'movement-create-type' }).every((button) => button.props['aria-pressed'] === false)).toBe(true);
    const completedArticleStep = renderer.root.findByProps({ className: 'movement-create-step movement-create-step--completed' });
    expect(completedArticleStep.findByType('button').props['aria-label']).toBe('Article, terminée. Revenir à cette étape.');
    await act(async () => completedArticleStep.findByType('button').props.onClick());
    expect(renderer.root.findByProps({ id: 'movement-article-query' })).toBeDefined();
  });

  it('disables stock-removing operations when the article has no stock', async () => {
    mockGetArticles.mockResolvedValueOnce([{ ...article, quantity: 0 }]);
    const { renderer } = await renderForm();
    await act(async () => buttonWithText(renderer.root, 'Continuer').props.onClick());

    const exit = renderer.root.findAllByProps({ className: 'movement-create-type movement-create-type--disabled' })
      .find((button) => button.findByType('strong').children.includes('Sortie'));
    const transfer = renderer.root.findAllByProps({ className: 'movement-create-type movement-create-type--disabled' })
      .find((button) => button.findByType('strong').children.includes('Transfert'));
    expect(exit?.props.disabled).toBe(true);
    expect(exit?.findByType('small').children.join('')).toBe('Stock vide : rien à sortir.');
    expect(transfer?.props.disabled).toBe(true);
    expect(transfer?.findByType('small').children.join('')).toBe('Stock vide : rien à transférer.');
  });

  it('uses a custom quantity stepper without changing integer validation', async () => {
    const { renderer } = await renderForm();
    await selectType(renderer, 'Entrée');

    const input = renderer.root.findByProps({ type: 'number' });
    expect(renderer.root.findAllByType('button').some((button) => button.props['aria-label'] === 'Diminuer la quantité')).toBe(true);
    await act(async () => renderer.root.findByProps({ 'aria-label': 'Augmenter la quantité' }).props.onClick());
    expect(input.props.value).toBe('2');
    await act(async () => renderer.root.findByProps({ 'aria-label': 'Diminuer la quantité' }).props.onClick());
    expect(renderer.root.findByProps({ type: 'number' }).props.value).toBe('1');
  });

  it.each([
    ['Entrée', 'ENTRY', '3', 3, 'receiving'],
    ['Sortie', 'EXIT', '2', 2, 'dispatching'],
    ['Ajustement', 'ADJUSTMENT', '0', 0, 'counting'],
    ['Transfert', 'TRANSFER', '2', 2, 'transferring'],
  ])('submits a valid %s with the expected payload and InvenBot reaction', async (label, type, inputQuantity, quantity, botState) => {
    const { renderer, onSaved, onSavingChange } = await renderForm();
    expect(mockGetArticles).toHaveBeenCalledWith(
      'site-a',
      { search: '', stock: 'all', scope: 'movement' },
      expect.any(Object),
    );
    await selectType(renderer, label);
    expect(mockBotActions.setBase).toHaveBeenLastCalledWith(botState);
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
    expect(mockBotActions.play).toHaveBeenCalledWith('success');
    expect(mockBotActions.play).toHaveBeenCalledWith(type === 'ADJUSTMENT' ? 'stamping' : type === 'TRANSFER' ? 'shipping' : 'found');
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
    expect(mockBotActions.play).toHaveBeenCalledWith('warning');
  });
});
