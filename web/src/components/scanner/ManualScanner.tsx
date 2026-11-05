import type { RefObject } from 'react';

export function ManualScanner({
  value,
  inputRef,
  onChange,
  onSearch,
  onClear,
  submitLabel,
}: {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  submitLabel: string;
}) {
  return (
    <form className="scan-entry scan-entry--manual" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <label htmlFor="scanner-manual-code">Code-barres, référence ou nom</label>
      <div className="scan-entry__controls">
        <input
          ref={inputRef}
          id="scanner-manual-code"
          autoComplete="off"
          inputMode="search"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="Saisir une valeur à rechercher"
        />
        {value && <button className="scan-entry__clear" type="button" aria-label="Effacer la recherche" onClick={onClear}>Effacer</button>}
        <button className="button button--primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
