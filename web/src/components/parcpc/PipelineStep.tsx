import type { PCState } from '../../types/inventory';
import { CountUp } from '../dashboard/CountUp';
import { useInView } from '../dashboard/useInView';
import { ComputerStateIcon, computerStateLabels } from './computerStates';

export function PipelineStep({
  state, count, total, selected, disabled, reduced, onSelect,
}: {
  state: PCState;
  count: number;
  total: number;
  selected: boolean;
  disabled: boolean;
  reduced: boolean;
  onSelect: (state: PCState) => void;
}) {
  const [ref, inView] = useInView<HTMLButtonElement>(0.1);
  return (
    <button
      ref={ref}
      className={`pc-pipeline-step pc-state--${state}`}
      type="button"
      data-pipeline-step=""
      data-state={state}
      aria-pressed={selected}
      aria-label={`${computerStateLabels[state]}, ${count} poste${count > 1 ? 's' : ''}, filtrer`}
      disabled={disabled}
      onClick={() => onSelect(state)}
    >
      <span className="pc-pipeline-step__icon"><ComputerStateIcon state={state} /></span>
      <span className="pc-pipeline-step__label">{computerStateLabels[state]}</span>
      <strong><CountUp value={count} start={inView} duration={reduced ? 0 : 1100} /></strong>
      <span className="pc-pipeline-step__gauge" aria-hidden="true">
        <i style={{ transform: `scaleX(${inView && total > 0 ? Math.min(count / total, 1) : 0})` }} />
      </span>
    </button>
  );
}
