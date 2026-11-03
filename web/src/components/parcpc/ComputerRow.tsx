import { memo, type CSSProperties, type PointerEvent } from 'react';
import type { ComputerListItem } from '../../types/inventory';
import { CopyButton } from '../data/CopyButton';
import { ComputerStatePill } from './ComputerStatePill';
import { formatBrandModel } from './formatBrandModel';
import { formatComputerDate } from './computerDate';

export const ComputerRow = memo(function ComputerRow({ computer, index, direction, entering, onLook, onLeave, onCopy }: {
  computer: ComputerListItem;
  index: number;
  direction: 'next' | 'previous';
  entering: boolean;
  onLook: (event: PointerEvent<HTMLTableRowElement>, broken: boolean) => void;
  onLeave: () => void;
  onCopy: (value: string, kind: 'Hostname' | 'Référence') => void;
}) {
  const brand = formatBrandModel(computer.brand, null);
  const model = formatBrandModel(computer.brand, computer.model).slice(brand.length).trimStart();
  const date = formatComputerDate(computer.updatedAt);
  const sameHostname = computer.name.trim().toLocaleLowerCase() === computer.hostname.trim().toLocaleLowerCase();
  return (
    <tr className={`article-row${entering ? ' article-row--entering' : ''} pc-computer-row pc-state--${computer.state}`}
      style={{ '--article-row-index': Math.min(index, 24) } as CSSProperties} data-direction={direction}
      onPointerEnter={(event) => onLook(event, computer.state === 'en_panne')} onPointerLeave={onLeave}>
      <td data-label="Poste" className="computer-name">
        <span className="computer-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><rect className="pc-laptop-screen" x="6" y="5" width="12" height="10" rx="1" fill="currentColor" stroke="none" /><rect x="5" y="4" width="14" height="12" rx="1.5" /><path d="M2.5 19h19l-2-3H4.5l-2 3Z" /></svg>
        </span>
        <div className="pc-computer-title"><strong>{computer.name}</strong>
          <CopyButton value={computer.reference} label="la référence" onCopy={(value) => onCopy(value, 'Référence')} />
        </div>
      </td>
      <td data-label="Hostname" className={sameHostname ? 'pc-hostname--same' : undefined}>
        <CopyButton value={computer.hostname} label="le hostname" onCopy={(value) => onCopy(value, 'Hostname')}>
          {sameHostname ? 'Copier' : computer.hostname}
        </CopyButton>
      </td>
      <td data-label="Marque / modèle">
        <span className="pc-computer-model">
          {brand && <span className="pc-brand-badge">{brand.toLocaleUpperCase()}</span>}
          {model && <span>{model}</span>}
          {!brand && !model && '—'}
        </span>
      </td>
      <td data-label="Type">{computer.allocation}</td>
      <td data-label="Emplacement">{computer.location ?? '—'}</td>
      <td data-label="État"><ComputerStatePill state={computer.state} /></td>
      <td data-label="Modifié" className="pc-computer-date">
        {date ? <><time dateTime={computer.updatedAt} title={date.exact}>{date.label}</time>{date.today && <span className="pc-new-badge">Nouveau</span>}</> : <span title="Date indisponible">—</span>}
      </td>
    </tr>
  );
});
