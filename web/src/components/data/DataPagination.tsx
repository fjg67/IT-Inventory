import { useEffect, useRef, type RefObject } from 'react';
import { CountUp } from '../dashboard/CountUp';
import { isMotionReduced } from '../invenbot/motion';
import { useMotionReduced } from '../invenbot/InvenBot';

export function usePaginationScroll(ref: RefObject<HTMLElement | null>, pageIndex: number) {
  const previous = useRef(pageIndex);
  useEffect(() => {
    if (previous.current === pageIndex) return;
    previous.current = pageIndex;
    ref.current?.scrollIntoView({ behavior: isMotionReduced() ? 'auto' : 'smooth', block: 'start' });
  }, [ref, pageIndex]);
}

export function DataPagination({ pageIndex, pageSize, pageCount, total, loading, onPageChange }: {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const reduced = useMotionReduced();
  return (
    <nav className="pagination" aria-label="Pagination du tableau">
      <span>{`${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, total)} sur ${total}`}</span>
      <div>
        <button className="button button--subtle" type="button" disabled={pageIndex === 0 || loading} onClick={() => onPageChange(pageIndex - 1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>Précédent
        </button>
        <span className="pagination__page" aria-live="polite"><CountUp value={pageCount > 0 ? pageIndex + 1 : 0} duration={reduced ? 0 : 1100} /> / {pageCount}</span>
        <button className="button button--subtle" type="button" disabled={pageIndex + 1 >= pageCount || loading} onClick={() => onPageChange(pageIndex + 1)}>
          Suivant<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
        </button>
      </div>
    </nav>
  );
}
