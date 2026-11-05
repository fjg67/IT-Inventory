import { useRef, type KeyboardEvent } from 'react';
import type { ScannerOperation } from './scannerOperations';

const operations: { value: ScannerOperation; label: string }[] = [
  { value: 'search', label: 'Recherche' },
  { value: 'entry', label: 'Entrée' },
  { value: 'exit', label: 'Sortie' },
];

export function ScannerOperationSwitch({
  value,
  canCreateMovements,
  onChange,
}: {
  value: ScannerOperation;
  canCreateMovements: boolean;
  onChange: (operation: ScannerOperation) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const availableOperations = operations.filter((operation) =>
    operation.value === 'search' || canCreateMovements,
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = availableOperations.findIndex((operation) => operation.value === value);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % availableOperations.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + availableOperations.length) % availableOperations.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = availableOperations.length - 1;
    else return;

    event.preventDefault();
    const nextOperation = availableOperations[nextIndex];
    onChange(nextOperation.value);
    buttons.current[operations.findIndex((operation) => operation.value === nextOperation.value)]?.focus();
  }

  return (
    <div
      className="scanner-operation-switch"
      role="radiogroup"
      aria-label="Action du scanner"
      aria-describedby={!canCreateMovements ? 'scanner-operation-help' : undefined}
    >
      {operations.map((operation, index) => {
        const disabled = operation.value !== 'search' && !canCreateMovements;
        return (
          <button
            key={operation.value}
            ref={(element) => { buttons.current[index] = element; }}
            className={`scanner-operation-switch__option${value === operation.value ? ' is-selected' : ''}`}
            type="button"
            role="radio"
            aria-checked={value === operation.value}
            tabIndex={value === operation.value ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(operation.value)}
            onKeyDown={handleKeyDown}
          >
            <OperationIcon operation={operation.value} />
            <span>{operation.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function OperationIcon({ operation }: { operation: ScannerOperation }) {
  if (operation === 'search') {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>;
  }
  if (operation === 'entry') {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14m-7-7h14" /></svg>;
  }
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h14" /></svg>;
}
