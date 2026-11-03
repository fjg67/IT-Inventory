/** Placeholders shimmer pendant le premier chargement (aria-hidden). */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton-layout" aria-hidden="true">
      <div className="dashboard-skeleton-kpis">
        {[0, 1, 2].map((key) => (
          <div className="skeleton-card" key={key}>
            <span className="skeleton skeleton--icon" />
            <span className="skeleton skeleton--line skeleton--short" />
            <span className="skeleton skeleton--value" />
            <span className="skeleton skeleton--line" />
          </div>
        ))}
      </div>
      <div className="dashboard-skeleton-grid">
        <div className="skeleton-card skeleton-card--panel">
          <span className="skeleton skeleton--line skeleton--short" />
          {[0, 1, 2].map((key) => (
            <span className="skeleton-row" key={key}>
              <span className="skeleton skeleton--icon" />
              <span className="skeleton skeleton--line" />
            </span>
          ))}
        </div>
        <div className="skeleton-card skeleton-card--panel">
          <span className="skeleton skeleton--line skeleton--short" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line skeleton--mid" />
        </div>
      </div>
    </div>
  );
}
