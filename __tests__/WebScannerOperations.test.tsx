import { createRequire } from 'node:module';
import { join } from 'node:path';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const webReact = createRequire(join(__dirname, '../web/package.json')).resolve('react');
const testReact = createRequire(__filename).resolve('react');
if (webReact !== testReact) jest.doMock(webReact, () => jest.requireActual('react'));

const { ScannerOperationSwitch }: typeof import('../web/src/components/scanner/ScannerOperationSwitch') =
  require('../web/src/components/scanner/ScannerOperationSwitch');
const { QuickScanToggle }: typeof import('../web/src/components/scanner/QuickScanToggle') =
  require('../web/src/components/scanner/QuickScanToggle');

function operationButton(renderer: TestRenderer.ReactTestRenderer, label: string) {
  return renderer.root.findAllByProps({ role: 'radio' }).find((button) =>
    button.findByType('span').children.join('') === label,
  );
}

describe('actions du scanner', () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;

  afterEach(() => {
    if (renderer) {
      act(() => renderer?.unmount());
      renderer = null;
    }
  });

  it('sélectionne Recherche, Entrée ou Sortie par clic et clavier', async () => {
    const onChange = jest.fn();
    await act(async () => {
      renderer = TestRenderer.create(
        <ScannerOperationSwitch value="search" canCreateMovements onChange={onChange} />,
      );
    });
    const entryButton = operationButton(renderer!, 'Entrée');
    const searchButton = operationButton(renderer!, 'Recherche');
    expect(entryButton).toBeDefined();
    expect(searchButton).toBeDefined();

    await act(async () => entryButton!.props.onClick());
    expect(onChange).toHaveBeenCalledWith('entry');

    const preventDefault = jest.fn();
    await act(async () => searchButton!.props.onKeyDown({ key: 'ArrowRight', preventDefault }));
    expect(preventDefault).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith('entry');
  });

  it('désactive les mouvements pour un compte sans permission d’écriture', async () => {
    await act(async () => {
      renderer = TestRenderer.create(
        <ScannerOperationSwitch value="search" canCreateMovements={false} onChange={jest.fn()} />,
      );
    });
    expect(operationButton(renderer!, 'Recherche')?.props.disabled).toBe(false);
    expect(operationButton(renderer!, 'Entrée')?.props.disabled).toBe(true);
    expect(operationButton(renderer!, 'Sortie')?.props.disabled).toBe(true);
  });

  it('expose l’état et le basculement de Scan rapide', async () => {
    const onChange = jest.fn();
    await act(async () => {
      renderer = TestRenderer.create(<QuickScanToggle enabled={false} onChange={onChange} descriptionId="scan-help" />);
    });
    const toggle = renderer!.root.findByType('button');

    expect(toggle.props['aria-pressed']).toBe(false);
    await act(async () => toggle.props.onClick());
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
