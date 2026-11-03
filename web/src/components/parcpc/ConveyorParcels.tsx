import { useEffect, useRef, useState } from 'react';

export function ConveyorParcels({ active }: { active: boolean }) {
  const [parcels, setParcels] = useState<number[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!active) {
      setParcels([]);
      return;
    }
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const id = ++nextId.current;
        setParcels((current) => current.length < 3 ? [...current, id] : current);
        schedule();
      }, 2400 + Math.random() * 3600);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <span className="pc-conveyor" aria-hidden="true">
      {parcels.map((id) => (
        <i key={id} className="pc-conveyor__parcel" onAnimationEnd={() => setParcels((current) => current.filter((value) => value !== id))}>
          <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="12" rx="2" /><path d="M2 19h20l-3-3H5l-3 3Z" /></svg>
        </i>
      ))}
    </span>
  );
}
