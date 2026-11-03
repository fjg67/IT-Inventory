const rows = Array.from({ length: 8 }, (_, index) => index);

export function DataTableSkeleton({ label, headers, numericColumns = [] }: {
  label: string;
  headers: readonly string[];
  numericColumns?: readonly number[];
}) {
  return (
    <div className="articles-skeleton data-table-skeleton" role="status" aria-label={label}>
      <table className="articles-table articles-table--skeleton" aria-hidden="true">
        <thead><tr>{headers.map((header, index) => <th key={header} className={numericColumns.includes(index) ? 'numeric' : undefined}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row}>{headers.map((header, index) => (
            <td key={header} data-label={header} className={numericColumns.includes(index) ? 'numeric' : undefined}>
              {index === 0 && <i className="skeleton-photo" />}
              <i className={`skeleton-line${index === 0 ? ' skeleton-line--name' : ''}`} />
            </td>
          ))}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
