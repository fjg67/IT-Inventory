import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import type { ComputerCounts, PCState } from '../../types/inventory';
import { CountUp } from '../dashboard/CountUp';
import { InvenBotStage } from '../invenbot/InvenBotStage';
import { useMotionReduced } from '../invenbot/InvenBot';
import { useOnScreenAndVisible } from '../motion/useOnScreenAndVisible';
import { useMediaQuery } from '../dashboard/usePageMotion';
import { lifecycleStates } from './computerStates';
import { ConveyorParcels } from './ConveyorParcels';
import { PipelineStep } from './PipelineStep';

export function StatePipeline({ counts, selected, disabled, onSelect, technicianRef, gearUp }: {
  counts: ComputerCounts;
  selected: PCState | 'all';
  disabled: boolean;
  onSelect: (state: PCState | 'all') => void;
  technicianRef: RefObject<HTMLDivElement | null>;
  gearUp: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const active = useOnScreenAndVisible(ref);
  const reduced = useMotionReduced();
  const wide = useMediaQuery('(min-width: 900px)');
  const arrivalRef = useRef<HTMLSpanElement>(null);
  const jump = useRef<Animation | null>(null);
  useEffect(() => () => jump.current?.cancel(), []);
  useEffect(() => {
    if (!active || reduced) jump.current?.cancel();
  }, [active, reduced]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const step = root.querySelector<HTMLElement>(`[data-state="${selected === 'all' ? 'en_usinage' : selected}"]`);
      const flow = root.querySelector('.pc-pipeline__flow');
      if (!step || !flow) return;
      const box = root.getBoundingClientRect();
      const target = step.getBoundingClientRect();
      root.style.setProperty('--pc-bot-x', `${Math.max(0, Math.min(box.width - 96, target.left - box.left + target.width / 2 - 48))}px`);
      root.style.setProperty('--pc-conveyor-width', `${flow.getBoundingClientRect().width}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [selected]);

  function navigate(event: KeyboardEvent<HTMLElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-pipeline-step]'));
    const current = buttons.findIndex((button) => button === event.target);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }

  return (
    <section ref={ref} className="pc-pipeline" aria-label="Chaîne d’atelier, filtrer les postes par état"
      data-animated={active && !reduced} data-reduced={reduced} onKeyDown={navigate}>
      <header className="pc-pipeline__heading">
        <div><span className="eyebrow">CHAÎNE D’ATELIER</span><h3>Chaque poste, une prochaine étape.</h3></div>
        <button className="pc-pipeline__total" data-pipeline-step="" type="button" aria-pressed={selected === 'all'}
          aria-label={`${counts.total} postes au total, afficher tous les états`} disabled={disabled} onClick={() => onSelect('all')}>
          <strong><CountUp value={counts.total} duration={reduced ? 0 : 1100} /></strong><span>postes au total</span>
        </button>
      </header>
      <div ref={technicianRef} className="pc-pipeline__technician" onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget || event.propertyName !== 'transform' || !active || reduced) return;
        jump.current?.cancel();
        jump.current = arrivalRef.current?.animate?.([{ transform: 'translateY(0)' }, { transform: 'translateY(-9px)' }, { transform: 'translateY(0)' }], { duration: 360, easing: 'ease-out' }) ?? null;
      }}>
        <span ref={arrivalRef} className="pc-pipeline__arrival"><InvenBotStage size="small" workshop gearUp={gearUp} /></span>
      </div>
      <div className="pc-pipeline__flow">
        <ConveyorParcels active={active && !reduced && wide} />
        {lifecycleStates.map((state) => <PipelineStep key={state} state={state} count={counts[state]} total={counts.total}
          selected={selected === state} disabled={disabled} reduced={reduced} onSelect={onSelect} />)}
        <div className="pc-pipeline__fault">
          <PipelineStep state="en_panne" count={counts.en_panne} total={counts.total}
            selected={selected === 'en_panne'} disabled={disabled} reduced={reduced} onSelect={onSelect} />
        </div>
      </div>
    </section>
  );
}
