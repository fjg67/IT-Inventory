import { memo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { ArticleListItem } from '../../types/inventory';
import { ArticlePhoto } from './ArticlePhoto';
import { StockGauge } from './StockGauge';
import { StatusPill } from './StatusPill';
import { CopyButton } from '../data/CopyButton';

export interface ArticleRowProps {
  article: ArticleListItem;
  index: number;
  direction: 'next' | 'previous';
  entering: boolean;
  onLowStockPointer: (event: ReactPointerEvent<HTMLTableRowElement>) => void;
  onLowStockLeave: () => void;
  onPreview: (name: string, url: string) => void;
  onCopyReference: (reference: string) => void;
}

const numberFormat = new Intl.NumberFormat('fr-FR');

export const ArticleRow = memo(function ArticleRow({
  article,
  index,
  direction,
  entering,
  onLowStockPointer,
  onLowStockLeave,
  onPreview,
  onCopyReference,
}: ArticleRowProps) {
  const low = article.quantity < article.minimumStock;
  const style = { '--article-row-index': Math.min(index, 24) } as CSSProperties;

  return (
    <tr
      className={`article-row${entering ? ' article-row--entering' : ''}${low ? ' article-row--low' : ''}`}
      style={style}
      data-direction={direction}
      onPointerEnter={low ? onLowStockPointer : undefined}
      onPointerLeave={low ? onLowStockLeave : undefined}
    >
      <td data-label="Article" className="article-name">
        <ArticlePhoto name={article.name} imageUrl={article.imageUrl} onPreview={onPreview} />
        <strong>{article.name}</strong>
      </td>
      <td data-label="Référence" className="article-reference">
        <CopyButton value={article.reference} label="la référence" onCopy={onCopyReference} />
      </td>
      <td data-label="Famille">{article.family ?? '—'}</td>
      <td data-label="Quantité" className="numeric quantity-cell">
        <span>{numberFormat.format(article.quantity)} <small>{article.unit}</small></span>
        <StockGauge quantity={article.quantity} minimumStock={article.minimumStock} />
      </td>
      <td data-label="Seuil" className="numeric">{numberFormat.format(article.minimumStock)}</td>
      <td data-label="Emplacement">{article.location ?? '—'}</td>
      <td data-label="Statut"><StatusPill quantity={article.quantity} minimumStock={article.minimumStock} /></td>
    </tr>
  );
});
