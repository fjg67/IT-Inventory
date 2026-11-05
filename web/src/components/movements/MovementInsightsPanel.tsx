import { useMemo, useRef } from 'react';
import { CountUp } from '../dashboard/CountUp';
import { InvenBot, useMotionReduced } from '../invenbot/InvenBot';
import { useOnScreenAndVisible } from '../motion/useOnScreenAndVisible';
import { classifyMovementType, movementFlowByDay, summarizeMovements } from './movementInsights';
import { MOVEMENT_COLORS } from '../../constants/movementColors';
import type { MovementListItem } from '../../types/inventory';
import './movement.css';

const numberFormat = new Intl.NumberFormat('fr-FR');
const typeLabels = [
  { key: 'entries', type: 'ENTRY', label: 'Entrées', color: 'entry' },
  { key: 'exits', type: 'EXIT', label: 'Sorties', color: 'exit' },
  { key: 'adjustments', type: 'ADJUSTMENT', label: 'Ajustements', color: 'adjustment' },
  { key: 'transfers', type: 'TRANSFER', label: 'Transferts', color: 'transfer' },
] as const;
const dateLabelFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: 'UTC' });

export function MovementInsightsPanel({
  items,
  period,
  ready,
  loading,
  error,
  selectedDate,
  onSelectDate,
  onRetry,
}: {
  items: MovementListItem[];
  period: '7days' | '30days' | 'all';
  ready: boolean;
  loading: boolean;
  error: string | null;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onRetry: () => void;
}) {
  const insights = useMemo(() => summarizeMovements(items), [items]);
  const trend = useMemo(() => movementFlowByDay(items, period), [items, period]);
  const peak = useMemo(
    () => Math.max(1, ...trend.map((day) => day.entries + day.exits + day.adjustments + day.transfers)),
    [trend],
  );
  const reduced = useMotionReduced();
  const conveyorRef = useRef<HTMLDivElement>(null);
  const conveyorActive = useOnScreenAndVisible(conveyorRef);
  const latest = useMemo(() => items.slice(0, 3).reverse(), [items]);

  return (
    <section className="movement-insights" aria-label="Synthèse des mouvements">
      <div className="movement-insights__heading">
        <div>
          <span className="eyebrow">VUE D’ENSEMBLE</span>
          <h3>Synthèse filtrée</h3>
        </div>
        {loading ? (
          <span className="movement-insights__loading" role="status">
            <InvenBot size="mini" state="checking" /> Calcul des flux…
          </span>
        ) : ready && (
          <span className={`movement-net${insights.netChange < 0 ? ' movement-net--negative' : ''}`}>
            Solde net (hors transferts) <strong>{insights.netChange > 0 ? '+' : ''}{numberFormat.format(insights.netChange)}</strong>
          </span>
        )}
      </div>

      {error && (
        <div className="movement-insights__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>Réessayer</button>
        </div>
      )}

      {ready ? (
        <>
          <div className="movement-summary-grid" aria-busy={loading}>
            <SummaryCard label="Entrées" count={insights.entryCount} quantity={`+${numberFormat.format(insights.entryQuantity)}`} tone="entry" />
            <SummaryCard label="Sorties" count={insights.exitCount} quantity={`−${numberFormat.format(insights.exitQuantity)}`} tone="exit" />
            <SummaryCard
              label="Ajustements"
              count={insights.adjustmentCount}
              quantity={`${insights.adjustmentDelta > 0 ? '+' : ''}${numberFormat.format(insights.adjustmentDelta)}`}
              tone="adjustment"
            />
            <SummaryCard label="Transferts" count={insights.transferCount} quantity={numberFormat.format(insights.transferQuantity)} tone="transfer" />
          </div>
          <p className="movement-insights__unit-note">Les quantités additionnent les valeurs enregistrées, même lorsque les articles utilisent des unités différentes.</p>
        </>
      ) : (
        <div className="movement-insights__placeholder" role={loading ? 'status' : 'note'}>
          {loading ? 'Chargement des indicateurs…' : 'La synthèse n’est pas disponible.'}
        </div>
      )}

      {ready && <div className="movement-flow-panel">
        <div className="movement-flow-panel__heading">
          <div>
            <h4>Flux par jour</h4>
            <p>
              {period === 'all'
                ? 'Les 30 derniers jours visibles · synthèse sur toute la période'
                : `${period === '7days' ? '7' : '30'} derniers jours`}
              {' · cliquez sur un jour pour filtrer le tableau'}
            </p>
          </div>
          {selectedDate && (
            <button type="button" className="movement-flow-clear" onClick={() => onSelectDate(null)}>
              Effacer le filtre
            </button>
          )}
        </div>
        <div className="movement-flow-legend" aria-label="Légende du graphique">
          {typeLabels.map((type) => (
            <span key={type.key}><i className={`movement-flow-legend__swatch movement-flow-legend__swatch--${type.color}`} style={{ backgroundColor: MOVEMENT_COLORS[type.type] }} />{type.label}</span>
          ))}
        </div>
        <div className="movement-flow-chart" role="group" aria-label="Nombre de mouvements par jour">
          {trend.map((day) => {
            const total = day.entries + day.exits + day.adjustments + day.transfers;
            const dateLabel = dateLabelFormatter.format(new Date(`${day.date}T00:00:00Z`));
            const selected = selectedDate === day.date;
            return (
              <button
                className={`movement-flow-day${selected ? ' movement-flow-day--selected' : ''}`}
                type="button"
                key={day.date}
                aria-pressed={selected}
                aria-label={`${dateLabel} : ${total} mouvement${total > 1 ? 's' : ''}. Entrées ${day.entries}, sorties ${day.exits}, ajustements ${day.adjustments}, transferts ${day.transfers}. Filtrer le tableau par cette date.`}
                disabled={total === 0 && !selected}
                onClick={() => onSelectDate(selected ? null : day.date)}
              >
                <span className="movement-flow-day__bar" aria-hidden="true">
                  <span className="movement-flow-day__stack" style={{ height: `${(total / peak) * 100}%` }}>
                    {typeLabels.map((type) => {
                      const count = day[type.key];
                      return count > 0 ? (
                        <i
                          key={type.key}
                          className={`movement-flow-day__segment movement-flow-day__segment--${type.color}`}
                          style={{ flexGrow: count }}
                        />
                      ) : null;
                    })}
                  </span>
                </span>
                <span className="movement-flow-day__label">{dayFormatter.format(new Date(`${day.date}T00:00:00Z`))}</span>
              </button>
            );
          })}
        </div>
      </div>}

      <div
        ref={conveyorRef}
        className={`movement-conveyor${reduced || !conveyorActive ? ' movement-conveyor--paused' : ''}`}
        aria-hidden="true"
      >
        <div className="movement-conveyor__label">Flux récent</div>
        <div className="movement-conveyor__track">
          {!ready ? (
            <span className="movement-conveyor__empty">{loading ? 'Chargement des mouvements récents…' : 'Données récentes indisponibles'}</span>
          ) : latest.length === 0 ? (
            <span className="movement-conveyor__empty">En attente du prochain mouvement</span>
          ) : latest.map((item) => (
            <span className={`movement-conveyor__parcel movement-conveyor__parcel--${classifyMovementType(item.type)?.toLocaleLowerCase('fr-FR') ?? 'other'}`} key={item.id}>
              <i />
              <strong>{item.articleReference || item.articleName}</strong>
              <small>{labelForType(item.type)} · {formatQuantity(item.quantity)}</small>
            </span>
          ))}
        </div>
        <span className="sr-only">Illustration des mouvements récents, déjà détaillés dans le tableau.</span>
      </div>
    </section>
  );
}

function SummaryCard({ label, count, quantity, tone }: {
  label: string;
  count: number;
  quantity: string;
  tone: string;
}) {
  return (
    <article className={`movement-summary-card movement-summary-card--${tone}`}>
      <span>{label}</span>
      <strong><CountUp value={count} /></strong>
      <small>{quantity} en quantité cumulée</small>
    </article>
  );
}

function labelForType(type: string) {
  switch (type.toLocaleUpperCase('fr-FR')) {
    case 'ENTRY':
    case 'ENTREE':
    case 'ENTRÉE': return 'Entrée';
    case 'EXIT':
    case 'SORTIE': return 'Sortie';
    case 'ADJUSTMENT':
    case 'AJUSTEMENT': return 'Ajustement';
    case 'TRANSFER':
    case 'TRANSFERT':
    case 'TRANSFERT_DEPART':
    case 'TRANSFERT_ARRIVEE': return 'Transfert';
    default: return type;
  }
}

function formatQuantity(quantity: number) {
  return `${quantity > 0 ? '+' : ''}${numberFormat.format(quantity)}`;
}
